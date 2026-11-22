/**
 * Plan powtórek FSRS (biblioteka ts-fsrs, MIT; algorytm z aplikacji OET
 * rodzica, 2026-11). Odstęp liczony z historii danej pozycji: dobra odpowiedź
 * odsuwa ją coraz dalej, pomyłka przybliża.
 *
 * NIC NOWEGO NIE ZAPISUJEMY: stan każdej pozycji odtwarzamy z dziennika prób
 * (state.attempts), który i tak synchronizuje się między urządzeniami. Liczy
 * się PIERWSZA odpowiedź danego dnia — powtórki w tej samej sesji (runda
 * bonusowa, „Once more”) to ćwiczenie, nie pomiar pamięci.
 *
 * Ocena: dobrze = Good, źle albo z pomocą = Again. Bez kroków „krótkoterminowych”
 * (odstępy w dniach), bez losowego rozrzutu — plan jest powtarzalny na każdym
 * urządzeniu.
 */

import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card } from "ts-fsrs";
import type { Attempt } from "./types";

const scheduler = fsrs(
  generatorParameters({ enable_fuzz: false, enable_short_term: false, maximum_interval: 180, request_retention: 0.9 }),
);

export type ItemPlan = {
  key: string;
  /** Ostatnia próba — jej `item` i `exercise` mówią, czego dotyczy pozycja. */
  last: Attempt;
  card: Card;
  /** Termin następnej powtórki (ms). */
  dueTs: number;
  /** Ile razy pozycja „uciekła” (pomyłka po wcześniejszym zapamiętaniu) — od `sinceTs`. */
  lapses: number;
  /** Ile dni z odpowiedzią (pierwsza odpowiedź dnia) — od `sinceTs`. */
  days: number;
  /** Szansa, że dziecko pamięta teraz (0–1). */
  recall: number;
};

const dayKey = (ts: number) => new Date(ts).toDateString();

/**
 * Plan dla pozycji z historii prób (dowolna kolejność). `sinceTs` — liczymy
 * tylko próby od tej chwili (rodzic dał słowu „nową szansę”).
 */
export function planItem(key: string, attempts: Attempt[], now: number, sinceTs = 0): ItemPlan | null {
  const rated = attempts
    .filter((attempt) => attempt.correct !== null && attempt.ts >= sinceTs)
    .sort((a, b) => a.ts - b.ts);
  if (rated.length === 0) return null;
  let card = createEmptyCard(new Date(rated[0].ts));
  let lapses = 0;
  let days = 0;
  let lastDay = "";
  for (const attempt of rated) {
    const day = dayKey(attempt.ts);
    if (day === lastDay) continue;
    lastDay = day;
    days += 1;
    const wasLearned = card.state === State.Review;
    const grade = attempt.correct ? Rating.Good : Rating.Again;
    if (wasLearned && grade === Rating.Again) lapses += 1;
    card = scheduler.next(card, new Date(attempt.ts), grade).card;
  }
  return {
    key,
    last: rated[rated.length - 1],
    card,
    dueTs: card.due.getTime(),
    lapses,
    days,
    recall: scheduler.get_retrievability(card, new Date(now), false),
  };
}

/** Grupuje próby po kluczu pozycji (np. „vocab␀dog”). */
export function groupAttempts(attempts: Attempt[], keyOf: (attempt: Attempt) => string | null): Map<string, Attempt[]> {
  const byKey = new Map<string, Attempt[]>();
  for (const attempt of attempts) {
    const key = keyOf(attempt);
    if (!key) continue;
    const list = byKey.get(key) ?? [];
    list.push(attempt);
    byKey.set(key, list);
  }
  return byKey;
}

/** Czy termin minął (z dokładnością do dnia — powtórka „na dziś”). */
export function isDue(plan: ItemPlan, now: number): boolean {
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  return plan.dueTs <= endOfToday.getTime();
}
