/**
 * ✍️ Dyktando — które słowa podyktować dziś (punkt 9 z aplikacji OET rodzica).
 *
 * Słowa z lekcji dźwięków, które dziecko już ćwiczyło (ich „sklejanki”, czyli
 * słowa w całości z poznanych dźwięków — dekodowalne, da się je napisać ze
 * słuchu). Najpierw te, które według planu FSRS (lib/progress/srs.ts) wracają,
 * potem nowe z ostatnio ćwiczonych dźwięków. Gdy dziecko nie ćwiczyło jeszcze
 * żadnego dźwięku — słowa z pierwszych lekcji (m, a, s, d, t).
 */

import { LESSONS, type WordCard } from "@/lib/curriculum/lessons";
import { SOUNDS } from "@/lib/curriculum/sounds";
import { groupAttempts, isDue, planItem, type ItemPlan } from "./srs";
import type { ProgressState } from "./types";

export const SPELL_SESSION_ID = "dyktando";
export const SPELL_COUNT = 8;
const SPELL_MAX_DUE = 4;
const STARTER_SOUNDS = ["m", "a", "s", "d", "t"];

export type SpellWord = { word: string; graphemes: string[]; pl: string; emoji: string; soundId: string };

function wordsOf(soundId: string): SpellWord[] {
  const lesson = LESSONS[soundId];
  if (!lesson) return [];
  return lesson.blend
    .filter((card: WordCard) => /^[a-z]{2,8}$/.test(card.word))
    .map((card) => ({ word: card.word, graphemes: card.graphemes, pl: card.pl, emoji: card.emoji, soundId }));
}

/** Dźwięki ćwiczone przez dziecko, w kolejności RWI. */
function practisedSounds(state: ProgressState): string[] {
  const practised = SOUNDS.map((sound) => sound.id).filter((id) => (state.sounds[id]?.sessions ?? 0) > 0);
  return practised.length > 0 ? practised : STARTER_SOUNDS;
}

/** Ile słów ma pula dyktanda (słowa z lekcji ćwiczonych dźwięków). */
export function spellPoolSize(state: ProgressState): number {
  return new Set(practisedSounds(state).flatMap((soundId) => wordsOf(soundId).map((word) => word.word))).size;
}

export function spellPlans(state: ProgressState, now = Date.now()): Map<string, ItemPlan> {
  const plans = new Map<string, ItemPlan>();
  const grouped = groupAttempts(state.attempts, (attempt) => (attempt.exercise === "spell" ? attempt.item.toLowerCase() : null));
  for (const [key, attempts] of grouped) {
    const plan = planItem(key, attempts, now);
    if (plan) plans.set(key, plan);
  }
  return plans;
}

export function todaysSpelling(state: ProgressState, now = Date.now()): SpellWord[] {
  const pool = new Map<string, SpellWord>();
  for (const soundId of practisedSounds(state)) {
    for (const word of wordsOf(soundId)) if (!pool.has(word.word)) pool.set(word.word, word);
  }
  const plans = spellPlans(state, now);
  const due = [...pool.values()]
    .filter((word) => {
      const plan = plans.get(word.word);
      return plan && isDue(plan, now);
    })
    .sort((a, b) => plans.get(a.word)!.recall - plans.get(b.word)!.recall)
    .slice(0, SPELL_MAX_DUE);
  // Nowe: najpierw z ostatnio ćwiczonych dźwięków (koniec listy RWI).
  const fresh = [...pool.values()].filter((word) => !plans.has(word.word)).reverse();
  const picked = [...due, ...fresh].slice(0, SPELL_COUNT);
  if (picked.length < SPELL_COUNT) {
    const rest = [...pool.values()]
      .filter((word) => !picked.includes(word))
      .sort((a, b) => (plans.get(a.word)?.dueTs ?? 0) - (plans.get(b.word)?.dueTs ?? 0));
    picked.push(...rest.slice(0, SPELL_COUNT - picked.length));
  }
  // Losowa kolejność, żeby słowa z jednej lekcji nie szły blokiem.
  return picked
    .map((word) => ({ word, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(({ word }) => word);
}

/** Odległość edycyjna — „prawie dobrze” to jedna literka różnicy. */
export function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Podpowiedź: 1 — pierwsza litera i kreski, 2 — co druga litera. */
export function spellHint(word: string, level: number): string {
  return word
    .split("")
    .map((letter, i) => (level >= 2 ? (i % 2 === 0 ? letter : "_") : i === 0 ? letter : "_"))
    .join(" ");
}
