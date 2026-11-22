/**
 * Plan Rozmowy z bohaterem: które pytania zadać dziś (lib/curriculum/talk.ts).
 *
 * „Rozmowa na dziś” = 5 pytań: najpierw te, które wróciły według planu FSRS
 * (lib/progress/srs.ts — ten sam co w Powtórce; pomyłka = odpowiedź z pomocą),
 * potem nowe, po kolei przez zestawy. Pytania z pomocą wracają jeszcze w tej
 * samej rozmowie, na końcu (runda „Jeszcze raz”), i po czasie w kolejnych dniach.
 *
 * Głos: pyta jeden lektor, odpowiada drugi; zmieniają się z dnia na dzień.
 */

import { TALK_ENTRIES, TALK_SESSION_ID, getTalkSet, type TalkEntry } from "@/lib/curriculum/talk";
import { HEROES, type Hero } from "@/lib/heroes";
import type { Voice } from "@/lib/voices";
import { groupAttempts, isDue, planItem, type ItemPlan } from "./srs";
import type { ProgressState } from "./types";

export const TALK_TODAY_COUNT = 5;
/** Najwięcej pytań „z planu” w jednej rozmowie — reszta to nowe, żeby było ciekawie. */
const TALK_MAX_DUE = 3;

export function talkPlans(state: ProgressState, now = Date.now()): Map<string, ItemPlan> {
  const plans = new Map<string, ItemPlan>();
  const grouped = groupAttempts(state.attempts, (attempt) => (attempt.exercise === "talk" ? attempt.item : null));
  for (const [key, attempts] of grouped) {
    const plan = planItem(key, attempts, now);
    if (plan) plans.set(key, plan);
  }
  return plans;
}

/** Dwa takie same pytania („What's this?”) nie stoją obok siebie. */
function spreadSameQuestions(entries: TalkEntry[]): TalkEntry[] {
  const out = [...entries];
  for (let i = 1; i < out.length; i++) {
    if (out[i].question.q !== out[i - 1].question.q) continue;
    const swap = out.findIndex((entry, j) => j > i && entry.question.q !== out[i - 1].question.q);
    if (swap > 0) [out[i], out[swap]] = [out[swap], out[i]];
  }
  return out;
}

export function todaysTalk(state: ProgressState, now = Date.now()): TalkEntry[] {
  const plans = talkPlans(state, now);
  const due = TALK_ENTRIES.filter((entry) => {
    const plan = plans.get(entry.key);
    return plan && isDue(plan, now);
  })
    .sort((a, b) => (plans.get(a.key)!.recall ?? 1) - (plans.get(b.key)!.recall ?? 1))
    .slice(0, TALK_MAX_DUE);
  const fresh = TALK_ENTRIES.filter((entry) => !plans.has(entry.key));
  const picked = [...due, ...fresh].slice(0, TALK_TODAY_COUNT);
  if (picked.length < TALK_TODAY_COUNT) {
    // Wszystko już było i nic nie wypada — najdawniej ćwiczone.
    const rest = TALK_ENTRIES.filter((entry) => !picked.includes(entry)).sort(
      (a, b) => (plans.get(a.key)?.dueTs ?? 0) - (plans.get(b.key)?.dueTs ?? 0),
    );
    picked.push(...rest.slice(0, TALK_TODAY_COUNT - picked.length));
  }
  return spreadSameQuestions(picked);
}

export function talkSetEntries(setId: string): TalkEntry[] {
  const set = getTalkSet(setId);
  return set ? TALK_ENTRIES.filter((entry) => entry.set.id === set.id) : [];
}

/** Ile pytań zestawu dziecko już powiedziało SAMO (bez pomocy) choć raz. */
export function talkSetProgress(state: ProgressState, setId: string): { own: number; total: number } {
  const entries = talkSetEntries(setId);
  const own = new Set(
    state.attempts
      .filter((attempt) => attempt.exercise === "talk" && attempt.correct === true)
      .map((attempt) => attempt.item),
  );
  return { own: entries.filter((entry) => own.has(entry.key)).length, total: entries.length };
}

const dayNumber = (now: number) => Math.floor(new Date(now).setHours(12, 0, 0, 0) / 86_400_000);

/** Kto pyta dziś: bohater z drużyny (odblokowani po kolei) i jego głos; odpowiada drugi głos. */
export function talkCast(state: ProgressState, now = Date.now()): { hero: Hero; asker: Voice; answerer: Voice } {
  const unlocked = HEROES.filter((hero) => state.unlockedHeroes.includes(hero.id));
  const pool = unlocked.length > 0 ? unlocked : HEROES.slice(0, 1);
  const day = dayNumber(now);
  const asker: Voice = day % 2 === 0 ? "alice" : "george";
  return { hero: pool[day % pool.length], asker, answerer: asker === "alice" ? "george" : "alice" };
}

/** Odpowiedzi mówione dzisiaj (Rozmowa i kwestie scenek) — krok „mówienie” misji. */
export function spokenToday(state: ProgressState, now = Date.now()): number {
  const today = new Date(now).toDateString();
  return state.attempts.filter(
    (attempt) =>
      (attempt.exercise === "talk" || attempt.exercise === "say") && new Date(attempt.ts).toDateString() === today,
  ).length;
}

export function isTalkSession(session: { soundId: string }): boolean {
  return session.soundId === TALK_SESSION_ID;
}
