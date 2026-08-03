/**
 * Warstwa 1 z briefu: automatyczna adaptacja w czasie rzeczywistym.
 *
 * Świadomie zwykłe progi, zero AI — decyzja "powtórz / idź dalej / wróć" ma być
 * przewidywalna i dająca się wytłumaczyć rodzicowi. Wszystkie liczby siedzą w
 * jednym miejscu (RULES), żeby dało się je zmienić po pierwszych testach z
 * dzieckiem, bez grzebania w logice.
 *
 * ZAŁOŻENIE (do weryfikacji w praktyce): progi 80% / 60% i "dwie sesje pod rząd"
 * to punkt wyjścia, nie prawda objawiona.
 */

import { SOUNDS } from "@/lib/curriculum/sounds";
import { hasLesson } from "@/lib/curriculum/lessons";
import { heroesUnlockedBySound } from "@/lib/heroes";
import {
  emptySoundState,
  type ProgressState,
  type SessionRecord,
  type SoundState,
} from "./types";

export const RULES = {
  /** Od tego wyniku sesja liczy się jako "dobra". */
  masteryAccuracy: 0.8,
  /** Tyle dobrych sesji pod rząd = dźwięk opanowany. */
  masterySessions: 2,
  /** Poniżej tego wyniku sesja liczy się jako "trudna". */
  strugglingAccuracy: 0.6,
  /** Tyle trudnych sesji pod rząd = sygnał "potrzebna pomoc rodzica". */
  strugglingSessions: 2,
  /** Ile ostatnich wyników trzymamy na potrzeby reguł. */
  historyWindow: 3,
  /** Ile prób trzymamy w logu, zanim zaczniemy obcinać najstarsze. */
  attemptLogLimit: 2000,
} as const;

export function accuracyOf(session: SessionRecord): number | null {
  return session.scored > 0 ? session.correct / session.scored : null;
}

function nextStatus(history: number[]): SoundState["status"] {
  const recent = history.slice(-RULES.historyWindow);
  if (recent.length === 0) return "new";

  const lastGood = recent.slice(-RULES.masterySessions);
  if (
    lastGood.length === RULES.masterySessions &&
    lastGood.every((value) => value >= RULES.masteryAccuracy)
  ) {
    return "mastered";
  }

  const lastHard = recent.slice(-RULES.strugglingSessions);
  if (
    lastHard.length === RULES.strugglingSessions &&
    lastHard.every((value) => value < RULES.strugglingAccuracy)
  ) {
    return "needs-help";
  }

  return "learning";
}

/** Przelicza stan dźwięku i odblokowania po zakończonej sesji. */
export function applySessionResult(
  state: ProgressState,
  session: SessionRecord,
): ProgressState {
  const previous = state.sounds[session.soundId] ?? emptySoundState(session.soundId);
  const accuracy = accuracyOf(session);

  const recentAccuracies =
    accuracy === null
      ? previous.recentAccuracies
      : [...previous.recentAccuracies, accuracy].slice(-RULES.historyWindow);

  const updated: SoundState = {
    ...previous,
    sessions: previous.sessions + 1,
    lastAccuracy: accuracy ?? previous.lastAccuracy,
    bestAccuracy:
      accuracy === null
        ? previous.bestAccuracy
        : Math.max(accuracy, previous.bestAccuracy ?? 0),
    recentAccuracies,
    lastSeenTs: session.endedTs,
    status: nextStatus(recentAccuracies),
  };

  const unlockedHeroes = new Set(state.unlockedHeroes);
  if (updated.status === "mastered") {
    for (const hero of heroesUnlockedBySound(session.soundId)) {
      unlockedHeroes.add(hero.id);
    }
  }

  return {
    ...state,
    updatedTs: session.endedTs,
    sounds: { ...state.sounds, [session.soundId]: updated },
    sessions: [...state.sessions, session],
    unlockedHeroes: [...unlockedHeroes],
  };
}

export type Recommendation = {
  soundId: string;
  reason: "repeat-hard" | "continue" | "new-sound" | "all-done";
  /** Gotowy tekst dla rodzica. */
  labelPl: string;
};

/** Co robić w następnej sesji. Kolejność dźwięków = kolejność RWI. */
export function recommendNext(state: ProgressState): Recommendation {
  const playable = SOUNDS.filter((sound) => hasLesson(sound.id));

  const struggling = playable.find(
    (sound) => state.sounds[sound.id]?.status === "needs-help",
  );
  if (struggling) {
    return {
      soundId: struggling.id,
      reason: "repeat-hard",
      labelPl: `Powtórka "${struggling.grapheme}" — ostatnie sesje szły trudno, warto zrobić ją razem z rodzicem.`,
    };
  }

  const inProgress = playable.find(
    (sound) => state.sounds[sound.id]?.status === "learning",
  );
  if (inProgress) {
    return {
      soundId: inProgress.id,
      reason: "continue",
      labelPl: `Dokończ "${inProgress.grapheme}" — jeszcze jedna dobra sesja i dźwięk jest opanowany.`,
    };
  }

  const fresh = playable.find((sound) => !state.sounds[sound.id]);
  if (fresh) {
    return {
      soundId: fresh.id,
      reason: "new-sound",
      labelPl: `Nowy dźwięk: "${fresh.grapheme}". Pierwsze spotkanie najlepiej w trybie z rodzicem.`,
    };
  }

  return {
    soundId: playable[playable.length - 1]?.id ?? "sh",
    reason: "all-done",
    labelPl:
      "Wszystkie przygotowane dźwięki opanowane — czas dodać kolejne lekcje z sekwencji RWI.",
  };
}
