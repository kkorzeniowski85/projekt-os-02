"use client";

/**
 * Przechowywanie postępu. Na razie localStorage — jeden plik do podmiany,
 * gdy dojdzie backend (FastAPI + PostgreSQL) i konto rodzinne.
 *
 * Sesja jest zapisywana JEDNYM commitem na końcu (commitSession), a nie po
 * każdym kliknięciu. Dzięki temu przy synchronizacji będzie można wysyłać
 * zamknięte, niepodzielne paczki zamiast strumienia drobnych zdarzeń.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { mergeProgress } from "./merge";
import { applySessionResult, RULES } from "./rules";
import {
  emptyProgress,
  PROGRESS_SCHEMA_VERSION,
  STORAGE_KEY,
  type Attempt,
  type DeviceRole,
  type ProgressState,
  type SessionMode,
  type SessionRecord,
} from "./types";

export type PendingAttempt = Omit<Attempt, "id" | "mode">;

export type SessionCommit = {
  soundId: string;
  mode: SessionMode;
  device: DeviceRole;
  startedTs: number;
  endedTs: number;
  attempts: PendingAttempt[];
};

export type SessionOutcome = {
  session: SessionRecord;
  accuracy: number | null;
  /** Postacie odblokowane właśnie tą sesją — do pokazania na ekranie nagrody. */
  newHeroes: string[];
};

type ProgressContextValue = {
  /** Dopóki false, dane z localStorage jeszcze się nie wczytały. */
  ready: boolean;
  state: ProgressState;
  commitSession: (commit: SessionCommit) => SessionOutcome;
  /** Scala postęp z pliku (unia sesji). Zwraca liczbę dodanych sesji. */
  importProgress: (incoming: ProgressState) => number;
  setChildName: (name: string) => void;
  resetAll: () => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function load(): ProgressState {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.version !== PROGRESS_SCHEMA_VERSION) {
      // Migracji jeszcze nie ma — przy pierwszej zmianie schematu dopisujemy ją
      // tutaj, zamiast po cichu kasować postęp dziecka.
      return { ...emptyProgress(parsed.childName), version: PROGRESS_SCHEMA_VERSION };
    }
    return parsed;
  } catch {
    return emptyProgress();
  }
}

function save(state: ProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Brak miejsca / tryb prywatny — sesja i tak się doliczy w pamięci.
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => emptyProgress());
  const [ready, setReady] = useState(false);

  // Najświeższy stan dla silnika synchronizacji — bez tego domknięcia w
  // timerach widziałyby stan z chwili rejestracji, nie bieżący.
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setState(load());
    setReady(true);
  }, []);

  // Postęp otwarty równocześnie na dwóch kartach (np. rodzic patrzy w raport,
  // dziecko ćwiczy) — bez tego panel rodzica pokazywałby nieaktualne dane.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setState(load());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Automatyczna kopia do folderu na dysku (jeśli rodzic go wskazał).
  // Dzięki temu po każdej sesji plik w folderze Dysku Google jest aktualny
  // i sam trafia na pozostałe urządzenia — bez pobierania i kopiowania.
  // Opóźnienie, żeby przy serii zmian zapisać raz, a nie kilka razy.
  useEffect(() => {
    if (!ready || state.sessions.length === 0) return;
    const timer = setTimeout(() => {
      void import("./driveFolder").then(({ zapiszPostep }) =>
        zapiszPostep(JSON.stringify(state, null, 2)),
      );
    }, 1500);
    return () => clearTimeout(timer);
  }, [state, ready]);

  const update = useCallback((updater: (previous: ProgressState) => ProgressState) => {
    setState((previous) => {
      const next = updater(previous);
      if (next === previous) return previous; // brak zmian = brak zapisu i brak pętli
      save(next);
      return next;
    });
  }, []);

  // --- automatyczna synchronizacja między urządzeniami ----------------------

  const runSync = useCallback(() => {
    void import("./sync").then(({ syncNow }) =>
      syncNow(stateRef.current, (merged) => {
        update((previous) => {
          // Scalamy jeszcze raz z NAJNOWSZYM stanem (mógł się zmienić w trakcie
          // pobierania) — scalanie jest idempotentne, więc to bezpieczne.
          const zMerged = mergeProgress(previous, merged);
          return JSON.stringify(zMerged) === JSON.stringify(previous) ? previous : zMerged;
        });
      }),
    );
  }, [update]);

  useEffect(() => {
    if (!ready) return;
    void import("./sync").then(({ adoptFromHash, loadSyncId }) => {
      adoptFromHash();
      if (loadSyncId()) runSync();
    });

    // Pobieranie przy powrocie do aplikacji i odzyskaniu internetu, oraz
    // regularnie co 3 minuty, dopóki karta jest widoczna.
    const naWidocznosc = () => {
      if (document.visibilityState === "visible") runSync();
    };
    document.addEventListener("visibilitychange", naWidocznosc);
    window.addEventListener("online", runSync);
    const interwal = setInterval(() => {
      if (document.visibilityState === "visible") runSync();
    }, 3 * 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", naWidocznosc);
      window.removeEventListener("online", runSync);
      clearInterval(interwal);
    };
  }, [ready, runSync]);

  // Wysyłka po każdej zmianie postępu (z odstępem, żeby seria zmian poszła raz).
  useEffect(() => {
    if (!ready || state.sessions.length === 0) return;
    const timer = setTimeout(runSync, 2000);
    return () => clearTimeout(timer);
  }, [state, ready, runSync]);

  const commitSession = useCallback(
    (commit: SessionCommit): SessionOutcome => {
      const attempts: Attempt[] = commit.attempts.map((attempt) => ({
        ...attempt,
        id: newId(),
        mode: commit.mode,
      }));

      const scored = attempts.filter((attempt) => attempt.correct !== null);
      const session: SessionRecord = {
        id: newId(),
        soundId: commit.soundId,
        mode: commit.mode,
        device: commit.device,
        startedTs: commit.startedTs,
        endedTs: commit.endedTs,
        correct: scored.filter((attempt) => attempt.correct).length,
        scored: scored.length,
      };

      let outcome: SessionOutcome = {
        session,
        accuracy: session.scored > 0 ? session.correct / session.scored : null,
        newHeroes: [],
      };

      update((previous) => {
        const withSession = applySessionResult(previous, session);
        outcome = {
          ...outcome,
          newHeroes: withSession.unlockedHeroes.filter(
            (heroId) => !previous.unlockedHeroes.includes(heroId),
          ),
        };
        return {
          ...withSession,
          attempts: [...previous.attempts, ...attempts].slice(-RULES.attemptLogLimit),
        };
      });

      return outcome;
    },
    [update],
  );

  const importProgress = useCallback(
    (incoming: ProgressState): number => {
      let addedSessions = 0;
      update((previous) => {
        const merged = mergeProgress(previous, incoming);
        addedSessions = merged.sessions.length - previous.sessions.length;
        return merged;
      });
      return addedSessions;
    },
    [update],
  );

  const setChildName = useCallback(
    (name: string) => update((previous) => ({ ...previous, childName: name })),
    [update],
  );

  const resetAll = useCallback(
    () => update((previous) => emptyProgress(previous.childName)),
    [update],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({ ready, state, commitSession, importProgress, setChildName, resetAll }),
    [ready, state, commitSession, importProgress, setChildName, resetAll],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress musi być użyte wewnątrz <ProgressProvider>");
  }
  return context;
}
