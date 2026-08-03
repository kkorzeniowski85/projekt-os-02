/**
 * Warstwa audio.
 *
 * Zasada z briefu: audio WYCHODZĄCE tak, automatyczna ocena wymowy DZIECKA —
 * nie. Mikrofon jest używany w jednym miejscu i tylko przez dorosłego: w
 * studiu głosek w trybie rodzica (lib/recordings.ts). Nagranie nigdzie nie
 * wychodzi i nic go nie ocenia.
 *
 * Trzy źródła dźwięku, w tej kolejności:
 *  1. Nagranie rodzica z IndexedDB — jeśli istnieje, wygrywa ze wszystkim.
 *  2. Plik w /public/audio/... — nagranie wgrane do aplikacji.
 *  3. Synteza mowy przeglądarki (en-GB) — awaryjnie, tylko dla całych słów.
 *
 * WAŻNE ZASTRZEŻENIE: syntezator NIE potrafi wiarygodnie wypowiedzieć czystej
 * głoski (np. samego "sh" bez doklejonego "e"). Dlatego dla głosek bez nagrania
 * odtwarzamy przykładowe SŁOWO i zwracamy `approximate: true`, żeby interfejs
 * mógł uczciwie pokazać, że to namiastka. Dziecko nie powinno utrwalać
 * przekręconej głoski — patrz docs/audio.md.
 */

import { getRecordingUrl } from "./recordings";

export type PlaybackSource =
  | "recording"
  | "clip"
  | "tts"
  | "tts-example"
  | "unavailable";

export type PlaybackResult = {
  source: PlaybackSource;
  /** true = to nie jest to, o co prosiliśmy (np. słowo zamiast czystej głoski). */
  approximate: boolean;
};

