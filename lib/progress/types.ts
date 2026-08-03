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

export type ExerciseKind = "listen" | "blend" | "choice";

/** Tryb pracy: dziecko samo vs. wspólnie z rodzicem. */
export type SessionMode = "solo" | "parent";

export type DeviceRole = "phone" | "tablet" | "desktop";

export type SoundStatus = "new" | "learning" | "mastered" | "needs-help";

export type Attempt = {
  id: string;
  ts: number;
  soundId: string;
  exercise: ExerciseKind;
  /** Słowo lub grafem, którego dotyczyła próba. */
  item: string;
  /** null = ćwiczenie mówione, którego aplikacja świadomie nie ocenia. */
  correct: boolean | null;
  responseMs: number;
  mode: SessionMode;
};

export type SessionRecord = {
  id: string;
  soundId: string;
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

export type ProgressState = {
  version: number;
  childName: string;
  updatedTs: number;
  sounds: Record<string, SoundState>;
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
