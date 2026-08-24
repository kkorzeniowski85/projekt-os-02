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
import { TOPICS } from "@/lib/curriculum/vocab";
import { heroesUnlockedBySound } from "@/lib/heroes";
import {
  emptySoundState,
  emptyTopicState,
  trackOf,
  type ProgressState,
  type SessionRecord,
  type SoundState,
  type SoundStatus,
  type TopicState,
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
  /**
   * Ile ocenianych zadań musi mieć sesja, żeby jej wynik w ogóle liczył się do
   * oceny dźwięku. Sesję można przerwać i zapisać w połowie — ale dwa trafione
   * zadania z rzędu nie są dowodem opanowania, a dwa chybione nie są powodem do
   * alarmu. Bez tego progu możliwość zapisywania przerwanych sesji psułaby to,
   * po co ta aplikacja jest: podpowiadanie, co ćwiczyć dalej.
   * Pełna sesja na telefonie ma ich 6, na tablecie więcej — próg nie przeszkadza
   * normalnej pracy.
   */
  minScoredForStatus: 4,
  /** Ile prób trzymamy w logu, zanim zaczniemy obcinać najstarsze. */
  attemptLogLimit: 2000,
  /**
   * Przypominajki: opanowany materiał nieużywany tyle dni kwalifikuje się do
   * powtórki, a proponujemy ją co tyle sesji danego toru. Wiedza nieużywana
   * cichnie — bez tego aplikacja nigdy nie wracała do niczego opanowanego.
   */
  refreshAfterDays: 14,
  refreshEvery: 5,
} as const;

export function accuracyOf(session: SessionRecord): number | null {
  return session.scored > 0 ? session.correct / session.scored : null;
}

