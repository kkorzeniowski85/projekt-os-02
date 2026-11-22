"use client";

/**
 * ✍️ Dyktando — słowa z poznanych dźwięków (lib/progress/spell.ts). Lista
 * liczona RAZ po wczytaniu danych, jak Powtórka i Rozmowa.
 */

import { useState } from "react";
import { SpellRunner } from "@/components/spell/SpellRunner";
import { todaysSpelling, type SpellWord } from "@/lib/progress/spell";
import { useProgress } from "@/lib/progress/store";

export default function SpellPage() {
  const { state, ready } = useProgress();
  const [words, setWords] = useState<SpellWord[] | null>(null);

  if (!ready) return <p className="text-paper/60">Wczytywanie…</p>;
  if (words === null) {
    setWords(todaysSpelling(state));
    return null;
  }
  return <SpellRunner words={words} />;
}
