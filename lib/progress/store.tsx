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
import {
  mergeProgress,
  previewImport as previewImportInto,
  sessionDiff,
  type ImportPreview,
} from "./merge";
import { applySessionResult, RULES } from "./rules";
import {
  cutoffTs,
  emptyProgress,
  normalizeProgress,
  PROGRESS_SCHEMA_VERSION,
  STORAGE_KEY,
  type Attempt,
  type DeviceRole,
  type ProgressState,
  type SessionMode,
  type SessionRecord,
  type TrackId,
} from "./types";

/** Tor i tryb dokleja commitSession — ćwiczenie ich nie zna i nie musi. */
export type PendingAttempt = Omit<Attempt, "id" | "mode" | "track">;

export type SessionCommit = {
  /** Id dźwięku (tor 1) albo id tematu (tor 2) — patrz Attempt.soundId. */
  soundId: string;
  /** Brak = tor czytania, dla zgodności z wywołaniami sprzed toru 2. */
  track?: TrackId;
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
  /**
   * Scala postęp z pliku (unia sesji, z pominięciem sesji sprzed wyczyszczenia
   * postępu). `restore` = rodzic zgodził się przywrócić sesje sprzed
   * wyczyszczenia: znosi odcięcie na tym urządzeniu i — przez synchronizację —
   * na pozostałych. Zwraca, ile sesji doszło i ile ubyło (ubywa, gdy plik
   * niesie nowszy reset niż to urządzenie).
   */
  importProgress: (
    incoming: ProgressState,
    options?: { restore?: boolean },
  ) => { added: number; removed: number };
  /**
   * Co zrobi wczytanie pliku — liczone na NAJNOWSZYM stanie (w trakcie
   * odczytu pliku synchronizacja mogła przynieść reset z innego urządzenia).
   */
  previewImport: (incoming: ProgressState) => ImportPreview;
  setChildName: (name: string) => void;
  resetAll: () => void;
  /**
   * Ręczne kopnięcie synchronizacji. Potrzebne po WŁĄCZENIU jej w panelu:
   * automatyczne wysyłki reagują na zmianę postępu, a włączenie postępu nie
   * zmienia — bez tego pierwsza paczka poszłaby dopiero po następnej sesji
   * i drugie urządzenie sparowałoby się z pustą skrzynką.
   */
  requestSync: () => void;
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
      // tutaj. Do tego czasu: KONWENCJE zabraniają cichego kasowania danych
      // dziecka, więc przed startem od zera odkładamy surowy zapis pod klucz
      // zapasowy. Nic go nie czyta automatycznie, ale dane da się odzyskać.
      try {
        window.localStorage.setItem(`${STORAGE_KEY}.backup.v${parsed.version}`, raw);
      } catch {
        // brak miejsca — trudno, i tak nie mamy jak zmigrować
      }
      return { ...emptyProgress(parsed.childName), version: PROGRESS_SCHEMA_VERSION };
    }
    // Uzupełnienie pól dołożonych bez zmiany wersji (tor 2 dołożył `topics`).
    return normalizeProgress(parsed);
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

/**
 * Najpóźniejszy znacznik czasu wśród sesji i prób (0, gdy nic nie ma), ale
 * nie dalej niż dobę naprzód: jeden rekord z urządzenia z zegarem przestawionym
 * o lata do przodu nie może przesunąć resetu w przyszłość — reset odcinałby wtedy
 * wszystkie sesje rodziny aż do tej daty.
 */
function newestRecordTs(state: ProgressState): number {
  const newest = Math.max(
    0,
    ...state.sessions.map((session) => session.endedTs),
    ...state.attempts.map((attempt) => attempt.ts),
  );
  return Math.min(newest, Date.now() + 24 * 60 * 60 * 1000);
}

/**
 * Stan po zapisaniu sesji. Sesja kończona na urządzeniu, które ZNA już reset,
 * jest z definicji postępem po resecie — a scalanie odrzuca rekordy starsze
 * niż granica. Gdy reset przyszedł z urządzenia ze spieszącym się zegarem,
 * granica leży „w przyszłości" i świeża sesja dziecka znikałaby przy
 * najbliższej synchronizacji. Przesuwamy wtedy całą sesję (z próbami, z
 * zachowaniem odstępów) tuż za granicę i za ostatnią zapisaną sesję.
 */
function withCommit(
  previous: ProgressState,
  session: SessionRecord,
  attempts: Attempt[],
): ProgressState {
  const cutoff = cutoffTs(previous);
  const earliest = Math.min(session.startedTs, ...attempts.map((attempt) => attempt.ts));
  // Za granicę ORAZ za ostatnią zapisaną sesję: kolejne sesje z okna rozjazdu
  // zegarów trafiłyby inaczej w to samo miejsce, a scalanie układa sesje po
  // końcu — ostatni wynik dźwięku byłby wtedy wynikiem wcześniejszej sesji.
  const floor = Math.max(cutoff, ...previous.sessions.map((saved) => saved.endedTs));
  const shift = cutoff > 0 && earliest <= cutoff ? floor + 1 - earliest : 0;
  const saved = shift
    ? {
        ...session,
        startedTs: session.startedTs + shift,
        endedTs: session.endedTs + shift,
      }
    : session;
  const withSession = applySessionResult(previous, saved);
  return {
    ...withSession,
    attempts: [
      ...previous.attempts,
      ...(shift ? attempts.map((attempt) => ({ ...attempt, ts: attempt.ts + shift })) : attempts),
    ].slice(-RULES.attemptLogLimit),
  };
}

