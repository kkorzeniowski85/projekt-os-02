/**
 * 🔁 Powtórka — słowa i zwroty wracają po czasie, według planu FSRS.
 *
 * PO CO: słowo przećwiczone raz i nigdy więcej niewidziane zwykle ucieka.
 * Najlepiej zapamiętujemy to, co przywołujemy z pamięci PO przerwie (spacing,
 * efekt testowania). Od 2026-11-22 odstępy liczy FSRS (lib/progress/srs.ts —
 * ten sam algorytm co w aplikacji OET rodzica): dobra odpowiedź odsuwa słowo
 * coraz dalej, pomyłka przybliża. Wcześniej wracało tylko to, co było pomylone.
 *
 * Reguły:
 *  - w planie jest każde słowo/zwrot, na które dziecko już odpowiadało
 *    (ćwiczenia vocab, phrase, command, collocation i „Przeczytaj i pokaż”
 *    z lekcji literek — słowo z lekcji staje się zwykłym słówkiem);
 *  - dziennie najwyżej REVIEW_DAILY_MAX pozycji, najpierw te, które dziecko
 *    najpewniej już zapomina. Po przerwie zaległości rozkładają się więc same
 *    na kolejne dni, zamiast wysypać się naraz (punkt 8 z OET);
 *  - pozycja, która „uciekła” SLIPPING_LAPSES razy (pomyłka po wcześniejszym
 *    zapamiętaniu), wypada z powtórek do listy dla rodzica (panel rodzica):
 *    „Spróbujmy jeszcze raz” (historia liczy się od nowa) albo „Odpuść”.
 *
 * Nic nowego nie zapisujemy poza decyzjami rodzica — plan odtwarza się z
 * dziennika prób.
 */

import { LESSONS } from "@/lib/curriculum/lessons";
import {
  TOPICS,
  type Collocation,
  type Command,
  type Phrase,
  type Topic,
  type VocabWord,
} from "@/lib/curriculum/vocab";
import { readSettings } from "@/lib/settings";
import { groupAttempts, isDue, planItem, type ItemPlan } from "./srs";
import { trackOf, type Attempt, type ProgressState } from "./types";

export const REVIEW_TOPIC_ID = "review";
/** Najwięcej pozycji powtórki dziennie (łącznie ze zrobionymi dziś). */
export const REVIEW_DAILY_MAX = 12;
/** Tyle „ucieczek” i pozycja trafia do listy dla rodzica. */
export const SLIPPING_LAPSES = 4;

const REVIEW_EXERCISES = new Set(["vocab", "phrase", "command", "collocation", "meaning"]);

type Due = { exercise: string; item: string; key: string };

/** Klucz pozycji: rodzaj + tekst. „meaning” to słowo — liczy się razem z „vocab”. */
export function reviewKeyOf(attempt: Attempt): string | null {
  if (!REVIEW_EXERCISES.has(attempt.exercise)) return null;
  const kind = attempt.exercise === "meaning" ? "vocab" : attempt.exercise;
  return `${kind}\u0000${attempt.item.toLowerCase()}`;
}

export function reviewKeyParts(key: string): { kind: string; item: string } {
  const [kind, item] = key.split("\u0000");
  return { kind, item };
}

/** Plany wszystkich pozycji powtórki (z decyzjami rodzica: „stop” wyłącza, „retry” liczy od nowa). */
export function reviewPlans(state: ProgressState, now = Date.now()): ItemPlan[] {
  const decisions = state.itemDecisions ?? {};
  const plans: ItemPlan[] = [];
  for (const [key, attempts] of groupAttempts(state.attempts, reviewKeyOf)) {
    const decision = decisions[key];
    if (decision?.action === "stop") continue;
    const plan = planItem(key, attempts, now, decision?.action === "retry" ? decision.ts : 0);
    if (plan) plans.push(plan);
  }
  return plans;
}

/** Pozycje, które ciągle uciekają — do decyzji rodzica, poza powtórką. */
export function slippingItems(state: ProgressState, now = Date.now()): ItemPlan[] {
  return reviewPlans(state, now)
    .filter((plan) => plan.lapses >= SLIPPING_LAPSES)
    .sort((a, b) => b.lapses - a.lapses);
}

/** Ile różnych pozycji powtórki dziecko już dziś przećwiczyło w Powtórce. */
function reviewedToday(state: ProgressState, now: number): number {
  const today = new Date(now).toDateString();
  const keys = new Set<string>();
  for (const attempt of state.attempts) {
    if (attempt.soundId !== REVIEW_TOPIC_ID || trackOf(attempt) !== "vocab") continue;
    if (new Date(attempt.ts).toDateString() !== today) continue;
    const key = reviewKeyOf(attempt);
    if (key) keys.add(key);
  }
  return keys.size;
}

/** Wszystkie pozycje z terminem na dziś (bez limitu) — do informacji dla rodzica. */
export function overdueCount(state: ProgressState, now = Date.now()): number {
  return reviewPlans(state, now).filter((plan) => plan.lapses < SLIPPING_LAPSES && isDue(plan, now)).length;
}

