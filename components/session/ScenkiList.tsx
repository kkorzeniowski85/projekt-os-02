"use client";

/**
 * 🎭 Scenki poza sesją — lista scenek tematu, każda do posłuchania i zagrania.
 *
 * Po co osobne wejście: w sesji scenka jest jedna, dwie i wybiera ją los. A
 * dziecko, któremu spodobała się rozmowa z nauczycielką o toalecie, chce ją
 * zagrać jeszcze raz — od razu, bez całej sesji. Tu może: bez punktów, bez
 * zapisu (poza sesją nic nie zapisujemy), z tym samym poziomem podpowiedzi, na
 * jaki wskazuje historia.
 */

import Link from "next/link";
import { useCallback, useState } from "react";
import { SceneScreen, type SpeakingLevel } from "@/components/session/Speaking";
import { unlockAudio } from "@/lib/audio";
import { type Phrase, type Topic } from "@/lib/curriculum/vocab";
import { phraseScene } from "@/lib/curriculum/vocabParent";
import { isChildLine } from "@/lib/curriculum/scenes";
import { getHero } from "@/lib/heroes";
import { speakingLevel } from "@/lib/progress/rules";
import { useProgress } from "@/lib/progress/store";

function kwestieWord(n: number): string {
  return n === 5 ? "kwestii" : "kwestie";
}

export function ScenkiList({ topic }: { topic: Topic }) {
  const { state } = useProgress();
  const hero = getHero(topic.heroId);
  const [open, setOpen] = useState<Phrase | null>(null);
  const scenes = topic.phrases.filter((phrase) => phraseScene(phrase.en).length > 0);

  // Ten sam poziom co w sesji: dziecko dostaje tyle pomocy, na ile wskazuje
  // historia ocen rodzica. Poza sesją nic nie zapisujemy, więc poziom tu nie
  // rośnie — to plac zabaw, nie sprawdzian.
  const levelOf = useCallback(
    (phraseEn: string): SpeakingLevel => speakingLevel(state, phraseEn),
    [state],
  );

  if (open) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setOpen(null)}
          className="self-start text-sm text-paper/60 underline"
        >
          ← Wróć do scenek
        </button>
        <SceneScreen
          key={open.en}
          phrase={open}
          lines={phraseScene(open.en)}
          hero={hero}
          mode="solo"
          levelOf={levelOf}
          onNext={() => setOpen(null)}
          nextLabel="Do scenek ▸"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">
            <span aria-hidden>🎭</span> Scenki: {topic.titlePl}
          </h1>
          <p className="text-sm text-paper/60">
            Posłuchaj rozmowy i zagraj swoją rolę. Bez punktów — dla przyjemności.
          </p>
        </div>
        <Link
          href={`/slownictwo/${topic.id}`}
          className="flex min-h-11 shrink-0 items-center rounded-full bg-white/10 px-5 text-sm"
        >
          ← Temat
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {scenes.map((phrase) => {
          const lines = phraseScene(phrase.en);
          const roles = [...new Set(lines.filter((line) => !isChildLine(line)).map((line) => line.kto))];
          return (
            <button
              key={phrase.en}
              type="button"
              onClick={() => {
                // Gest użytkownika — jedyny moment, w którym iOS odblokuje
                // automatyczny start rozmowy na następnym ekranie.
                unlockAudio();
                setOpen(phrase);
              }}
              className="flex min-h-14 items-center gap-4 rounded-blob bg-white/10 p-5 text-left shadow-[0_6px_0_rgba(0,0,0,0.3)] transition active:translate-y-1 active:shadow-none"
            >
              <span className="text-5xl" aria-hidden>
                {phrase.emoji}
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold">{phrase.situationPl}</span>
                <span className="block text-sm text-hero-cyan">{phrase.pl}</span>
                <span className="block text-xs text-paper/50">
                  {lines.length} {kwestieWord(lines.length)} · z tobą: {roles.join(", ")}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