function nextStatus(history: number[]): SoundStatus {
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

/**
 * Wspólny kształt stanu dźwięku i tematu. Oba mają identyczne pola i przechodzą
 * przez identyczne reguły — to nie jest przedwczesna abstrakcja, tylko ta sama
 * funkcja wywoływana dla dwóch torów. Gdyby reguły kiedyś się rozjechały, ta
 * funkcja jest miejscem, w którym się rozejdą.
 */
type SubjectState = {
  status: SoundStatus;
  sessions: number;
  lastAccuracy: number | null;
  bestAccuracy: number | null;
  recentAccuracies: number[];
  lastSeenTs: number | null;
};

function advance(previous: SubjectState, session: SessionRecord): SubjectState {
  const accuracy = accuracyOf(session);

  // Sesja przerwana po kilku zadaniach zostaje w historii (widać ją w raporcie
  // i liczy się do "ile razy ćwiczyliśmy"), ale nie rusza oceny —
  // patrz RULES.minScoredForStatus.
  const doOceny =
    accuracy !== null && session.scored >= RULES.minScoredForStatus ? accuracy : null;

  const recentAccuracies =
    doOceny === null
      ? previous.recentAccuracies
      : [...previous.recentAccuracies, doOceny].slice(-RULES.historyWindow);

  // Zwracamy SAM wspólny kawałek, a nie skopiowany rekord: dzięki temu wołający
  // dokłada go do swojego typu (SoundState / TopicState) i pole z
  // identyfikatorem zostaje nietknięte.
  return {
    sessions: previous.sessions + 1,
    lastAccuracy: doOceny ?? previous.lastAccuracy,
    bestAccuracy:
      doOceny === null
        ? previous.bestAccuracy
        : Math.max(doOceny, previous.bestAccuracy ?? 0),
    recentAccuracies,
    lastSeenTs: session.endedTs,
    status: nextStatus(recentAccuracies),
  };
}

/**
 * Przelicza stan po zakończonej sesji — dźwięku albo tematu, zależnie od toru.
 *
 * Rozdzielenie po `track` jest konieczne, bo obie mapy trzymają co innego, a
 * scalanie odtwarza je z tego samego dziennika sesji. Sesja bez `track` (sprzed
 * powstania toru 2) liczy się do toru czytania.
 */
export function applySessionResult(
  state: ProgressState,
  session: SessionRecord,
): ProgressState {
  if (trackOf(session) === "vocab") {
    const previous = state.topics[session.soundId] ?? emptyTopicState(session.soundId);
    const updated: TopicState = { ...previous, ...advance(previous, session) };
    return {
      ...state,
      updatedTs: session.endedTs,
      topics: { ...state.topics, [session.soundId]: updated },
      sessions: [...state.sessions, session],
    };
  }

  const previous = state.sounds[session.soundId] ?? emptySoundState(session.soundId);
  const updated: SoundState = { ...previous, ...advance(previous, session) };

  // Postacie odblokowuje wyłącznie tor czytania. Tor 2 ma własną nagrodę
  // (odznaka tematu) i celowo nie konkuruje z drużyną o tę samą motywację.
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
  reason: "repeat-hard" | "continue" | "new-sound" | "refresh" | "all-done";
  /** Gotowy tekst dla rodzica. */
  labelPl: string;
};

/**
 * Najstarszy opanowany element, którego nie ruszano od refreshAfterDays.
 * Wspólne dla obu torów — stany mają ten sam kształt.
 */
function najstarszyDoPowtorki<T extends { status: SoundStatus; lastSeenTs: number | null }>(
  states: T[],
  now: number,
): T | null {
  const prog = now - RULES.refreshAfterDays * 24 * 60 * 60 * 1000;
  const stare = states
    .filter(
      (item) => item.status === "mastered" && item.lastSeenTs !== null && item.lastSeenTs < prog,
    )
    .sort((a, b) => (a.lastSeenTs ?? 0) - (b.lastSeenTs ?? 0));
  return stare[0] ?? null;
}

function dniTemu(ts: number | null, now: number): number {
  return Math.max(1, Math.round((now - (ts ?? now)) / (24 * 60 * 60 * 1000)));
}

function graphemeOf(soundId: string): string {
  return SOUNDS.find((sound) => sound.id === soundId)?.grapheme ?? soundId;
}

/** Co robić w następnej sesji. Kolejność dźwięków = kolejność RWI. */
export function recommendNext(state: ProgressState, now = Date.now()): Recommendation {
  const playable = SOUNDS.filter((sound) => hasLesson(sound.id));

  // Co refreshEvery-tą sesję toru proponujemy powtórkę czegoś opanowanego,
  // co leży od dawna — zamiast kolejnej nowości. Reguła jest deterministyczna
  // (licznik sesji), więc rekomendacja nie skacze przy odświeżeniach ekranu.
  const sesjeToru = state.sessions.filter((session) => trackOf(session) === "phonics").length;
  const czasNaPowtorke = sesjeToru > 0 && sesjeToru % RULES.refreshEvery === RULES.refreshEvery - 1;
  const doPowtorki = najstarszyDoPowtorki(Object.values(state.sounds), now);
  if (czasNaPowtorke && doPowtorki) {
    return {
      soundId: doPowtorki.soundId,
      reason: "refresh",
      labelPl: `Przypomnienie: „${graphemeOf(doPowtorki.soundId)}” — ostatnio ${dniTemu(doPowtorki.lastSeenTs, now)} dni temu. Opanowane, ale nieużywane cichnie.`,
    };
  }

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

  // Nic nowego i nic w toku — zanim ogłosimy koniec, oddajemy powtórkę
  // najstarszego opanowanego (jeśli jakikolwiek zdążył „ostygnąć").
  if (doPowtorki) {
    return {
      soundId: doPowtorki.soundId,
      reason: "refresh",
      labelPl: `Przypomnienie: „${graphemeOf(doPowtorki.soundId)}” — ostatnio ${dniTemu(doPowtorki.lastSeenTs, now)} dni temu.`,
    };
  }

  return {
    soundId: playable[playable.length - 1]?.id ?? "sh",
    reason: "all-done",
    labelPl:
      "Wszystkie przygotowane dźwięki opanowane — czas dodać kolejne lekcje z sekwencji RWI.",
  };
}

export type TopicRecommendation = {
  topicId: string;
  reason: "repeat-hard" | "continue" | "new-topic" | "refresh" | "all-done";
  labelPl: string;
};

/**
 * Co ćwiczyć dalej w torze słownictwa.
 *
 * Kolejność tematów w TOPICS to kolejność PILNOŚCI, nie trudności, więc
 * „następny nowy temat" znaczy tu „następny najpilniejszy". Dzięki temu dziecko,
 * które dopiero zaczyna, dostanie zwroty ratunkowe, a nie nazwy przyborów.
 */
export function recommendNextTopic(state: ProgressState, now = Date.now()): TopicRecommendation {
  const sesjeToru = state.sessions.filter((session) => trackOf(session) === "vocab").length;
  const czasNaPowtorke = sesjeToru > 0 && sesjeToru % RULES.refreshEvery === RULES.refreshEvery - 1;
  const doPowtorki = najstarszyDoPowtorki(Object.values(state.topics), now);
  const tytulPowtorki =
    doPowtorki === null
      ? null
      : (TOPICS.find((topic) => topic.id === doPowtorki.topicId)?.titlePl ?? doPowtorki.topicId);
  if (czasNaPowtorke && doPowtorki) {
    return {
      topicId: doPowtorki.topicId,
      reason: "refresh",
      labelPl: `Przypomnienie: „${tytulPowtorki}” — ostatnio ${dniTemu(doPowtorki.lastSeenTs, now)} dni temu. Zwroty nieużywane cichną.`,
    };
  }

  const struggling = TOPICS.find(
    (topic) => state.topics[topic.id]?.status === "needs-help",
  );
  if (struggling) {
    return {
      topicId: struggling.id,
      reason: "repeat-hard",
      labelPl: `Powtórka: „${struggling.titlePl}” — ostatnie sesje szły trudno, warto zrobić ją razem z rodzicem.`,
    };
  }

  const inProgress = TOPICS.find((topic) => state.topics[topic.id]?.status === "learning");
  if (inProgress) {
    return {
      topicId: inProgress.id,
      reason: "continue",
      labelPl: `Dokończ „${inProgress.titlePl}” — jeszcze jedna dobra sesja i temat jest opanowany.`,
    };
  }

  const fresh = TOPICS.find((topic) => !state.topics[topic.id]);
  if (fresh) {
    return {
      topicId: fresh.id,
      reason: "new-topic",
      labelPl: `Nowy temat: „${fresh.titlePl}”. ${fresh.goalPl}`,
    };
  }

  if (doPowtorki) {
    return {
      topicId: doPowtorki.topicId,
      reason: "refresh",
      labelPl: `Przypomnienie: „${tytulPowtorki}” — ostatnio ${dniTemu(doPowtorki.lastSeenTs, now)} dni temu.`,
    };
  }

  return {
    topicId: TOPICS[TOPICS.length - 1]?.id ?? "rescue",
    reason: "all-done",
    labelPl:
      "Wszystkie tematy opanowane — warto wrócić do „Ratunek!” na powtórkę i dopisać kolejne tematy.",
  };
}
