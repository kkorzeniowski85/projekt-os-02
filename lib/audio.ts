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
  | "unavailable"
  /** Przerwane przez nowsze odtworzenie — to nie brak nagrania. */
  | "interrupted";

/**
 * Dlaczego nic nie zagrało (przy "unavailable"):
 *  - "missing" — nagrania naprawdę nie ma,
 *  - "blocked" — przeglądarka czeka na gest (stuknięcie),
 *  - "network" — plik nie odpowiedział na czas (słabe łącze) albo się nie wczytał.
 */
export type UnavailableReason = "missing" | "blocked" | "network";

export type PlaybackResult = {
  source: PlaybackSource;
  /** true = to nie jest to, o co prosiliśmy (np. słowo zamiast czystej głoski). */
  approximate: boolean;
  reason?: UnavailableReason;
};

// Na GitHub Pages aplikacja siedzi w podkatalogu, więc ścieżki do nagrań muszą
// mieć ten sam przedrostek co reszta aplikacji (patrz next.config.ts).
const CLIP_BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/audio`;

/**
 * Nagrania z generatora są w MP3, ale nagranie zrobione w przeglądarce i wgrane
 * do folderu będzie webm (Chrome/Android) albo m4a (Safari). Szukamy po kolei.
 */
// Kolejność = pierwszeństwo: mp3 mają słowa z generatora, a dla głosek to
// lepsze nagranie (Azure albo native speaker z docs/audio.md) dołożone obok
// wyciętego wav — ma z nim wygrywać. webm/m4a to formaty, w których nagrywa
// przeglądarka (rodzic wgrywający własne nagranie).
const CLIP_EXTENSIONS = ["mp3", "wav", "webm", "m4a"];
/**
 * Głoski: wycięty wav (jest dla każdej) na końcu. Nagranie rodzica pobrane
 * przyciskiem ⤓ i wrzucone do public/audio/phonemes/ (docs/audio.md, Droga 1)
 * ma z nim wygrywać, a obok zostaje wav z repozytorium.
 */
const PHONEME_CLIP_EXTENSIONS = ["mp3", "webm", "m4a", "wav"];

function clipExtensions(base: string): string[] {
  return base.startsWith(`${CLIP_BASE}/phonemes/`) ? PHONEME_CLIP_EXTENSIONS : CLIP_EXTENSIONS;
}

/**
 * Plik, który najpewniej istnieje, gdy sieć nie odpowiada: głoski w aplikacji
 * są w wav (wycięte z nagrań), reszta w mp3 z generatora (patrz lookupClip).
 */
function likelyExtension(base: string): string {
  return base.startsWith(`${CLIP_BASE}/phonemes/`) ? "wav" : "mp3";
}

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

/** "unknown" = nie wiadomo (brak sieci, limit czasu, błąd serwera). */
type ClipState = "yes" | "no" | "unknown";

/** Dłużej nie czekamy na odpowiedź — potem gra zapas (synteza, słowo). */
const HEAD_TIMEOUT_MS = 3000;
/** Tyle pamiętamy „nie wiadomo", żeby każde stuknięcie nie czekało od nowa. */
const UNKNOWN_TTL_MS = 30_000;

type ClipEntry = { state: Promise<ClipState>; expires: number };

const clipAvailability = new Map<string, ClipEntry>();

async function cachedCopy(path: string): Promise<boolean> {
  try {
    return "caches" in window && Boolean(await caches.match(path));
  } catch {
    return false;
  }
}

/** Jedno zapytanie HEAD z limitem czasu; `certain` = odpowiedź serwera, do zapamiętania. */
async function probeClip(
  path: string,
  timeoutMs = HEAD_TIMEOUT_MS,
): Promise<{ state: ClipState; certain: boolean }> {
  const controller = typeof AbortController === "undefined" ? null : new AbortController();
  const timer = setTimeout(() => controller?.abort(), timeoutMs);
  try {
    const response = await fetch(path, { method: "HEAD", signal: controller?.signal });
    if (response.ok) return { state: "yes", certain: true };
    if (response.status === 404 || response.status === 410) return { state: "no", certain: true };
  } catch {
    // brak sieci albo limit czasu — niżej
  } finally {
    clearTimeout(timer);
  }
  // Offline pytamy pamięć service workera wprost.
  return { state: (await cachedCopy(path)) ? "yes" : "unknown", certain: false };
}

/**
 * Czy nagranie istnieje. Pewne odpowiedzi serwera (jest / 404) pamiętamy do
 * przeładowania strony. Błąd sieci to nie „brak pliku": nie utrwalamy go
 * (chwilowy brak zasięgu oznaczałby nagranie jako brakujące), ale pamiętamy
 * przez UNKNOWN_TTL_MS — przy łączu, które wisi, każde stuknięcie czekałoby
 * inaczej od nowa na limit czasu.
 */
function clipState(path: string): Promise<ClipState> {
  if (typeof window === "undefined") return Promise.resolve("no");

  const known = clipAvailability.get(path);
  if (known && known.expires > Date.now()) return known.state;

  const entry: ClipEntry = { state: Promise.resolve<ClipState>("unknown"), expires: Infinity };
  entry.state = probeClip(path).then(({ state, certain }) => {
    if (!certain) entry.expires = Date.now() + UNKNOWN_TTL_MS;
    return state;
  });
  clipAvailability.set(path, entry);
  return entry.state;
}

export async function clipExists(path: string): Promise<boolean> {
  return (await clipState(path)) === "yes";
}

/**
 * Wynik szukania nagrania: "yes" = jest pod `path`; "no" = na pewno brak;
 * "unknown" = sieć nie odpowiedziała na czas, a `path` to najbardziej
 * prawdopodobny plik — warto go spróbować zagrać (wolne łącze, pamięć SW).
 */
type ClipLookup = { path: string | null; state: ClipState };

/** Tylko wyszukiwania w toku — wyniki pamięta już clipState dla każdej ścieżki. */
const pendingLookups = new Map<string, Promise<ClipLookup>>();

function lookupClip(base: string): Promise<ClipLookup> {
  if (typeof window === "undefined") return Promise.resolve({ path: null, state: "no" });

  let pending = pendingLookups.get(base);
  if (!pending) {
    pending = (async (): Promise<ClipLookup> => {
      let unsure: string | null = null;
      const missing = new Set<string>();
      for (const extension of clipExtensions(base)) {
        const path = `${base}.${extension}`;
        if (unsure) {
          // Sieć już raz nie odpowiedziała — kolejne rozszerzenia sprawdzamy
          // tylko w pamięci, zamiast czekać na limit czasu przy każdym z nich.
          if (await cachedCopy(path)) return { path, state: "yes" };
          continue;
        }
        const state = await clipState(path);
        if (state === "yes") return { path, state };
        if (state === "unknown") unsure = path;
        else missing.add(path);
      }
      if (!unsure) return { path: null, state: "no" };
      // Bez odpowiedzi sieci próbujemy pliku, który najpewniej jest (głoska
      // w wav), chyba że serwer już powiedział, że go nie ma.
      const likely = `${base}.${likelyExtension(base)}`;
      return { path: missing.has(likely) ? unsure : likely, state: "unknown" };
    })().finally(() => pendingLookups.delete(base));
    pendingLookups.set(base, pending);
  }
  return pending;
}

/** Pierwsze na pewno istniejące rozszerzenie dla danej nazwy pliku, albo null. */
export async function findClip(base: string): Promise<string | null> {
  const { path, state } = await lookupClip(base);
  return state === "yes" ? path : null;
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

type PlayStatus = "ok" | "blocked" | "failed" | "interrupted";

/** Numer bieżącego odtworzenia na wspólnym elemencie — nowsze przerywa starsze. */
let playToken = 0;

/**
 * Tyle czekamy, aż nagranie ruszy, tam gdzie jest plan awaryjny. Przy łączu,
 * które wisi, pobieranie pliku nie ma własnego limitu — bez tego dziecko
 * słyszałoby ciszę zamiast syntezy albo podpowiedzi „stuknij jeszcze raz".
 */
const PLAY_START_LIMIT_MS = 4000;

async function playUrl(url: string, startLimitMs = 0): Promise<PlayStatus> {
  const token = ++playToken;
  const audio = getSharedAudio();
  // Nagranie przerywa też awaryjny głos z poprzedniego odtworzenia.
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  audio.pause();
  audio.muted = false;
  audio.src = url;
  let limit: ReturnType<typeof setTimeout> | undefined;
  try {
    const playing = audio.play();
    if (startLimitMs > 0) {
      const late = new Promise<"late">((resolve) => {
        limit = setTimeout(() => resolve("late"), startLimitMs);
      });
      if ((await Promise.race([playing, late])) === "late") {
        playing.catch(() => undefined);
        if (token !== playToken) return "interrupted";
        // Za długo: zatrzymujemy (to odrzuci `playing` błędem AbortError,
        // już nikogo nie obchodzi) i oddajemy głos planowi awaryjnemu.
        audio.pause();
        return "failed";
      }
    } else {
      await playing;
    }
  } catch (error) {
    const name = (error as DOMException)?.name;
    // pause() albo nowy src w trakcie ładowania to przerwanie, nie brak
    // nagrania — inaczej przerwane słowo czytałby potem syntezator.
    if (name === "AbortError" || token !== playToken) return "interrupted";
    return name === "NotAllowedError" ? "blocked" : "failed";
  } finally {
    clearTimeout(limit);
  }
  return token === playToken ? "ok" : "interrupted";
}

/**
 * Numer bieżącego żądania z interfejsu. Sprawdzanie pliku trwa (HEAD, baza
 * nagrań rodzica), więc starsze żądanie może wrócić dopiero po nowszym —
 * wtedy nie gra i nie mówi, bo dziecko chce usłyszeć to, co stuknęło ostatnio.
 * Zwraca funkcję „czy to żądanie jest już nieaktualne".
 */
let requestToken = 0;

function beginRequest(): () => boolean {
  const token = ++requestToken;
  return () => token !== requestToken;
}

/** Wynik przerwanego odtworzenia: nic nie zabrakło, po prostu gra coś nowszego. */
const INTERRUPTED: PlaybackResult = { source: "interrupted", approximate: false };

/** Przeglądarka zablokowała dźwięk — potrzebne stuknięcie, nagranie jest. */
const BLOCKED: PlaybackResult = { source: "unavailable", approximate: false, reason: "blocked" };

async function playClip(path: string, stale: () => boolean): Promise<PlayStatus> {
  if (!(await clipExists(path))) return "failed";
  if (stale()) return "interrupted";
  return playUrl(path);
}

/** Pliki, które niedawno nie zagrały — do kiedy ich nie próbujemy. */
const unplayable = new Map<string, number>();

/**
 * Gra nagranie spod danej nazwy (pierwsze istniejące rozszerzenie).
 * „Nie wiadomo" (sieć nie odpowiedziała na czas) też próbujemy — plik mógł
 * tylko wolno odpowiadać albo leżeć w pamięci service workera. "missing" =
 * nagrania na pewno nie ma; "failed" = było do spróbowania, ale nie zagrało.
 * `retry` = mimo niedawnej porażki próbujemy naprawdę zagrać (tam, gdzie nie
 * ma planu awaryjnego i jedyną radą jest „stuknij jeszcze raz").
 */
async function playFromBase(
  base: string,
  stale: () => boolean,
  retry = false,
): Promise<PlayStatus | "missing"> {
  const { path } = await lookupClip(base);
  if (stale()) return "interrupted";
  if (!path) return "missing";
  // Niedawno nie zagrał (łącze wisi) — od razu plan awaryjny, bez czekania
  // na limit przy każdym stuknięciu.
  if (!retry && (unplayable.get(path) ?? 0) > Date.now()) return "failed";
  const status = await playUrl(path, PLAY_START_LIMIT_MS);
  if (status === "failed") unplayable.set(path, Date.now() + UNKNOWN_TTL_MS);
  else if (status === "ok") unplayable.delete(path);
  return status;
}

/** Nagranie rodzica, jeśli istnieje dla tego grafemu. */
async function playParentRecording(graphemeId: string, stale: () => boolean): Promise<PlayStatus> {
  const url = await getRecordingUrl(graphemeId);
  if (stale()) return "interrupted";
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

  // Synteza zastępuje nagranie, więc je ucisza (także to jeszcze ładowane) —
  // inaczej syntezator i plik mówiłyby naraz.
  playToken += 1;
  sharedAudio?.pause();
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

/**
 * Odtwarza całe słowo.
 *
 * Przerwanie (nowsze stuknięcie, kolejne słowo) kończy wywołanie bez planu
 * awaryjnego — synteza jest tylko na prawdziwy brak albo błąd nagrania.
 */
export async function playWord(word: string): Promise<PlaybackResult> {
  const stale = beginRequest();
  const status = await playFromBase(wordClipBase(word), stale);
  if (status === "ok") return { source: "clip", approximate: false };
  if (status === "interrupted") return INTERRUPTED;
  // Zablokowane = potrzebny gest użytkownika. Nie próbujemy syntezą —
  // też byłaby zablokowana; interfejs pokaże "stuknij 🔊".
  if (status === "blocked") return BLOCKED;
  if (stale()) return INTERRUPTED;
  return speak(word)
    ? { source: "tts", approximate: false }
    : { source: "unavailable", approximate: false, reason: "missing" };
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
  const stale = beginRequest();
  const status = await playFromBase(phraseClipBase(text), stale);
  if (status === "ok") return { source: "clip", approximate: false };
  if (status === "interrupted") return INTERRUPTED;
  if (status === "blocked") return BLOCKED;
  if (stale()) return INTERRUPTED;
  // Wolniej niż pojedyncze słowo: całe zdanie w obcym języku dziecko musi
  // zdążyć rozłożyć na kawałki.
  return speak(text, 0.75)
    ? { source: "tts", approximate: false }
    : { source: "unavailable", approximate: false, reason: "missing" };
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
  const stale = beginRequest();
  const own = await playParentRecording(soundId, stale);
  if (own === "ok") return { source: "recording", approximate: false };
  // Przerwana głoska nie przechodzi do namiastki — gra już coś nowszego.
  if (own === "interrupted" || stale()) return INTERRUPTED;
  if (own === "blocked") return BLOCKED;
  const status = await playFromBase(phonemeClipBase(soundId), stale);
  if (status === "ok") return { source: "clip", approximate: false };
  if (status === "interrupted") return INTERRUPTED;
  if (status === "blocked") return BLOCKED;
  if (stale()) return INTERRUPTED;
  const example = await playFromBase(wordClipBase(exampleWord), stale);
  if (example === "ok") return { source: "clip-example", approximate: true };
  if (example === "interrupted") return INTERRUPTED;
  if (example === "blocked") return { ...BLOCKED, approximate: true };
  if (stale()) return INTERRUPTED;
  return speak(exampleWord, 0.7)
    ? { source: "tts-example", approximate: true }
    : { source: "unavailable", approximate: true, reason: "missing" };
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
  const stale = beginRequest();
  const own = await playParentRecording(graphemeId, stale);
  if (own === "ok") return { source: "recording", approximate: false };
  // Przerwanie (np. szybkie drugie stuknięcie kafelka) to nie „brak nagrania".
  if (own === "interrupted" || stale()) return INTERRUPTED;
  // Nagranie rodzica jest, tylko przeglądarka czeka na gest — to też nie brak.
  if (own === "blocked") return BLOCKED;
  // Tu nie ma zapasu, a interfejs przy kłopocie z łączem każe stuknąć jeszcze
  // raz — więc każde stuknięcie naprawdę próbuje, zamiast pamiętać porażkę.
  const status = await playFromBase(phonemeClipBase(graphemeId), stale, true);
  if (status === "ok") return { source: "clip", approximate: false };
  if (status === "interrupted" || stale()) return INTERRUPTED;
  if (status === "blocked") return BLOCKED;
  // Komunikat „brak nagrania" tylko przy prawdziwym braku; plik, który nie
  // odpowiedział na czas albo się nie wczytał, to sprawa łącza.
  return {
    source: "unavailable",
    approximate: false,
    reason: status === "missing" ? "missing" : "network",
  };
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
  if (clip) {
    const status = await playUrl(clip);
    if (status === "ok") {
      stopVictory = () => {
        const audio = getSharedAudio();
        audio.pause();
        audio.currentTime = 0;
      };
      return;
    }
    // Dziecko stuknęło w słowo, zanim muzyka ruszyła — ono ma pierwszeństwo.
    if (status === "interrupted") return;
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
  return (await playClip(path, beginRequest())) === "ok";
}

/** Tyle nazw naraz — ponad tysiąc równoległych zapytań zatkałoby słabe łącze. */
const AUDIT_BATCH = 32;
/** Partiami zapytania nie stoją w kolejce przeglądarki, więc limit może być hojny. */
const AUDIT_TIMEOUT_MS = 10_000;

/**
 * Wynik audytu jednej nazwy. `unknown` = nie dało się sprawdzić (sieć) — to
 * nie to samo co „brakuje", ale panel rodzica (app/rodzic) na razie czyta
 * tylko `path`, więc liczy takie nazwy jak brakujące.
 */
export type ClipAuditEntry = { base: string; path: string | null; unknown?: boolean };

async function auditBase(base: string): Promise<ClipAuditEntry> {
  let unknown = false;
  for (const extension of clipExtensions(base)) {
    const path = `${base}.${extension}`;
    // Po pierwszym „nie wiadomo" dalsze rozszerzenia tylko w pamięci (jak lookupClip).
    const state = unknown
      ? (await cachedCopy(path)) ? "yes" : "unknown"
      : (await probeClip(path, AUDIT_TIMEOUT_MS)).state;
    if (state === "yes") return { base, path };
    if (state === "unknown") unknown = true;
  }
  return unknown ? { base, path: null, unknown: true } : { base, path: null };
}

/**
 * Dla panelu rodzica: które pliki są na miejscu (w dowolnym formacie).
 * Osobne zapytania (bez pamięci clipState), żeby „Odśwież stan plików" dawał
 * aktualny wynik, i partiami. Gdy nie odpowiada cała partia (brak internetu),
 * resztę od razu oznaczamy jako niesprawdzoną, zamiast czekać przy każdej.
 */
export async function auditClips(bases: string[]): Promise<ClipAuditEntry[]> {
  const result: ClipAuditEntry[] = [];
  for (let start = 0; start < bases.length; start += AUDIT_BATCH) {
    const batch = await Promise.all(bases.slice(start, start + AUDIT_BATCH).map(auditBase));
    result.push(...batch);
    if (batch.every((entry) => entry.unknown)) {
      result.push(
        ...bases.slice(start + AUDIT_BATCH).map((base) => ({ base, path: null, unknown: true })),
      );
      break;
    }
  }
  return result;
}

// --- Rymowanki ---------------------------------------------------------------

/** Ścieżka nagrania rymowanki (jeden plik MP3 na całą rymowankę). */
export function rhymeClipPath(id: string): string {
  return `${CLIP_BASE}/rhymes/${id}.mp3`;
}

/** Odtwarza rymowankę z nagrania. Zwraca false, gdy pliku brak. */
export async function playRhyme(id: string): Promise<boolean> {
  return (await playClip(rhymeClipPath(id), beginRequest())) === "ok";
}

// --- Chant z bitem -----------------------------------------------------------

/**
 * Zdekodowane głoski pod chant — dekodowanie za każdym razem szarpałoby rytm.
 * Kluczem jest adres źródła: nowe nagranie rodzica dostaje nowy adres blob:,
 * więc chant nie zagra starej wersji.
 */
const chantBuffers = new Map<string, Promise<AudioBuffer | null>>();

/**
 * Dłużej nie czekamy na plik głoski pod chant. Przy łączu, które wisi, pobranie
 * nie kończyłoby się nigdy, a przycisk zostawałby zablokowany na „Gra…".
 */
const CHANT_FETCH_TIMEOUT_MS = 5000;

function decodeChantSource(context: AudioContext, url: string): Promise<AudioBuffer | null> {
  let pending = chantBuffers.get(url);
  if (!pending) {
    const decoding: Promise<AudioBuffer | null> = (async () => {
      const controller = typeof AbortController === "undefined" ? null : new AbortController();
      const timer = setTimeout(() => controller?.abort(), CHANT_FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(url, { signal: controller?.signal });
        if (!response.ok) return null;
        // Limit obejmuje też pobieranie treści, nie tylko nagłówki.
        return await context.decodeAudioData(await response.arrayBuffer());
      } finally {
        clearTimeout(timer);
      }
    })()
      .catch(() => null)
      .then((buffer) => {
        // Porażki (offline, uszkodzony plik) nie utrwalamy — następna próba pyta od nowa.
        if (!buffer && chantBuffers.get(url) === decoding) chantBuffers.delete(url);
        return buffer;
      });
    pending = decoding;
    chantBuffers.set(url, pending);
  }
  return pending;
}

/** Nagranie rodzica wygrywa (jak wszędzie), potem plik z czystą głoską. */
async function chantBuffer(context: AudioContext, soundId: string): Promise<AudioBuffer | null> {
  const own = await getRecordingUrl(soundId);
  if (own) {
    const buffer = await decodeChantSource(context, own);
    if (buffer) return buffer;
  }
  const clip = await findClip(phonemeClipBase(soundId));
  return clip ? decodeChantSource(context, clip) : null;
}

/** Stopa perkusyjna: opadający sinus — ta sama technika co w fanfarach. */
function scheduleKick(context: AudioContext, at: number, vol: number): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(150, at);
  oscillator.frequency.exponentialRampToValueAtTime(52, at + 0.12);
  gain.gain.setValueAtTime(vol, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(at);
  oscillator.stop(at + 0.2);
}

let chantBusy = false;

/**
 * Chant lekcji z bitem: nagranie CZYSTEJ GŁOSKI grane rytmicznie na tle
 * prostej stopy perkusyjnej — wzór jak w chantach RWI: „X… X… X-X-X!”.
 *
 * Po co: rytmiczne skandowanie wspiera u dzieci w tym wieku zapamiętywanie
 * i wymowę lepiej niż zwykłe powtarzanie (badania nad chantami u młodych
 * uczniów), a przy okazji zamienia suchy trening głoski w zabawę.
 *
 * Gra wyłącznie z nagrania głoski (własnego rodzica albo wyciętego z
 * brytyjskiego słowa) — syntezator przeczytałby nazwę litery, więc bez
 * nagrania funkcja uczciwie odmawia i przycisk się nie pokazuje.
 */
export async function playChantWithBeat(soundId: string): Promise<boolean> {
  const context = getToneContext();
  if (!context || chantBusy) return false;

  try {
    chantBusy = true;
    if (context.state === "suspended") await context.resume();
    const buffer = await chantBuffer(context, soundId);
    if (!buffer) return false;

    const beat = 0.5; // 120 BPM — tempo marszu, dzieci naturalnie tupią
    const start = context.currentTime + 0.12;

    // Perkusja: dwa takty po cztery uderzenia, mocniejsza „jedynka”.
    for (let i = 0; i < 8; i++) {
      scheduleKick(context, start + i * beat, i % 4 === 0 ? 0.4 : 0.22);
    }

    // Głoska: „X… X… X-X-X!” — dwa spokojne wejścia i szybka trójka.
    const glosWchodzi = [0, 2, 4, 4.5, 5].map((step) => start + step * beat);
    for (const at of glosWchodzi) {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(at);
    }

    const totalMs = (8 * beat + buffer.duration) * 1000;
    await new Promise((resolve) => setTimeout(resolve, totalMs));
    return true;
  } catch {
    return false;
  } finally {
    chantBusy = false;
  }
}

/** Czy chant z bitem jest dostępny (= czy jest nagranie czystej głoski: rodzica albo plik). */
export async function chantAvailable(soundId: string): Promise<boolean> {
  if ((await getRecordingUrl(soundId)) !== null) return true;
  return (await findClip(phonemeClipBase(soundId))) !== null;
}
