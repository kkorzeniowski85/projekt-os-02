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

/**
 * JEDEN współdzielony element audio zamiast nowego na każde odtworzenie.
 * To celowy wzorzec pod iOS: Safari pozwala grać elementowi, który choć raz
 * zagrał w geście użytkownika — późniejsza podmiana `src` już nie wymaga
 * gestu. Nowy element tworzony z opóźnieniem (po setTimeout) bywa blokowany.
 */
let sharedAudio: HTMLAudioElement | null = null;

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) sharedAudio = new Audio();
  return sharedAudio;
}

type PlayStatus = "ok" | "blocked" | "failed";

async function playUrl(url: string): Promise<PlayStatus> {
  const audio = getSharedAudio();
  audio.pause();
  audio.muted = false;
  audio.src = url;
  try {
    await audio.play();
    return "ok";
  } catch (error) {
    return (error as DOMException)?.name === "NotAllowedError" ? "blocked" : "failed";
  }
}

async function playClip(path: string): Promise<PlayStatus> {
  if (!(await clipExists(path))) return "failed";
  return playUrl(path);
}

/** Nagranie rodzica, jeśli istnieje dla tego grafemu. */
async function playParentRecording(graphemeId: string): Promise<PlayStatus> {
  const url = await getRecordingUrl(graphemeId);
  return url ? playUrl(url) : "failed";
}

let unlockAttempted = false;

/**
 * Odblokowanie audio — wywoływane w handlerze kliknięcia (start sesji).
 * Gra wyciszone, krótkie prawdziwe nagranie na współdzielonym elemencie,
 * budzi syntezę mowy pustą wypowiedzią i wznawia AudioContext sygnałów.
 * Wszystko best-effort: gdy się nie uda, interfejs i tak pokaże podpowiedź
 * "stuknij 🔊" przy pierwszym zablokowanym odtworzeniu.
 */
export function unlockAudio(): void {
  if (typeof window === "undefined" || unlockAttempted) return;
  unlockAttempted = true;

  try {
    const audio = getSharedAudio();
    audio.muted = true;
    audio.src = wordClipPath("the");
    const unlockSrc = audio.src;
    audio
      .play()
      .then(() => {
        // Nie zatrzymuj, jeśli w międzyczasie gra już coś prawdziwego.
        if (audio.src === unlockSrc) {
          audio.pause();
          audio.currentTime = 0;
        }
        audio.muted = false;
      })
      .catch(() => {
        audio.muted = false;
      });
  } catch {
    // brak wsparcia — trudno
  }

  try {
    window.speechSynthesis?.speak(new SpeechSynthesisUtterance(""));
  } catch {
    // jw.
  }

  const context = getToneContext();
  if (context?.state === "suspended") void context.resume();
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
  if (clip) {
    const status = await playUrl(clip);
    if (status === "ok") return { source: "clip", approximate: false };
    // Zablokowane = potrzebny gest użytkownika. Nie próbujemy syntezą —
    // też byłaby zablokowana; interfejs pokaże "stuknij 🔊".
    if (status === "blocked") return { source: "unavailable", approximate: false };
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
  if ((await playParentRecording(soundId)) === "ok") {
    return { source: "recording", approximate: false };
  }
  const clip = await findClip(phonemeClipBase(soundId));
  if (clip) {
    const status = await playUrl(clip);
    if (status === "ok") return { source: "clip", approximate: false };
    if (status === "blocked") return { source: "unavailable", approximate: false };
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
  if ((await playParentRecording(graphemeId)) === "ok") {
    return { source: "recording", approximate: false };
  }
  const clip = await findClip(phonemeClipBase(graphemeId));
  if (clip && (await playUrl(clip)) === "ok") {
    return { source: "clip", approximate: false };
  }
  return { source: "unavailable", approximate: false };
}

/**
 * Jeden AudioContext na całą sesję — iOS ma twardy limit równoczesnych
 * kontekstów, więc tworzenie nowego przy każdym sygnale kończy się ciszą.
 */
let toneContext: AudioContext | null = null;

function getToneContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (toneContext) return toneContext;
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  toneContext = new AudioCtx();
  return toneContext;
}

type NoteSpec = {
  freq: number;
  /** Start względem "teraz", w sekundach. */
  at: number;
  dur: number;
  vol?: number;
  type?: OscillatorType;
};

function scheduleNote(context: AudioContext, destination: AudioNode, note: NoteSpec): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = note.type ?? "triangle";
  oscillator.frequency.value = note.freq;

  const start = context.currentTime + note.at;
  const volume = note.vol ?? 0.16;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);

  oscillator.connect(gain).connect(destination);
  oscillator.start(start);
  oscillator.stop(start + note.dur + 0.05);
}

