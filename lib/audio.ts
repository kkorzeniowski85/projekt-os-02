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

import { audioSlug } from "./curriculum/vocab";
import { getRecordingUrl } from "./recordings";

export type PlaybackSource =
  | "recording"
  | "clip"
  | "clip-example"
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
// Kolejność ma znaczenie dla liczby nietrafionych zapytań: mp3 mają słowa
// z generatora, wav — głoski wycięte z nagrań. Reszta to formaty, w których
// nagrywa przeglądarka (rodzic wgrywający własne nagranie).
const CLIP_EXTENSIONS = ["mp3", "wav", "webm", "m4a"];

export function wordClipBase(word: string): string {
  return `${CLIP_BASE}/words/${audioSlug(word)}`;
}

export function phonemeClipBase(soundId: string): string {
  return `${CLIP_BASE}/phonemes/${soundId}`;
}

export function phraseClipBase(text: string): string {
  return `${CLIP_BASE}/phrases/${audioSlug(text)}`;
}

/** Kanoniczna ścieżka (MP3) — do wyświetlania i do generatora. */
export function phraseClipPath(text: string): string {
  return `${phraseClipBase(text)}.mp3`;
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
 * Odtwarza cały zwrot toru 2.
 *
 * W przeciwieństwie do czystej głoski, zdanie syntezator wymawia sensownie —
 * to jest dokładnie to, do czego służy. Dlatego zapasowa synteza jest tu
 * uczciwym rozwiązaniem, a nie namiastką, i `approximate` zostaje na false.
 * Nagranie brytyjskiego głosu jest lepsze (i po `npm run audio` wygrywa), ale
 * jego brak nie unieruchamia ćwiczenia.
 */
export async function playPhrase(text: string): Promise<PlaybackResult> {
  const clip = await findClip(phraseClipBase(text));
  if (clip) {
    const status = await playUrl(clip);
    if (status === "ok") return { source: "clip", approximate: false };
    if (status === "blocked") return { source: "unavailable", approximate: false };
  }
  // Wolniej niż pojedyncze słowo: całe zdanie w obcym języku dziecko musi
  // zdążyć rozłożyć na kawałki.
  return speak(text, 0.75)
    ? { source: "tts", approximate: false }
    : { source: "unavailable", approximate: false };
}

/**
 * Odtwarza czystą głoskę. Bez nagrania spada do przykładowego SŁOWA —
 * najpierw z brytyjskiego nagrania (te mamy dla wszystkich słów lekcji),
 * dopiero w ostateczności z syntezatora urządzenia, który bywa niebrytyjski.
 * O namiastce mówi wprost przez `approximate`.
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
  const exampleClip = await findClip(wordClipBase(exampleWord));
  if (exampleClip) {
    const status = await playUrl(exampleClip);
    if (status === "ok") return { source: "clip-example", approximate: true };
    if (status === "blocked") return { source: "unavailable", approximate: true };
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

function scheduleNote(
  context: AudioContext,
  destination: AudioNode,
  note: NoteSpec,
): OscillatorNode {
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
  return oscillator;
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

/** Uderzenie kotłów — niskie, szybko gasnące, daje "orkiestrowy" ciężar. */
function scheduleTimpani(
  context: AudioContext,
  destination: AudioNode,
  at: number,
  freq = 73.42,
  vol = 0.5,
): OscillatorNode {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + at;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(freq * 1.6, start);
  oscillator.frequency.exponentialRampToValueAtTime(freq, start + 0.08);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);

  oscillator.connect(gain).connect(destination);
  oscillator.start(start);
  oscillator.stop(start + 0.6);
  return oscillator;
}

/** Zatrzymanie muzyki — gdy dziecko klika dalej, nie ma grać w tle. */
let stopVictory: (() => void) | null = null;

export function stopVictoryFanfare(): void {
  stopVictory?.();
  stopVictory = null;
}

/**
 * Hymn zwycięzcy na koniec sesji — około 10 sekund.
 *
 * Melodia jest w CAŁOŚCI ORYGINALNA, skomponowana na potrzeby tej aplikacji.
 * Utrzymana w stylistyce kina superbohaterskiego (fanfara instrumentów dętych,
 * kotły, wznoszący temat, wielki akord finałowy), ale nie zawiera ani jednej
 * frazy z istniejących ścieżek filmowych — te są chronione prawem autorskim.
 *
 * Rodzic może podłożyć własną muzykę: plik public/audio/celebration.mp3
 * (albo .webm/.m4a/.wav) wygrywa z syntezą.
 */
