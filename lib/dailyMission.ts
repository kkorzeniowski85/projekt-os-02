/**
 * „Misja na dziś" połączonej Ligi: dwa kroki + jeden dla chętnych.
 *
 *  1. Dźwięki — krok misji dawnej Ligi Dźwięków, ta sama logika co na jej
 *     stronie głównej: dźwięk z recommendNext, a obok słowa i zwroty z
 *     recommendNextTopic. Krok zalicza dzisiejsza sesja dźwięku ALBO słów.
 *     Gdy wszystkie dźwięki są opanowane (recommendNext: „all-done"), krokiem
 *     są od razu słowa.
 *  2. Tabliczka — pierwszy krok misji Akademii (lib/akademia/mission.ts):
 *     lekcja „Liczymy co N", gdy misja Akademii ją stawia (zasada „lekcja
 *     przed nowymi faktami"), a inaczej codzienny trening. Stan „zrobione"
 *     liczy mission.ts, bez zmian.
 *  3. Dla chętnych — więcej czytania: druga sesja dźwięków tego dnia
 *     (readingBonus niżej). Nieobowiązkowy: misja jest wykonana po krokach 1
 *     i 2. Decyzja rodzica (24.09.2026): dziecko dużo rozumie ze słuchu, ale
 *     czytanie (składanie liter w słowa) dopiero się zaczyna — chętny dzień
 *     ma dawać więcej czytania, a nie kolejny dział Akademii (działy są dalej
 *     pod ręką w sekcji Akademia na stronie głównej).
 *
 * Tu jest tylko rama: oba silniki liczą swoje rekomendacje jak dotąd, a ten
 * moduł wybiera z nich kroki. Bez dat i odliczania — to ekran dziecka.
 */

import { dailyMission as akademiaMission, type MissionStep as AkademiaStep } from "@/lib/akademia/mission";
import type { ProgressState as AkademiaState } from "@/lib/akademia/progress/types";
import { hasLesson } from "@/lib/curriculum/lessons";
import { getSound } from "@/lib/curriculum/sounds";
import { getTopic } from "@/lib/curriculum/vocab";
import { recommendNext, recommendNextTopic, RULES } from "@/lib/progress/rules";
import { trackOf, type ProgressState as LigaState, type SessionRecord } from "@/lib/progress/types";

export type MissionStepView = {
  emoji: string;
  title: string;
  /** Angielski fragment tytułu (grafem) — font czytelniczy. */
  titleReading?: string;
  subtitle: string;
  href: string;
  done: boolean;
  /** Druga droga do zaliczenia kroku (krok 1: słowa zamiast dźwięku). */
  alternative?: { label: string; href: string };
  /** Podpowiedź dla rodzica pod krokiem (tekst rekomendacji Ligi). */
  note?: string;
};

export type Mission = {
  /** Kroki obowiązkowe (1: Dźwięki, 2: Tabliczka). */
  steps: MissionStepView[];
  /** Krok dla chętnych (druga sesja dźwięków) albo null. */
  bonus: MissionStepView | null;
  /** Oba kroki obowiązkowe zrobione dziś. */
  done: boolean;
};

function isToday(ts: number, now: number): boolean {
  return new Date(ts).toDateString() === new Date(now).toDateString();
}

/**
 * Sesja Dźwięków, która naprawdę coś zrobiła — przerwana po dwóch zadaniach
 * nie odhacza misji (ten sam próg co w Akademii: RULES.minScoredForStatus).
 * Liczą się też zadania mówione bez oceny (tryb z rodzicem), bo te nie
 * wchodzą do `scored`, a sesja z nimi jest pełną pracą.
 */
function ligaSessionCounts(state: LigaState, session: SessionRecord): boolean {
  if (session.scored >= RULES.minScoredForStatus) return true;
  const track = trackOf(session);
  const tasks = state.attempts.filter(
    (attempt) =>
      attempt.soundId === session.soundId &&
      trackOf(attempt) === track &&
      attempt.ts >= session.startedTs &&
      attempt.ts <= session.endedTs,
  ).length;
  return tasks >= RULES.minScoredForStatus;
}

/** Dzisiejsze sesje Ligi, które naprawdę coś zrobiły (dźwięki i słowa), od najnowszej. */
function countedToday(state: LigaState, now: number): SessionRecord[] {
  return state.sessions
    .filter((session) => isToday(session.endedTs, now) && ligaSessionCounts(state, session))
    .sort((a, b) => b.endedTs - a.endedTs);
}

