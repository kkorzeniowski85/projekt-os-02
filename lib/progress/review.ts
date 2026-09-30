/**
 * 🔁 Powtórka — to, co dziecko ostatnio myliło, wraca po czasie.
 *
 * PO CO: słowo pomylone raz i nigdy więcej niewidziane zwykle ucieka. Z badań
 * nad powtórką rozłożoną w czasie (spacing) i efektem testowania: najlepiej
 * zapamiętujemy to, co przywołujemy z pamięci PO przerwie — nie od razu. Runda
 * bonusowa w sesji robi to „od razu”; ta powtórka robi to po przerwie.
 *
 * Reguła (per słowo/zwrot, z dziennika prób — nic nowego nie zapisujemy):
 *  - pozycja trafia do powtórki, gdy w ostatnich REVIEW_WINDOW_DAYS dniach
 *    była choć raz pomylona,
 *  - i od ostatniej pomyłki nie padły jeszcze DWIE poprawne odpowiedzi
 *    (jedna może być szczęściem przy wyborze z trzech),
 *  - i od ostatniej próby minęło co najmniej REVIEW_GAP_HOURS godzin — przerwa
 *    to sedno metody; tuż po sesji pomylone słowo ćwiczy runda bonusowa.
 *
 * Źródła: ćwiczenia słówek (vocab, phrase, command, collocation) i nowe
 * „Przeczytaj i pokaż” z lekcji literek (meaning) — słowo z lekcji staje się
 * wtedy zwykłym słówkiem do powtórki: nagranie → znaczenie.
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
import type { Attempt, ProgressState } from "./types";

export const REVIEW_TOPIC_ID = "review";
const REVIEW_WINDOW_DAYS = 30;
const REVIEW_GAP_HOURS = 12;
const REVIEW_MAX_ITEMS = 12;

const REVIEW_EXERCISES = new Set(["vocab", "phrase", "command", "collocation", "meaning"]);

type Due = { exercise: string; item: string; lastWrongTs: number };

/** Pozycje do powtórki, od najdawniej pomylonej (najbardziej „zapomnianej”). */
export function dueItems(state: ProgressState, now = Date.now()): Due[] {
  const byKey = new Map<string, Attempt[]>();
  for (const attempt of state.attempts) {
    if (attempt.correct === null || !REVIEW_EXERCISES.has(attempt.exercise)) continue;
    // „meaning” to słowo — powtarzamy je jak słówko, razem z próbami „vocab”.
    const kind = attempt.exercise === "meaning" ? "vocab" : attempt.exercise;
    const key = `${kind}\u0000${attempt.item.toLowerCase()}`;
    const list = byKey.get(key) ?? [];
    list.push(attempt);
    byKey.set(key, list);
  }

  const windowStart = now - REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const gap = REVIEW_GAP_HOURS * 60 * 60 * 1000;
  const due: Due[] = [];
  for (const [key, list] of byKey) {
    list.sort((a, b) => a.ts - b.ts);
    const lastWrongIndex = list.map((a) => a.correct).lastIndexOf(false);
    if (lastWrongIndex < 0) continue;
    const lastWrong = list[lastWrongIndex];
    if (lastWrong.ts < windowStart) continue;
    const correctSince = list.slice(lastWrongIndex + 1).filter((a) => a.correct === true).length;
    if (correctSince >= 2) continue;
    if (now - list[list.length - 1].ts < gap) continue;
    const [exercise] = key.split("\u0000");
    due.push({ exercise, item: lastWrong.item, lastWrongTs: lastWrong.ts });
  }
  return due.sort((a, b) => a.lastWrongTs - b.lastWrongTs).slice(0, REVIEW_MAX_ITEMS);
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
    goalPl: "Słowa, które ostatnio sprawiły kłopot — wracają, żeby zostały na dłużej.",
    emoji: "🔁",
    heroId: "cure",
    parentIntroPl:
      "Aplikacja zebrała słowa i zwroty, które dziecko pomyliło w ostatnich tygodniach — po co najmniej kilkunastu godzinach przerwy. Przypomnienie po przerwie utrwala najmocniej. Słowo znika z powtórki po dwóch dobrych odpowiedziach.",
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