/** Dzwoneczek pojawiającej się gwiazdki — kolejne gwiazdki brzmią coraz wyżej. */
export function playStarDing(index: number): void {
  const context = getToneContext();
  if (!context) return;
  if (context.state === "suspended") void context.resume();

  const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
  const freq = freqs[Math.min(index, freqs.length - 1)];
  scheduleNote(context, context.destination, { freq, at: 0, dur: 0.35, vol: 0.14 });
  scheduleNote(context, context.destination, {
    freq: freq * 2,
    at: 0,
    dur: 0.25,
    vol: 0.05,
    type: "sine",
  });
}

/**
 * Fanfara zwycięzcy na koniec sesji.
 *
 * Rodzic może podłożyć własną muzykę: plik public/audio/celebration.mp3
 * (albo .webm/.m4a/.wav) wygrywa z syntezą. Bez pliku gra krótka, ORYGINALNA
 * fanfara (do-mi-sol-DO… ti-DO z akordem) — celowo nie cytat z żadnej gry
 * ani filmu, żeby nie wnosić cudzych melodii.
 */
export async function playVictoryFanfare(): Promise<void> {
  const clip = await findClip(`${CLIP_BASE}/celebration`);
  if (clip && (await playUrl(clip)) === "ok") return;

  const context = getToneContext();
  if (!context) return;
  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  const master = context.createGain();
  master.gain.value = 0.9;
  master.connect(context.destination);

  const C4 = 261.63, G4 = 392.0, C5 = 523.25, E5 = 659.25, G5 = 783.99, B5 = 987.77, C6 = 1046.5;

  const melody: NoteSpec[] = [
    { freq: C5, at: 0.0, dur: 0.14 },
    { freq: E5, at: 0.13, dur: 0.14 },
    { freq: G5, at: 0.26, dur: 0.14 },
    { freq: C6, at: 0.4, dur: 0.5, vol: 0.18 },
    { freq: B5, at: 0.95, dur: 0.13, vol: 0.13 },
    { freq: C6, at: 1.1, dur: 0.75, vol: 0.18 },
  ];
  // Cichy błysk oktawę wyżej + bas i akord finałowy — brzmi jak "orkiestra",
  // a to wciąż tylko kilka oscylatorów.
  const shimmer: NoteSpec[] = melody.map((note) => ({
    ...note,
    freq: note.freq * 2,
    vol: (note.vol ?? 0.16) * 0.25,
    type: "sine" as const,
  }));
  const bass: NoteSpec[] = [
    { freq: C4, at: 0.0, dur: 0.35, vol: 0.1 },
    { freq: G4, at: 0.4, dur: 0.45, vol: 0.09 },
    { freq: C4, at: 1.1, dur: 0.75, vol: 0.1 },
  ];
  const finalChord: NoteSpec[] = [
    { freq: E5, at: 1.1, dur: 0.75, vol: 0.07, type: "sine" },
    { freq: G5, at: 1.1, dur: 0.75, vol: 0.07, type: "sine" },
  ];

  for (const note of [...melody, ...shimmer, ...bass, ...finalChord]) {
    scheduleNote(context, master, note);
  }
}

/** Krótki sygnał zwrotny — bez plików, generowany w przeglądarce. */
export function playFeedbackTone(kind: "good" | "try-again"): void {
  const context = getToneContext();
  if (!context) return;
  if (context.state === "suspended") void context.resume();

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
}

/**
 * Odtwarza konkretny plik, bez żadnego planu awaryjnego.
 * Do przesłuchiwania nagrań w panelu rodzica — tam chodzi o to, żeby usłyszeć
 * dokładnie ten plik, który usłyszy dziecko, albo nie usłyszeć nic.
 */
export async function playClipFile(path: string): Promise<boolean> {
  return (await playClip(path)) === "ok";
}

/** Dla panelu rodzica: które pliki są na miejscu (w dowolnym formacie). */
export async function auditClips(
  bases: string[],
): Promise<{ base: string; path: string | null }[]> {
  return Promise.all(
    bases.map(async (base) => ({ base, path: await findClip(base) })),
  );
}