function soundsStep(state: LigaState, now: number): MissionStepView {
  const counted = countedToday(state, now);
  const doneToday = counted[counted.length - 1];

  // Zrobione dziś zostaje na liście z ✅ — pierwsza zaliczona sesja dnia (to
  // ona odhaczyła krok; kolejne sesje dźwięków pokazuje bonus).
  if (doneToday) {
    if (trackOf(doneToday) === "vocab") {
      return {
        emoji: "💬",
        title: `Słowa: ${getTopic(doneToday.soundId)?.titlePl ?? doneToday.soundId}`,
        subtitle: "Dźwięki · słowa i zwroty",
        href: `/slownictwo/${doneToday.soundId}`,
        done: true,
      };
    }
    return {
      emoji: "🔤",
      title: "Dźwięk",
      titleReading: getSound(doneToday.soundId)?.grapheme ?? doneToday.soundId,
      subtitle: "Dźwięki · czytanie",
      href: `/sesja/${doneToday.soundId}`,
      done: true,
    };
  }

  const recommendation = recommendNext(state, now);
  const topicRecommendation = recommendNextTopic(state, now);
  const topicTitle = getTopic(topicRecommendation.topicId)?.titlePl ?? topicRecommendation.topicId;
  const sound = getSound(recommendation.soundId);

  if (recommendation.reason === "all-done" || !sound) {
    return {
      emoji: "💬",
      title: `Słowa: ${topicTitle}`,
      subtitle: "Dźwięki · słowa i zwroty",
      href: `/slownictwo/${topicRecommendation.topicId}`,
      done: false,
      note: topicRecommendation.labelPl,
    };
  }

  const how =
    recommendation.reason === "repeat-hard"
      ? "powtórka"
      : recommendation.reason === "refresh"
        ? "przypomnij sobie"
        : recommendation.reason === "continue"
          ? "dokończ"
          : "nowy dźwięk";
  return {
    emoji: "🔤",
    title: "Dźwięk",
    titleReading: sound.grapheme,
    subtitle: `Dźwięki · ${how}${sound.variantNote ? ` · ${sound.variantNote}` : ""}`,
    href: `/sesja/${recommendation.soundId}`,
    done: false,
    alternative: { label: `albo słowa: ${topicTitle}`, href: `/slownictwo/${topicRecommendation.topicId}` },
    note: recommendation.labelPl,
  };
}

/**
 * Dla chętnych: więcej czytania — druga sesja dźwięków tego dnia.
 *  - krok 1 jeszcze niezrobiony: powtórka dźwięku, który dziecko już ćwiczyło
 *    i widziało najdawniej (inny niż dźwięk z kroku 1). Na samym początku
 *    nauki nie ma czego powtarzać — wtedy bonusu nie ma;
 *  - krok 1 zrobiony: to, co Liga poleca teraz (recommendNext) — zwykle
 *    następny dźwięk, bo sesja przed chwilą przesunęła rekomendację;
 *  - zaliczony, gdy dziś jest sesja dźwięków INNA niż ta, która zaliczyła
 *    krok 1 (pierwsza sesja dnia). Sesja słów po kroku 1 bonusu nie zalicza —
 *    to nie jest czytanie.
 */
function readingBonus(state: LigaState, step: MissionStepView, now: number): MissionStepView | null {
  const today = countedToday(state, now);
  const stepSession = today[today.length - 1];
  const extra = today.find((session) => session !== stepSession && trackOf(session) === "phonics");
  if (extra) {
    return {
      emoji: "📖",
      title: "Dźwięk",
      titleReading: getSound(extra.soundId)?.grapheme ?? extra.soundId,
      subtitle: "Dźwięki · więcej czytania",
      href: `/sesja/${extra.soundId}`,
      done: true,
    };
  }

  if (!step.done) {
    const firstSound = step.href.startsWith("/sesja/") ? step.href.slice("/sesja/".length) : null;
    const oldest = Object.values(state.sounds)
      .filter((sound) => sound.soundId !== firstSound && sound.lastSeenTs !== null && hasLesson(sound.soundId))
      .sort((a, b) => (a.lastSeenTs ?? 0) - (b.lastSeenTs ?? 0))[0];
    const sound = oldest ? getSound(oldest.soundId) : undefined;
    if (!oldest || !sound) return null;
    return {
      emoji: "📖",
      title: "Powtórka",
      titleReading: sound.grapheme,
      subtitle: "Dźwięki · więcej czytania",
      href: `/sesja/${oldest.soundId}`,
      done: false,
    };
  }

  const recommendation = recommendNext(state, now);
  const sound = getSound(recommendation.soundId);
  if (recommendation.reason === "all-done" || !sound) return null;
  const title =
    recommendation.reason === "new-sound"
      ? "Jeszcze jeden dźwięk"
      : recommendation.reason === "continue"
        ? "Dokończ"
        : recommendation.reason === "refresh"
          ? "Przypomnij sobie"
          : "Powtórka";
  return {
    emoji: "📖",
    title,
    titleReading: sound.grapheme,
    subtitle: "Dźwięki · więcej czytania",
    href: `/sesja/${recommendation.soundId}`,
    done: false,
    note: recommendation.labelPl,
  };
}

function fromAkademia(step: AkademiaStep): MissionStepView {
  return {
    emoji: step.emoji,
    title: step.title,
    subtitle: step.subtitle,
    href: step.href,
    done: step.done,
  };
}

export function combinedMission(liga: LigaState, akademia: AkademiaState, now = Date.now()): Mission {
  const akademiaSteps = akademiaMission(akademia, now);
  // mission.ts: najpierw lekcja (gdy jest), potem trening — oba z działu
  // tabliczki; pierwszy z nich to krok 2.
  const tables = akademiaSteps.find((step) => step.module === "tables");

  const sounds = soundsStep(liga, now);
  const steps = [sounds];
  if (tables) steps.push(fromAkademia(tables));
  return {
    steps,
    bonus: readingBonus(liga, sounds, now),
    done: steps.every((step) => step.done),
  };
}
