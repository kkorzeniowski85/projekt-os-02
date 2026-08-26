"use client";

/**
 * Rymowanki — klasyczne brytyjskie nursery rhymes.
 *
 * Osobna strona, nie temat toru 2, bo rymowanka nie jest ćwiczeniem z
 * punktacją: to materiał do wspólnego słuchania i śpiewania. Rytm i rym
 * wspierają zapamiętywanie u dzieci w tym wieku lepiej niż recytacja, a te
 * konkretne teksty dziecko usłyszy w brytyjskiej szkole w pierwszym tygodniu.
 *
 * Nagranie to rytmiczne czytanie (chant) — melodię dokłada rodzic; wskazówka
 * przy każdej rymowance mówi, skąd ją wziąć.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { clipExists, playRhyme, rhymeClipPath, unlockAudio } from "@/lib/audio";
import { RHYMES } from "@/lib/curriculum/rhymes";

export default function RhymesPage() {
  const [dostepne, setDostepne] = useState<Record<string, boolean>>({});
  const [graja, setGraja] = useState<string | null>(null);

  useEffect(() => {
    let aktywna = true;
    void (async () => {
      const wpisy = await Promise.all(
        RHYMES.map(async (rhyme) => [rhyme.id, await clipExists(rhymeClipPath(rhyme.id))] as const),
      );
      if (aktywna) setDostepne(Object.fromEntries(wpisy));
    })();
    return () => {
      aktywna = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Rymowanki</h1>
          <p className="text-sm text-paper/60">
            Zna je każde brytyjskie dziecko — poznaj je pierwszy.
          </p>
        </div>
        <Link
          href="/"
          className="flex min-h-11 items-center rounded-full bg-white/10 px-5 text-sm"
        >
          ← Baza
        </Link>
      </header>

      <Card className="text-sm text-paper/70">
        <p>
          Te rymowanki śpiewa się w brytyjskiej szkole, na urodzinach i w bajkach. Nagranie
          czyta je rytmicznie — <strong>melodię dodajcie sami</strong> (wskazówka przy każdej
          mówi jak). Klaskanie i tupanie w rytm jest jak najbardziej wskazane.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {RHYMES.map((rhyme) => (
          <Card key={rhyme.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-5xl" aria-hidden>
                {rhyme.emoji}
              </span>
              <div className="min-w-0">
                <h2 className="font-reading text-xl font-black">{rhyme.titleEn}</h2>
                <p className="text-sm text-paper/60">{rhyme.titlePl}</p>
              </div>
              {dostepne[rhyme.id] && (
                <button
                  type="button"
                  disabled={graja === rhyme.id}
                  onClick={() => {
                    unlockAudio();
                    setGraja(rhyme.id);
                    void playRhyme(rhyme.id).finally(() => setGraja(null));
                  }}
                  className="ml-auto flex min-h-12 shrink-0 items-center gap-2 rounded-blob bg-hero-gold px-5 font-bold text-night shadow-[0_6px_0_#c99a1f] transition active:translate-y-1 active:shadow-none disabled:opacity-60"
                >
                  🔊 {graja === rhyme.id ? "Gra…" : "Posłuchaj"}
                </button>
              )}
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              {rhyme.lines.map((line, numer) => (
                <div key={numer} className="mb-2 last:mb-0">
                  <p className="font-reading font-bold">{line.en}</p>
                  <p className="text-xs text-paper/50">{line.pl}</p>
                </div>
              ))}
            </div>

            <p className="rounded-2xl border border-hero-cyan/40 bg-hero-cyan/10 p-3 text-xs text-paper/80">
              <strong className="text-hero-cyan">Dla rodzica: </strong>
              {rhyme.parentTipPl}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
