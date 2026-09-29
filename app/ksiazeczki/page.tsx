"use client";

/**
 * 📖 Książeczki — lista czytanek do dekodowania (lib/curriculum/books.ts),
 * pogrupowana w zestawy RWI jak mapa dźwięków.
 *
 * Odblokowana jest książeczka, której dźwięk bramki dziecko już ćwiczyło;
 * dalsze pokazują się z kłódką i nazwą dźwięku, od którego się zaczną.
 * Zestaw bez żadnej odblokowanej książeczki jest zwinięty — dziecko widzi
 * swój etap, nie ścianę 50 tytułów. Bez dat i odliczania — to plan rodzica,
 * nie dziecka.
 */

import Link from "next/link";
import { Card } from "@/components/ui";
import { bookReads, bookUnlocked } from "@/lib/books/progress";
import { BOOKS, type Book } from "@/lib/curriculum/books";
import { getSound, SET_LABEL, type SoundSet } from "@/lib/curriculum/sounds";
import { useProgress } from "@/lib/progress/store";

const SETS: SoundSet[] = [1, 2, 3];

function ksiazeczekWord(n: number): string {
  if (n === 1) return "książeczka";
  const last = n % 10;
  const tens = n % 100;
  if (last >= 2 && last <= 4 && !(tens >= 12 && tens <= 14)) return "książeczki";
  return "książeczek";
}

export default function BooksPage() {
  const { state, ready } = useProgress();
  const reads = bookReads(state);
  const bySet = SETS.map((set) => ({
    set,
    books: BOOKS.filter((book) => getSound(book.afterSoundId)?.set === set),
  })).filter((group) => group.books.length > 0);

  function BookCard({ book }: { book: Book }) {
    const unlocked = ready && bookUnlocked(state, book);
    const finished = reads.filter((read) => read.bookId === book.id && read.finished).length;
    const gate = getSound(book.afterSoundId)?.grapheme ?? book.afterSoundId;
    const inner = (
      <>
        <span className="text-5xl" aria-hidden>
          {book.emoji}
        </span>
        <span className="min-w-0">
          <span className="font-reading block text-2xl font-black">{book.titleEn}</span>
          <span className="block text-sm text-hero-cyan">{book.titlePl}</span>
          <span className="block text-xs text-paper/50">
            {book.pages.length} stron · po dźwięku <span className="font-reading">{gate}</span>
            {finished > 0 ? ` · ✅ przeczytana ${finished}×` : ""}
          </span>
          {ready && !unlocked && (
            <span className="block text-xs font-bold text-hero-gold">
              🔒 najpierw dźwięk <span className="font-reading">{gate}</span>
            </span>
          )}
        </span>
      </>
    );
    const className =
      "flex min-h-14 items-center gap-4 rounded-blob bg-white/10 p-5 text-left shadow-[0_6px_0_rgba(0,0,0,0.3)]";
    return unlocked ? (
      <Link
        href={`/ksiazeczki/${book.id}`}
        className={`${className} transition active:translate-y-1 active:shadow-none`}
      >
        {inner}
      </Link>
    ) : (
      <div className={`${className} opacity-70`} aria-disabled>
        {inner}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">
            <span aria-hidden>📖</span> Książeczki
          </h1>
          <p className="text-sm text-paper/60">
            Przeczytaj sam. Najpierw czytasz, potem sprawdzasz nagraniem.
          </p>
        </div>
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center rounded-full bg-white/10 px-5 text-sm"
        >
          ← Liga
        </Link>
      </header>

      {BOOKS.length === 0 && (
        <Card>
          <p className="text-paper/70">Książeczki są w przygotowaniu.</p>
        </Card>
      )}

      {bySet.map(({ set, books }) => {
        const anyUnlocked = ready && books.some((book) => bookUnlocked(state, book));
        return (
          <details key={set} open={anyUnlocked || bySet.length === 1} className="group">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 text-xl font-bold">
              <span aria-hidden className="text-sm transition group-open:rotate-90">
                ▶
              </span>
              {SET_LABEL[set]}
              <span className="text-sm font-normal text-paper/50">
                · {books.length} {ksiazeczekWord(books.length)}
              </span>
              {ready && !anyUnlocked && <span aria-label="jeszcze zablokowane">🔒</span>}
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </details>
        );
      })}

      <p className="text-xs text-paper/50">
        Wydruk: otwórz książeczkę i stuknij „Drukuj” — wersja do czytania na papierze, z miejscem
        na rysunek.
      </p>
    </div>
  );
}
