"use client";

/**
 * 🎧 Posłuchaj całej książeczki — strony grają po kolei, bieżąca jest
 * podświetlona (punkt 7 z aplikacji OET rodzica, 2026-11-22). Na ekranie
 * końcowym, PO czytaniu: najpierw dziecko dekoduje samo, potem słucha całości
 * płynnie, np. w samochodzie albo przed snem. Głos książeczki (bookVoice).
 */

import { useEffect, useRef, useState } from "react";
import { playPhraseSequence, stopAudio } from "@/lib/audio";
import { bookVoice, type Book } from "@/lib/curriculum/books";

export function BookListen({ book }: { book: Book }) {
  const [current, setCurrent] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const runRef = useRef(0);
  const voice = bookVoice(book);

  useEffect(() => () => stopAudio(), []);

  function play() {
    const run = ++runRef.current;
    setPlaying(true);
    void playPhraseSequence(
      book.pages.map((page, index) => ({ text: page.en, voice, onStart: () => setCurrent(index) })),
      700,
    ).then(() => {
      if (run !== runRef.current) return;
      setPlaying(false);
      setCurrent(null);
    });
  }

  function stop() {
    runRef.current += 1;
    stopAudio();
    setPlaying(false);
    setCurrent(null);
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3 text-left">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={playing ? stop : play}
          className={`flex min-h-14 items-center gap-2 rounded-blob px-6 py-3 text-xl font-bold shadow-[0_6px_0_rgba(0,0,0,0.3)] transition active:translate-y-1 active:shadow-none ${
            playing ? "bg-white/15 text-paper" : "bg-hero-gold text-night"
          }`}
        >
          <span aria-hidden>{playing ? "⏹" : "🎧"}</span> {playing ? "Stop" : "Posłuchaj całej książeczki"}
        </button>
      </div>
      {playing && (
        <ol className="flex flex-col gap-2">
          {book.pages.map((page, index) => (
            <li
              key={index}
              className={`flex items-center gap-3 rounded-2xl px-4 py-2 transition ${
                current === index ? "bg-hero-gold/25 ring-2 ring-hero-gold" : "bg-white/5"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {page.emoji}
              </span>
              <span className="font-reading text-lg">{page.en}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