export async function playVictoryFanfare(): Promise<void> {
  stopVictoryFanfare();

  const clip = await findClip(`${CLIP_BASE}/celebration`);
  if (clip && (await playUrl(clip)) === "ok") {
    stopVictory = () => {
      const audio = getSharedAudio();
      audio.pause();
      audio.currentTime = 0;
    };
    return;
  }

  const context = getToneContext();
  if (!context) return;
  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  // Filtr dolnoprzepustowy zamienia ostrą piłę w miękki, "dęty" ton.
  // Poziom dobrany pomiarem: szczyt sygnału ma być porównywalny z nagraniami
  // słów, żeby finał brzmiał donośnie, ale bez przesterowania (pilnuje limiter).
  const master = context.createGain();
  master.gain.value = 1.15;
  const brass = context.createBiquadFilter();
  brass.type = "lowpass";
  brass.frequency.value = 2600;
  brass.Q.value = 0.7;

  // Limiter: przy 9 głosach naraz suma obwiedni potrafi przekroczyć 1.0, a
  // wtedy WebAudio obcina falę i słychać trzask. Kompresor pilnuje szczytów
  // niezależnie od tego, jak nuty się na siebie nałożą.
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -5;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;

  brass.connect(master);
  master.connect(limiter);
  limiter.connect(context.destination);

  const C3 = 130.81, F3 = 174.61, G3 = 196.0, C4 = 261.63;
  const G4 = 392.0, A4 = 440.0, B4 = 493.88;
  const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99;
  const A5 = 880.0, B5 = 987.77, C6 = 1046.5, D6 = 1174.66, E6 = 1318.51;

  const T = "sawtooth" as const;

  // Melodia w czterech frazach: wezwanie → temat → wznoszenie → finał.
  const melody: NoteSpec[] = [
    // Wezwanie (fanfara powtarzanych dźwięków, jak sygnał do zbiórki)
    { freq: G4, at: 0.0, dur: 0.16, vol: 0.15, type: T },
    { freq: G4, at: 0.18, dur: 0.16, vol: 0.15, type: T },
    { freq: G4, at: 0.36, dur: 0.16, vol: 0.15, type: T },
    { freq: C5, at: 0.56, dur: 0.55, vol: 0.19, type: T },
    { freq: E5, at: 1.2, dur: 0.3, vol: 0.16, type: T },
    { freq: G5, at: 1.52, dur: 0.5, vol: 0.19, type: T },
    // Temat główny
    { freq: C6, at: 2.1, dur: 0.6, vol: 0.2, type: T },
    { freq: B5, at: 2.74, dur: 0.2, vol: 0.15, type: T },
    { freq: A5, at: 2.95, dur: 0.2, vol: 0.15, type: T },
    { freq: G5, at: 3.16, dur: 0.62, vol: 0.19, type: T },
    { freq: E5, at: 3.82, dur: 0.26, vol: 0.15, type: T },
    { freq: F5, at: 4.1, dur: 0.26, vol: 0.15, type: T },
    { freq: G5, at: 4.38, dur: 0.66, vol: 0.19, type: T },
    // Wznoszenie ku szczytowi
    { freq: A5, at: 5.1, dur: 0.26, vol: 0.16, type: T },
    { freq: B5, at: 5.38, dur: 0.26, vol: 0.16, type: T },
    { freq: C6, at: 5.66, dur: 0.5, vol: 0.19, type: T },
    { freq: D6, at: 6.2, dur: 0.28, vol: 0.17, type: T },
    { freq: E6, at: 6.5, dur: 0.72, vol: 0.21, type: T },
    { freq: D6, at: 7.26, dur: 0.22, vol: 0.16, type: T },
    { freq: C6, at: 7.5, dur: 0.34, vol: 0.18, type: T },
    // Rozbieg i akord finałowy
    { freq: G5, at: 7.88, dur: 0.2, vol: 0.16, type: T },
    { freq: A5, at: 8.1, dur: 0.2, vol: 0.16, type: T },
    { freq: B5, at: 8.32, dur: 0.2, vol: 0.17, type: T },
    { freq: C6, at: 8.54, dur: 1.5, vol: 0.22, type: T },
  ];

  // Cichy błysk oktawę wyżej — dodaje blasku bez podbijania głośności.
  const shimmer: NoteSpec[] = melody.map((note) => ({
    ...note,
    freq: note.freq * 2,
    vol: (note.vol ?? 0.16) * 0.16,
    type: "sine" as const,
  }));

  const bass: NoteSpec[] = [
    { freq: C3, at: 0.0, dur: 0.5, vol: 0.13, type: T },
    { freq: C3, at: 0.56, dur: 0.9, vol: 0.13, type: T },
    { freq: C3, at: 2.1, dur: 0.95, vol: 0.13, type: T },
    { freq: G3, at: 3.16, dur: 0.95, vol: 0.12, type: T },
    { freq: C3, at: 4.38, dur: 0.9, vol: 0.13, type: T },
    { freq: F3, at: 5.1, dur: 1.2, vol: 0.12, type: T },
    { freq: G3, at: 6.5, dur: 1.2, vol: 0.13, type: T },
    { freq: C3, at: 8.54, dur: 1.6, vol: 0.14, type: T },
  ];

  // Akord C-dur pod ostatnią nutą — "wielkie zakończenie".
  const finalChord: NoteSpec[] = [
    { freq: C4, at: 8.54, dur: 1.5, vol: 0.09, type: T },
    { freq: E5, at: 8.54, dur: 1.5, vol: 0.08, type: T },
    { freq: G5, at: 8.54, dur: 1.5, vol: 0.08, type: T },
  ];

  const oscillators: OscillatorNode[] = [];
  for (const note of [...melody, ...shimmer, ...bass, ...finalChord]) {
    oscillators.push(scheduleNote(context, brass, note));
  }
  for (const [at, vol] of [
    [0.0, 0.26],
    [0.56, 0.3],
    [2.1, 0.3],
    [4.38, 0.26],
    [6.5, 0.32],
    [8.54, 0.36],
  ] as const) {
    oscillators.push(scheduleTimpani(context, master, at, 73.42, vol));
  }

  stopVictory = () => {
    // Krótkie wyciszenie zamiast twardego cięcia — inaczej słychać trzask.
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.0001, now + 0.12);
    oscillators.forEach((oscillator) => {
      try {
        oscillator.stop(now + 0.15);
      } catch {
        // już zatrzymany
      }
    });
  };
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