// Na GitHub Pages aplikacja siedzi w podkatalogu, więc ścieżki do nagrań muszą
// mieć ten sam przedrostek co reszta aplikacji (patrz next.config.ts).
const CLIP_BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/audio`;

/**
 * Nagrania z generatora są w MP3, ale nagranie zrobione w przeglądarce i wgrane
 * do folderu będzie webm (Chrome/Android) albo m4a (Safari). Szukamy po kolei.
 */
const CLIP_EXTENSIONS = ["mp3", "webm", "m4a", "wav"];

export function wordClipBase(word: string): string {
  return `${CLIP_BASE}/words/${word.toLowerCase()}`;
}

export function phonemeClipBase(soundId: string): string {
  return `${CLIP_BASE}/phonemes/${soundId}`;
}

/** Kanoniczna ścieżka (MP3) — do wyświetlania i do generatora. */
export function wordClipPath(word: string): string {
  return `${wordClipBase(word)}.mp3`;
}

export function phonemeClipPath(soundId: string): string {
  return `${phonemeClipBase(soundId)}.mp3`;
}

const clipAvailability = new Map<string, Promise<boolean>>();

/** Sprawdza (raz na ścieżkę, potem z cache), czy nagranie w ogóle istnieje. */
export function clipExists(path: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  let pending = clipAvailability.get(path);
  if (!pending) {
    pending = fetch(path, { method: "HEAD" })
      .then((response) => response.ok)
      .catch(() => false);
    clipAvailability.set(path, pending);
  }
  return pending;
}

const resolvedClips = new Map<string, Promise<string | null>>();

/** Pierwsze istniejące rozszerzenie dla danej nazwy pliku, albo null. */
export function findClip(base: string): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  let pending = resolvedClips.get(base);
  if (!pending) {
    pending = (async () => {
      for (const extension of CLIP_EXTENSIONS) {
        const path = `${base}.${extension}`;
        if (await clipExists(path)) return path;
      }
      return null;
    })();
    resolvedClips.set(base, pending);
  }
  return pending;
}

let currentClip: HTMLAudioElement | null = null;

async function playUrl(url: string): Promise<boolean> {
  currentClip?.pause();
  const audio = new Audio(url);
  currentClip = audio;
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

async function playClip(path: string): Promise<boolean> {
  if (!(await clipExists(path))) return false;
  return playUrl(path);
}

/** Nagranie rodzica, jeśli istnieje dla tego grafemu. */
async function playParentRecording(graphemeId: string): Promise<boolean> {
  const url = await getRecordingUrl(graphemeId);
  return url ? playUrl(url) : false;
}

// --- Synteza mowy ----------------------------------------------------------

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Brytyjski angielski ma priorytet — dziecko idzie do szkoły w UK.
  cachedVoice =
    voices.find((voice) => voice.lang === "en-GB") ??
    voices.find((voice) => voice.lang.startsWith("en-GB")) ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    null;

  return cachedVoice;
}

export function primeSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  pickVoice();
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    cachedVoice = null;
    pickVoice();
  });
}

export type VoiceStatus = {
  supported: boolean;
  voiceName: string | null;
  lang: string | null;
  isBritish: boolean;
};

export function getVoiceStatus(): VoiceStatus {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { supported: false, voiceName: null, lang: null, isBritish: false };
  }
  const voice = pickVoice();
  return {
    supported: true,
    voiceName: voice?.name ?? null,
    lang: voice?.lang ?? null,
    isBritish: Boolean(voice?.lang?.startsWith("en-GB")),
  };
}

function speak(text: string, rate = 0.8): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? "en-GB";
  utterance.rate = rate; // wolniej niż domyślnie — dziecko dopiero łapie dźwięki
  window.speechSynthesis.speak(utterance);
  return true;
}

// --- API używane przez interfejs -------------------------------------------

/** Odtwarza całe słowo. */
export async function playWord(word: string): Promise<PlaybackResult> {
  const clip = await findClip(wordClipBase(word));
  if (clip && (await playUrl(clip))) {
    return { source: "clip", approximate: false };
  }
  return speak(word)
    ? { source: "tts", approximate: false }
    : { source: "unavailable", approximate: false };
}

/**
 * Odtwarza czystą głoskę. Bez nagrania spada do przykładowego słowa —
 * i mówi o tym wprost przez `approximate`.
 */
export async function playPhoneme(
  soundId: string,
  exampleWord: string,
): Promise<PlaybackResult> {
  if (await playParentRecording(soundId)) {
    return { source: "recording", approximate: false };
  }
  const clip = await findClip(phonemeClipBase(soundId));
  if (clip && (await playUrl(clip))) {
    return { source: "clip", approximate: false };
  }
  return speak(exampleWord, 0.7)
    ? { source: "tts-example", approximate: true }
    : { source: "unavailable", approximate: true };
}

/**
 * Odtwarza czystą głoskę TYLKO z prawdziwego nagrania (rodzica albo pliku).
 *
 * Używane tam, gdzie namiastka byłaby szkodliwa — np. przy stukaniu w kolejne
 * kawałki słowa. Syntezator przeczytałby "p" jako nazwę litery ("pi"), a
 * doklejenie "y" na końcu ("py") to dokładnie ten błąd, przed którym ostrzegają
 * programy phonics. Lepiej nie odtworzyć nic i oddać głos rodzicowi.
 */
export async function playPhonemeStrict(graphemeId: string): Promise<PlaybackResult> {
  if (await playParentRecording(graphemeId)) {
    return { source: "recording", approximate: false };
  }
  const clip = await findClip(phonemeClipBase(graphemeId));
  if (clip && (await playUrl(clip))) {
    return { source: "clip", approximate: false };
  }
  return { source: "unavailable", approximate: false };
}

/** Krótki sygnał zwrotny — bez plików, generowany w przeglądarce. */
export function playFeedbackTone(kind: "good" | "try-again"): void {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  const context = new AudioCtx();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  const notes = kind === "good" ? [660, 880] : [330, 262];
  oscillator.frequency.setValueAtTime(notes[0], context.currentTime);
  oscillator.frequency.setValueAtTime(notes[1], context.currentTime + 0.12);

  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.3);

  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.32);
  oscillator.onended = () => void context.close();
}

/**
 * Odtwarza konkretny plik, bez żadnego planu awaryjnego.
 * Do przesłuchiwania nagrań w panelu rodzica — tam chodzi o to, żeby usłyszeć
 * dokładnie ten plik, który usłyszy dziecko, albo nie usłyszeć nic.
 */
export async function playClipFile(path: string): Promise<boolean> {
  return playClip(path);
}

/** Dla panelu rodzica: które pliki są na miejscu (w dowolnym formacie). */
export async function auditClips(
  bases: string[],
): Promise<{ base: string; path: string | null }[]> {
  return Promise.all(
    bases.map(async (base) => ({ base, path: await findClip(base) })),
  );
}