/** Zapamiętuje, że znaczniki resetu/przywrócenia zapadły w bieżącej rodzinie (albo bez niej). */
async function noteMarkersFamily(): Promise<void> {
  const { loadSyncCode, setMarkersFamily } = await import("./sync");
  setMarkersFamily(loadSyncCode());
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
    const pass = async (): Promise<void> => {
      const {
        syncNow,
        loadSyncCode,
        markersFamily,
        setMarkersFamily,
        pendingJoin,
        finishJoin,
      } = await import("./sync");
      // Kod mógł się zmienić w innej karcie — bez odczytu wysyłalibyśmy do starej skrzynki.
      const family = loadSyncCode();
      if (!family) return;
      // Reset albo przywrócenie zrobione poza tą rodziną (bez synchronizacji
      // albo w innym obiegu) dotyczy tylko tego urządzenia: zdejmujemy znaczniki
      // PRZED pierwszym scaleniem ze skrzynką, inaczej skasowałyby historię
      // pozostałych urządzeń. Sesji sprzed resetu tu już nie ma, więc nic nie wraca.
      if (markersFamily() !== family) {
        const current = stateRef.current;
        if (current.resetTs || current.restoreTs) {
          stateRef.current = { ...current, resetTs: 0, restoreTs: 0 };
          update((previous) =>
            previous.resetTs || previous.restoreTs
              ? { ...previous, resetTs: 0, restoreTs: 0 }
              : previous,
          );
        }
        setMarkersFamily(family);
      }

      // I w drugą stronę: reset zrobiony w rodzinie, zanim to urządzenie do
      // niej dołączyło, nie kasuje jego historii. Gdy skrzynka odcięłaby
      // sesje stąd, przy pierwszym scaleniu zachowujemy je przywróceniem —
      // jak przy wczytaniu kopii ze zgodą rodzica. Kosztem jest to, że wrócą
      // też sesje sprzed tamtego resetu z urządzeń rodziny, które od resetu
      // nie były w sieci; to lepsze niż ciche skasowanie całej historii.
      const joining = pendingJoin() === family;
      let kept: { sessions: number; resetTs: number } | null = null;
      const keepOnJoin = (remote: ProgressState): ProgressState => {
        const current = stateRef.current;
        if (loadSyncCode() !== family) return current;
        const { removedLocal, cutoffTs: cutoff } = previewImportInto(current, remote);
        if (removedLocal === 0) return current;
        const restoreTs = Math.max(Date.now(), remote.resetTs + 1, current.resetTs + 1);
        const withRestore = (previous: ProgressState) =>
          previous.restoreTs >= restoreTs ? previous : { ...previous, restoreTs };
        stateRef.current = withRestore(current);
        update(withRestore);
        kept = { sessions: removedLocal, resetTs: cutoff };
        return stateRef.current;
      };

      let stale = false;
      await syncNow(
        stateRef.current,
        (merged) => {
          // Obieg zaczęty dla innej rodziny (w międzyczasie „Podłącz" albo
          // parowanie w drugiej karcie): jego wynik niesie znaczniki starej
          // rodziny, które przed chwilą zdjęliśmy — przyjęcie go wyczyściłoby
          // historię nowej.
          if (loadSyncCode() !== family) {
            stale = true;
            return;
          }
          // Od razu, nie dopiero po renderze: podgląd importu i wynik importu
          // czytają stateRef i muszą widzieć np. reset, który właśnie przyszedł.
          stateRef.current = mergeProgress(stateRef.current, merged);
          update((previous) => {
            // Scalamy jeszcze raz z NAJNOWSZYM stanem (mógł się zmienić w trakcie
            // pobierania) — scalanie jest idempotentne, więc to bezpieczne.
            const zMerged = mergeProgress(previous, merged);
            return JSON.stringify(zMerged) === JSON.stringify(previous) ? previous : zMerged;
          });
          if (joining) finishJoin(family, kept);
        },
        joining ? keepOnJoin : undefined,
      );
      // Obieg nowej rodziny odbił się od trwającego obiegu starej — robimy go
      // od razu, zamiast czekać na zegar.
      if (stale || loadSyncCode() !== family) return pass();

      // Nagrania rodzica jadą tym samym kodem, ale osobnym obiegiem — są
      // znacznie cięższe od postępu i nie ma sensu ruszać ich przy każdej
      // drobnej zmianie punktów.
      const code = loadSyncCode();
      if (!code) return;
      const { syncRecordings } = await import("./recordingsSync");
      await syncRecordings(code);
    };
    void pass();
  }, [update]);

  useEffect(() => {
    if (!ready) return;
    void import("./sync").then(({ adoptFromHash, loadSyncCode }) => {
      adoptFromHash();
      if (loadSyncCode()) runSync();
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
  // Pusty postęp też jedzie, jeśli to skutek resetu albo niesie imię — inaczej
  // „Wyczyść postęp" nie docierało do skrzynki i wracało z niej przy
  // najbliższym pobraniu.
  useEffect(() => {
    if (!ready || (state.sessions.length === 0 && !state.resetTs && !state.childNameTs)) return;
    const timer = setTimeout(runSync, 2000);
    return () => clearTimeout(timer);
  }, [state, ready, runSync]);

  const commitSession = useCallback(
    (commit: SessionCommit): SessionOutcome => {
      const attempts: Attempt[] = commit.attempts.map((attempt) => ({
        ...attempt,
        id: newId(),
        mode: commit.mode,
        track: commit.track,
      }));

      const scored = attempts.filter((attempt) => attempt.correct !== null);
      const session: SessionRecord = {
        id: newId(),
        soundId: commit.soundId,
        track: commit.track,
        mode: commit.mode,
        device: commit.device,
        startedTs: commit.startedTs,
        endedTs: commit.endedTs,
        correct: scored.filter((attempt) => attempt.correct).length,
        scored: scored.length,
      };

      // Wynik dla ekranu nagrody liczymy od razu, ze stanu sprzed zapisu —
      // updater setState React wykonuje później, więc nie wolno na nim polegać
      // przy zwracaniu wartości (bez synchronizacji nowa postać nigdy nie
      // trafiała na ekran nagrody).
      const before = stateRef.current;
      const after = withCommit(before, session, attempts);
      // Kolejny zapis w tym samym takcie (przed renderem) liczy już od tego stanu.
      stateRef.current = after;
      update((previous) => withCommit(previous, session, attempts));

      return {
        session: after.sessions.find((saved) => saved.id === session.id) ?? session,
        accuracy: session.scored > 0 ? session.correct / session.scored : null,
        newHeroes: after.unlockedHeroes.filter((heroId) => !before.unlockedHeroes.includes(heroId)),
      };
    },
    [update],
  );

  const importProgress = useCallback(
    (incoming: ProgressState, options?: { restore?: boolean }) => {
      // Jak w commitSession: wynik ze stateRef, nie z updatera setState — ten
      // React wykonuje zwykle dopiero przy renderze, już po naszym return.
      const before = stateRef.current;
      // Przywrócenie musi być późniejsze niż każdy znany reset, także zapisany
      // przez urządzenie ze spieszącym się zegarem — inaczej nic by nie znosiło.
      const restoreTs = Math.max(Date.now(), before.resetTs + 1, (incoming.resetTs ?? 0) + 1);
      const withImport = (previous: ProgressState) =>
        mergeProgress(
          options?.restore
            ? { ...previous, restoreTs: Math.max(restoreTs, previous.resetTs + 1) }
            : previous,
          incoming,
        );
      const after = withImport(before);
      stateRef.current = after;
      update(withImport);
      if (after.resetTs !== before.resetTs || after.restoreTs !== before.restoreTs) {
        void noteMarkersFamily();
      }
      return sessionDiff(before, after);
    },
    [update],
  );

  const previewImport = useCallback(
    (incoming: ProgressState) => previewImportInto(stateRef.current, incoming),
    [],
  );

  // Znacznik zmiany imienia rośnie zawsze, także gdy obecne imię ustawiło
  // urządzenie ze spieszącym się zegarem — inaczej nowsza zmiana przegrałaby
  // przy scalaniu ze starszą.
  const setChildName = useCallback(
    (name: string) =>
      update((previous) => ({
        ...previous,
        childName: name,
        childNameTs: Math.max(Date.now(), previous.childNameTs + 1),
      })),
    [update],
  );

  // Reset zostawia znacznik zamiast samego pustego stanu: skrzynka i inne
  // urządzenia wciąż mają stare sesje, a scalanie odrzuca je dopiero wtedy,
  // gdy wie, od kiedy liczy się nowy postęp. Imię i jego znacznik zostają.
  // Reset musi wypaść po ostatnim przywróceniu (patrz cutoffTs) i po każdym
  // rekordzie, który tu jest — także zapisanym przez urządzenie ze spieszącym
  // się zegarem — inaczej „Wyczyść postęp" zostawiałby część sesji.
  const resetAll = useCallback(() => {
    update((previous) => ({
      ...emptyProgress(previous.childName),
      childNameTs: previous.childNameTs,
      restoreTs: previous.restoreTs,
      resetTs: Math.max(
        Date.now(),
        previous.resetTs + 1,
        previous.restoreTs + 1,
        newestRecordTs(previous) + 1,
      ),
    }));
    void noteMarkersFamily();
  }, [update]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      ready,
      state,
      commitSession,
      importProgress,
      previewImport,
      setChildName,
      resetAll,
      requestSync: runSync,
    }),
    [ready, state, commitSession, importProgress, previewImport, setChildName, resetAll, runSync],
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
