"use client";

import Link from "next/link";
import { PageHeader, ParentTip } from "@/components/akademia/ui";
import { UnitList } from "@/components/akademia/UnitList";
import { MATHS_TOPICS } from "@/lib/akademia/curriculum/maths";

export default function MathsHubPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Matematyka po angielsku" subtitle="SPARK · liczby, słowa działań, zegar, jednostki, zapis" />
      <UnitList
        module="maths"
        units={MATHS_TOPICS.map((topic) => ({
          id: topic.id,
          href: `/matematyka/${topic.id}/`,
          emoji: topic.emoji,
          title: topic.titlePl,
          subtitle: topic.goalPl,
        }))}
      />
      {/* Zakładka bez ćwiczeń i punktów — dlatego osobny kafelek, nie temat z listy. */}
      <Link
        href="/matematyka/zeszyt/"
        className="flex items-start gap-3 rounded-blob border border-hero-gold/40 bg-hero-gold/10 p-4 transition hover:bg-hero-gold/15 active:translate-y-0.5"
      >
        <span className="text-4xl" aria-hidden>
          ✍️
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-lg font-black leading-tight">Jak pisać w zeszycie</span>
          <span className="text-sm text-paper/65">
            Słupki z „exchange”, dzielenie „bus stop”, cyfry, kropka i przecinek — wzory do przepisania na kartkę, ze
            zwrotami nauczycielki.
          </span>
        </span>
      </Link>
      <ParentTip title="Po co ten dział (dla rodzica)">
        <p>
          Matematyki dziecko nie uczy się tu od zera — uczy się języka, w którym angielska lekcja ją podaje.
          Dziecko, które świetnie liczy po polsku, na lekcji w Anglii gubi się na „the difference between”,
          „share equally” albo „half past three”. Najważniejsze tematy na start: „Słowa działań” i „Thirteen
          czy thirty?”.
        </p>
      </ParentTip>
    </div>
  );
}