/**
 * Dawna reguła (do 2026-11-22, przełącznik „prosty” w panelu rodzica): wraca
 * tylko to, co w ostatnich 30 dniach było pomylone, dopóki nie padną dwie
 * dobre odpowiedzi; co najmniej 12 godzin po ostatniej próbie.
 */
function simpleDueItems(state: ProgressState, now: number): Due[] {
  const windowStart = now - 30 * 24 * 60 * 60 * 1000;
  const gap = 12 * 60 * 60 * 1000;
  const due: (Due & { lastWrongTs: number })[] = [];
  for (const [key, list] of groupAttempts(state.attempts.filter((a) => a.correct !== null), reviewKeyOf)) {
    list.sort((a, b) => a.ts - b.ts);
    const lastWrongIndex = list.map((a) => a.correct).lastIndexOf(false);
    if (lastWrongIndex < 0) continue;
    const lastWrong = list[lastWrongIndex];
    if (lastWrong.ts < windowStart) continue;
    if (list.slice(lastWrongIndex + 1).filter((a) => a.correct === true).length >= 2) continue;
    if (now - list[list.length - 1].ts < gap) continue;
    due.push({ exercise: reviewKeyParts(key).kind, item: lastWrong.item, key, lastWrongTs: lastWrong.ts });
  }
  return due.sort((a, b) => a.lastWrongTs - b.lastWrongTs).slice(0, REVIEW_DAILY_MAX);
}

/** Pozycje do dzisiejszej powtórki: najpierw najbardziej zapominane, w dziennym limicie. */
export function dueItems(state: ProgressState, now = Date.now()): Due[] {
  if (readSettings().reviewPlan === "simple") return simpleDueItems(state, now);
  const room = Math.max(0, REVIEW_DAILY_MAX - reviewedToday(state, now));
  if (room === 0) return [];
  return reviewPlans(state, now)
    .filter((plan) => plan.lapses < SLIPPING_LAPSES && isDue(plan, now))
    .sort((a, b) => a.recall - b.recall || a.dueTs - b.dueTs)
    .slice(0, room)
    .map((plan) => {
      const { kind } = reviewKeyParts(plan.key);
      return { exercise: kind, item: plan.last.item, key: plan.key };
    });
}

function findWord(item: string): VocabWord | null {
  const lower = item.toLowerCase();
  for (const topic of TOPICS) {
    const word = topic.words.find((w) => w.en.toLowerCase() === lower);
    if (word) return word;
  }
  // Słowo z lekcji literek (ćwiczenie „Przeczytaj i pokaż”).
  for (const lesson of Object.values(LESSONS)) {
    const card =
      lesson.blend.find((c) => c.word.toLowerCase() === lower) ??
      lesson.choice.map((r) => ({ word: r.answer, pl: r.pl, emoji: r.emoji })).find((c) => c.word.toLowerCase() === lower);
    if (card) return { en: card.word, pl: card.pl, emoji: card.emoji };
  }
  return null;
}

function findIn<T extends { en: string }>(pick: (topic: Topic) => T[], item: string): T | null {
  for (const topic of TOPICS) {
    const found = pick(topic).find((entry) => entry.en === item);
    if (found) return found;
  }
  return null;
}

/**
 * Temat-składanka z pozycji do powtórki — VocabRunner gra go jak zwykły temat,
 * ale w trybie powtórki (tylko pytania, bez poznawania, scenek i ruchu).
 * null, gdy nie ma czego powtarzać.
 */
export function buildReviewTopic(state: ProgressState, now = Date.now()): Topic | null {
  const words: VocabWord[] = [];
  const phrases: Phrase[] = [];
  const commands: Command[] = [];
  const collocations: Collocation[] = [];
  for (const due of dueItems(state, now)) {
    if (due.exercise === "vocab") {
      const word = findWord(due.item);
      if (word) words.push(word);
    } else if (due.exercise === "phrase") {
      const phrase = findIn((t) => t.phrases, due.item);
      if (phrase) phrases.push(phrase);
    } else if (due.exercise === "command") {
      const command = findIn((t) => t.commands, due.item);
      if (command) commands.push(command);
    } else if (due.exercise === "collocation") {
      const collocation = findIn((t) => t.collocations, due.item);
      if (collocation) collocations.push(collocation);
    }
  }
  const count = words.length + phrases.length + commands.length + collocations.length;
  if (count === 0) return null;
  return {
    id: REVIEW_TOPIC_ID,
    titlePl: "Powtórka",
    goalPl: "Słowa, które już znasz — wracają po czasie, żeby zostały na dłużej.",
    emoji: "🔁",
    heroId: "cure",
    parentIntroPl:
      "Słowa i zwroty, które dziecko już poznało, wracają według planu powtórek (FSRS): dobra odpowiedź odsuwa słowo na dłużej, pomyłka przybliża. Najpierw te, które najpewniej uciekają. Najwyżej 12 dziennie — po przerwie zaległości rozkładają się na kolejne dni.",
    words,
    phrases,
    commands,
    collocations,
  };
}

/** Ile pozycji czeka na powtórkę (do plakietki na stronie głównej). */
export function reviewCount(state: ProgressState, now = Date.now()): number {
  const topic = buildReviewTopic(state, now);
  if (!topic) return 0;
  return topic.words.length + topic.phrases.length + topic.commands.length + topic.collocations.length;
}
