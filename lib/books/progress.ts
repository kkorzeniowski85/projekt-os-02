/**
 * Książeczki a postęp dziecka.
 *
 * Czytanie książeczki zapisuje się jak sesja toru czytania: pod dźwiękiem
 * bramki (Book.afterSoundId), z jedną próbą „book” na stronę
 * (item = "<id książeczki>/<numer strony>", correct = ocena rodzica albo null
 * w trybie samodzielnym). Strony NIE wchodzą do oceny dźwięku — store.tsx
 * pomija je w `scored`, bo czytanie z pomocą rodzica to nie test dźwięku.
 * Dzięki temu nic w formacie danych się nie zmienia (synchronizacja i kopie
 * działają jak dotąd), a historię czytań odtwarzamy tu z dziennika prób.
 */

import { BOOKS, type Book } from "@/lib/curriculum/books";
import { SOUNDS } from "@/lib/curriculum/sounds";
import {
  trackOf,
  type Attempt,
  type ProgressState,
  type SessionMode,
  type SessionRecord,
} from "@/lib/progress/types";

export const BOOK_EXERCISE = "book" as const;

export function bookItem(bookId: string, page: number): string {
  return `${bookId}/${page}`;
}

function bookIdOfItem(item: string): string {
  return item.split("/")[0] ?? item;
}

function soundIndex(soundId: string): number {
  return SOUNDS.findIndex((sound) => sound.id === soundId);
}

/** Najdalszy dźwięk sekwencji, który dziecko już ćwiczyło (−1 = jeszcze żaden). */
export function practisedIndex(state: ProgressState): number {
  let furthest = -1;
  for (const sound of Object.values(state.sounds)) {
    if (sound.sessions > 0) furthest = Math.max(furthest, soundIndex(sound.soundId));
  }
  return furthest;
}

/**
 * Książeczka jest do czytania, gdy dziecko ćwiczyło już jej dźwięk bramki
 * (albo dalszy). Wcześniej dostałoby słowa, których nie ma prawa umieć
 * przeczytać — to frustracja, nie ćwiczenie.
 */
export function bookUnlocked(state: ProgressState, book: Book): boolean {
  return soundIndex(book.afterSoundId) <= practisedIndex(state);
}

/** Próby czytania książeczki w oknie sesji — tak samo łączy je misja dnia. */
function bookAttemptsOf(bookAttempts: Attempt[], session: SessionRecord): Attempt[] {
  if (trackOf(session) !== "phonics") return [];
  return bookAttempts.filter(
    (attempt) =>
      attempt.soundId === session.soundId &&
      attempt.ts >= session.startedTs &&
      attempt.ts <= session.endedTs,
  );
}

function onlyBookAttempts(state: ProgressState): Attempt[] {
  return state.attempts.filter((attempt) => attempt.exercise === BOOK_EXERCISE);
}

/** Id książeczki czytanej w tej sesji albo null, gdy to zwykła sesja dźwięku. */
export function bookOfSession(state: ProgressState, session: SessionRecord): string | null {
  const first = bookAttemptsOf(onlyBookAttempts(state), session)[0];
  return first ? bookIdOfItem(first.item) : null;
}

export type BookRead = {
  bookId: string;
  ts: number;
  mode: SessionMode;
  /** Ile stron przeczytano (przerwana książeczka ma ich mniej niż całość). */
  pages: number;
  /** Strony ocenione przez rodzica jako „przeczytał sam”. */
  alone: number;
  /** Strony ocenione w ogóle (tryb samodzielny nie ocenia). */
  judged: number;
  finished: boolean;
};

/** Historia czytań, od najnowszego. */
export function bookReads(state: ProgressState): BookRead[] {
  const bookAttempts = onlyBookAttempts(state);
  if (bookAttempts.length === 0) return [];
  const reads: BookRead[] = [];
  for (const session of state.sessions) {
    const attempts = bookAttemptsOf(bookAttempts, session);
    if (attempts.length === 0) continue;
    const bookId = bookIdOfItem(attempts[0].item);
    const book = BOOKS.find((candidate) => candidate.id === bookId);
    const judged = attempts.filter((attempt) => attempt.correct !== null);
    reads.push({
      bookId,
      ts: session.endedTs,
      mode: session.mode,
      pages: attempts.length,
      alone: judged.filter((attempt) => attempt.correct === true).length,
      judged: judged.length,
      finished: book ? attempts.length >= book.pages.length : true,
    });
  }
  return reads.sort((a, b) => b.ts - a.ts);
}

/**
 * Książeczka do polecenia „dla chętnych”: nieprzeczytana do końca, najbliższa
 * poziomu dziecka (najtrudniejsza z odblokowanych) — tak jak w szkole dziecko
 * dostaje książeczkę z bieżącego etapu, a łatwiejsze zostają na rozgrzewkę.
 * Gdy wszystkie odblokowane są przeczytane — null (misja wraca do drugiej
 * sesji dźwięku).
 */
export function suggestedBook(state: ProgressState): Book | null {
  const finished = new Set(bookReads(state).filter((read) => read.finished).map((read) => read.bookId));
  const open = BOOKS.filter((book) => bookUnlocked(state, book) && !finished.has(book.id));
  return open[open.length - 1] ?? null;
}
