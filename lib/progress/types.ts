/**
 * Model postępu dziecka.
 *
 * Na tym etapie wszystko żyje w localStorage (brief: "nawet jeśli na start
 * lokalnie, bez pełnej synchronizacji"). Kształt danych jest już jednak
 * przygotowany pod późniejszą synchronizację z backendem:
 *  - każdy rekord ma własne `id` i znacznik czasu (łatwe scalanie),
 *  - stan pochodny (statusy dźwięków) da się przeliczyć z logu prób,
 *  - `version` pozwoli zmigrować dane, gdy schemat się zmieni.
 */

/**
 * Tor nauki. `phonics` to czytanie (tor 1), `vocab` to słownictwo, zwroty i
 * kolokacje (tor 2). Pole jest opcjonalne wszędzie, gdzie występuje: rekordy
 * zapisane przed powstaniem toru 2 go nie mają i znaczą `phonics`.
 */
export type TrackId = "phonics" | "vocab";

export function trackOf(record: { track?: TrackId }): TrackId {
  return record.track ?? "phonics";
}

/**
 * Rodzaje ćwiczeń. Pierwsze trzy należą do toru czytania, pozostałe do toru
 * słownictwa.
 *
 * `command` i `phrase` wyglądają podobnie, ale sprawdzają odwrotne rzeczy:
 * `phrase` pyta „co powiesz w tej sytuacji" (produkcja), `command` odtwarza
 * polecenie po angielsku i pyta „co robisz" (rozumienie). Polecenia
 * nauczyciela dziecko ma rozumieć, a nie wypowiadać.
 */
export type ExerciseKind =
  | "listen"
  | "blend"
  | "choice"
  | "redword"
  | "vocab"
  | "phrase"
  | "command"
  | "collocation"
  | "say"
  | "act"
  | "sentence";

/** Tryb pracy: dziecko samo vs. wspólnie z rodzicem. */
export type SessionMode = "solo" | "parent";

export type DeviceRole = "phone" | "tablet" | "desktop";

export type SoundStatus = "new" | "learning" | "mastered" | "needs-help";

export type Attempt = {
  id: string;
  ts: number;
  /**
   * Czego dotyczyła próba: id dźwięku (tor 1) albo id tematu (tor 2).
   * Nazwa pola jest historyczna — zostaje, bo po niej zapisany jest postęp
   * dzieci, a przemianowanie unieważniłoby stare pliki i skrzynki. Który to
   * tor, mówi `track`.
   */
  soundId: string;
  track?: TrackId;
  exercise: ExerciseKind;
  /** Słowo, grafem, zwrot albo kolokacja, której dotyczyła próba. */
  item: string;
  /** null = ćwiczenie mówione, którego aplikacja świadomie nie ocenia. */
  correct: boolean | null;
  responseMs: number;
  mode: SessionMode;
};

export type SessionRecord = {
  id: string;
  /** Jak w Attempt: id dźwięku albo id tematu, zależnie od `track`. */
  soundId: string;
  track?: TrackId;
  mode: SessionMode;
  device: DeviceRole;
  startedTs: number;
  endedTs: number;
  correct: number;
  /** Liczba ocenianych prób (bez ćwiczeń mówionych). */
  scored: number;
};

export type SoundState = {
  soundId: string;
  status: SoundStatus;
  sessions: number;
  lastAccuracy: number | null;
  bestAccuracy: number | null;
  /** Ostatnie wyniki — na nich pracują reguły adaptacji. */
  recentAccuracies: number[];
  lastSeenTs: number | null;
};

/** Ten sam zestaw stanów co dla dźwięków — reguły przejścia też są te same. */
export type TopicStatus = SoundStatus;

export type TopicState = {
  topicId: string;
  status: TopicStatus;
  sessions: number;
  lastAccuracy: number | null;
  bestAccuracy: number | null;
  recentAccuracies: number[];
  lastSeenTs: number | null;
};

export type ProgressState = {
  version: number;
  childName: string;
  updatedTs: number;
  /** Tor 1: postęp per dźwięk. */
  sounds: Record<string, SoundState>;
  /** Tor 2: postęp per temat słownictwa. */
  topics: Record<string, TopicState>;
  sessions: SessionRecord[];
  attempts: Attempt[];
  unlockedHeroes: string[];
};

export const PROGRESS_SCHEMA_VERSION = 1;

export const STORAGE_KEY = "phonics.progress.v1";

/**
 * Domyślna nazwa jest neutralna, bo repozytorium jest publiczne — prawdziwe imię
 * dziecka wpisuje się w trybie rodzica i zostaje wyłącznie na urządzeniu.
 */
export function emptyProgress(childName = "Bohater"): ProgressState {
  return {
    version: PROGRESS_SCHEMA_VERSION,
    childName,
    updatedTs: 0,
    sounds: {},
    topics: {},
    sessions: [],
    attempts: [],
    unlockedHeroes: ["buzz"],
  };
}

export function emptySoundState(soundId: string): SoundState {
  return {
    soundId,
    status: "new",
    sessions: 0,
    lastAccuracy: null,
    bestAccuracy: null,
    recentAccuracies: [],
    lastSeenTs: null,
  };
}

export function emptyTopicState(topicId: string): TopicState {
  return {
    topicId,
    status: "new",
    sessions: 0,
    lastAccuracy: null,
    bestAccuracy: null,
    recentAccuracies: [],
    lastSeenTs: null,
  };
}

/**
 * Uzupełnia pola, których nie było we wcześniejszych wersjach aplikacji.
 *
 * Tor 2 dołożył `topics`, więc postęp zapisany wcześniej (localStorage, plik
 * kopii, skrzynka synchronizacji) tego pola nie ma. Numeru wersji świadomie NIE
 * podnosimy: to zmiana wyłącznie dokładająca pole, a podniesienie wersji
 * kazałoby starszym urządzeniom odrzucać nowe pliki, zanim same się
 * zaktualizują — czyli zatrzymałoby synchronizację dokładnie wtedy, gdy jest
 * potrzebna. Wersję podnosimy dopiero przy zmianie, która psuje odczyt.
 *
 * Wołane w każdym miejscu, gdzie stan wchodzi z zewnątrz.
 */
export function normalizeProgress(state: ProgressState): ProgressState {
  if (state.topics && typeof state.topics === "object") return state;
  return { ...state, topics: {} };
}
