"use client";

/**
 * 🔁 Powtórka — słowa i zwroty, które dziecko ostatnio myliło, po przerwie
 * (reguła: lib/progress/review.ts). Temat-składankę liczymy RAZ, po wczytaniu
 * danych: sesja zapisuje próby, a zmiana listy w trakcie gry podmieniłaby
 * dziecku ekrany pod palcem.
 */

import Link from "next/link";
import { useState } from "react";
import { VocabRunner } from "@/components/session/VocabRunner";
import { Card } from "@/components/ui";
import { buildReviewTopic } from "@/lib/progress/review";
import { useProgress } from "@/lib/progress/store";
import type { Topic } from "@/lib/curriculum/vocab";

export default function ReviewPage() {
  const { state, ready } = useProgress();
  const [frozen, setFrozen] = useState<{ topic: Topic | null } | null>(null);

  if (!ready) return <p className="text-paper/60">Wczytywanie…</p>;
  if (frozen === null) {
    // Jednorazowo, przy pierwszym renderze z danymi (setState w renderze —
    // wzorzec „dane pochodne zapamiętane”, React go dopuszcza).
    setFrozen({ topic: buildReviewTopic(state) });
    return null;
  }

  if (!frozen.topic) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black">
            <span aria-hidden>🔁</span> Powtórka
          </h1>
          <Link href="/" className="flex min-h-11 items-center rounded-full bg-white/10 px-5 text-sm">
            ← Liga
          </Link>
        </header>
        <Card>
          <p className="text-lg">Nic do powtórki — świetnie! 🎉</p>
          <p className="mt-2 text-sm text-paper/60">
            Gdy coś się pomyli w słówkach, wróci tutaj po przerwie, żeby zostało w głowie na dłużej.
          </p>
        </Card>
      </div>
    );
  }

  return <VocabRunner topic={frozen.topic} review />;
}
