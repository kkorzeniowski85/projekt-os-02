"use client";

/**
 * 📖 Książeczki — lista czytanek do dekodowania (lib/curriculum/books.ts).
 *
 * Odblokowana jest książeczka, której dźwięk bramki dziecko już ćwiczyło;
 * dalsze pokazują się z kłódką i nazwą dźwięku, od którego się zaczną. Bez
 * dat i odliczania — to plan rodzica, nie dziecka.
 */

import Link from "next/link";
import { Card } from "@/components/ui";
import { bookReads, bookUnlocked } from "@/lib/books/progress";
import { BOOKS } from "@/lib/curriculum/books";
import { getSound } from "@/lib/curriculum/sounds";
import { useProgress } from "@/lib/progress/store";

export default function BooksPage() {
  const { state, ready } = useProgress();
  const reads = bookReads(state);

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

      <div className="grid gap-4 sm:grid-cols-2">
        {BOOKS.map((book) => {
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
                  {book.pages.length} stron · po dźwięku{" "}
                  <span className="font-reading">{gate}</span>
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
              key={book.id}
              href={`/ksiazeczki/${book.id}`}
              className={`${className} transition active:translate-y-1 active:shadow-none`}
            >
              {inner}
            </Link>
          ) : (
            <div key={book.id} className={`${className} opacity-70`} aria-disabled>
              {inner}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-paper/50">
        Wydruk: otwórz książeczkę i stuknij „Drukuj” — wersja do czytania na papierze, z miejscem
        na rysunek.
      </p>
    </div>
  );
}
