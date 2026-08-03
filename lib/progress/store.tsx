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
  useState,
  type ReactNode,
} from "react";
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

  const update = useCallback((updater: (previous: ProgressState) => ProgressState) => {
    setState((previous) => {
      const next = updater(previous);
      save(next);
      return next;
    });
  }, []);

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

  const setChildName = useCallback(
    (name: string) => update((previous) => ({ ...previous, childName: name })),
    [update],
  );

  const resetAll = useCallback(
    () => update((previous) => emptyProgress(previous.childName)),
    [update],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({ ready, state, commitSession, setChildName, resetAll }),
    [ready, state, commitSession, setChildName, resetAll],
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
