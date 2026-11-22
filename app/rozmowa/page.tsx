"use client";

/**
 * 🗣️ Rozmowa z bohaterem — „Rozmowa na dziś” (5 pytań z planu powtórek i
 * nowych) albo wybrany zestaw. Treść: lib/curriculum/talk.ts.
 *
 * Wybór pytań liczymy RAZ, po wczytaniu danych (jak Powtórka): zapis odpowiedzi
 * w trakcie nie może podmienić dziecku pytań pod palcem.
 */

import Link from "next/link";
import { useState } from "react";
import { TalkRunner } from "@/components/talk/TalkRunner";
import { BigButton, Card } from "@/components/ui";
import { TALK_SETS, type TalkEntry } from "@/lib/curriculum/talk";
import { spokenToday, talkSetEntries, talkSetProgress, todaysTalk } from "@/lib/progress/talk";
import { useProgress } from "@/lib/progress/store";

type Chosen = { title: string; entries: TalkEntry[] };

export default function TalkPage() {
  const { state, ready } = useProgress();
  const [chosen, setChosen] = useState<Chosen | null>(null);

  if (!ready) return <p className="text-paper/60">Wczytywanie…</p>;
  if (chosen) return <TalkRunner title={chosen.title} entries={chosen.entries} />;

  const doneToday = spokenToday(state) >= 3;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">
            <span aria-hidden>🦸</span> Rozmowa
          </h1>
          <p className="text-sm text-paper/60">Bohater pyta — Ty odpowiadasz na głos.</p>
        </div>
        <Link href="/" className="flex min-h-11 items-center rounded-full bg-white/10 px-5 text-sm">
          ← Baza
        </Link>
      </header>

      <Card className="border-hero-gold/40 bg-hero-gold/10">
        <p className="text-sm font-bold tracking-wide text-hero-gold uppercase">
          {doneToday ? "Dziś już rozmawialiśmy ✅" : "Rozmowa na dziś"}
        </p>
        <p className="mt-1 mb-4 text-xl font-black">5 pytań — nowe i te, które wracają.</p>
        <BigButton onClick={() => setChosen({ title: "Rozmowa na dziś", entries: todaysTalk(state) })} full>
          {doneToday ? "Jeszcze jedna rozmowa" : "Zaczynamy!"}
        </BigButton>
      </Card>

      <section className="flex flex-col gap-3" aria-labelledby="zestawy">
        <h2 id="zestawy" className="text-xl font-bold">
          Rozmowy na temat
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TALK_SETS.map((set) => {
            const progress = talkSetProgress(state, set.id);
            return (
              <button
                key={set.id}
                type="button"
                onClick={() => setChosen({ title: set.titlePl, entries: talkSetEntries(set.id) })}
                className="flex min-h-32 flex-col items-center justify-center gap-1 rounded-blob border border-white/10 bg-white/5 p-4 text-center shadow-[0_6px_0_rgba(0,0,0,0.25)] transition hover:bg-white/10 active:translate-y-1 active:shadow-none"
              >
                <span className="text-4xl" aria-hidden>
                  {set.emoji}
                </span>
                <span className="text-lg leading-tight font-black">{set.titlePl}</span>
                <span className="text-xs text-paper/65">
                  sam: {progress.own}/{progress.total}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
