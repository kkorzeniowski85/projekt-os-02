"use client";

/**
 * Tryb rodzica — zgodnie z briefem główne miejsce pracy na komputerze.
 *
 * Jedna bramka (przytrzymanie 3 s, klucz dawnej Ligi Dźwięków) i cztery
 * zakładki: panele obu działów (wydzielone bez zmian logiki z paneli dawnych
 * aplikacji), wspólna synchronizacja z kopiami zapasowymi i jeden raport dla
 * Claude z obu działów.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { ParentGate } from "@/components/ParentGate";
import { AkademiaPanel } from "@/components/rodzic/AkademiaPanel";
import { LigaPanel } from "@/components/rodzic/LigaPanel";
import { ReportPanel } from "@/components/rodzic/ReportPanel";
import { SyncPanel } from "@/components/rodzic/SyncPanel";
import { useProgress as useAkademiaProgress } from "@/lib/akademia/progress/store";
import { useProgress } from "@/lib/progress/store";

const TABS = [
  { id: "dzwieki", label: "🔤 Dźwięki" },
  { id: "akademia", label: "🎓 Akademia" },
  { id: "synchronizacja", label: "🔄 Synchronizacja i kopie" },
  { id: "raport", label: "📋 Raport dla Claude" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Ostatnia zakładka do zamknięcia karty — powrót z „Otwórz sesję" nie gubi miejsca. */
const TAB_KEY = "phonics.parent-tab.v1";

export default function ParentPage() {
  return (
    <ParentGate>
      <ParentPanel />
    </ParentGate>
  );
}

function ParentPanel() {
  const { ready: ligaReady } = useProgress();
  const { ready: akademiaReady } = useAkademiaProgress();
  const [tab, setTab] = useState<TabId>("dzwieki");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(TAB_KEY);
      if (TABS.some((candidate) => candidate.id === saved)) setTab(saved as TabId);
    } catch {
      // Brak sessionStorage — zawsze pierwsza zakładka.
    }
  }, []);

  function choose(next: TabId) {
    setTab(next);
    try {
      sessionStorage.setItem(TAB_KEY, next);
    } catch {
      // jw.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black">Tryb rodzica</h1>
        <Link href="/" className="flex min-h-11 items-center rounded-full bg-white/10 px-4 text-sm">
          ← Do aplikacji
        </Link>
      </header>

      {!(ligaReady && akademiaReady) && <p className="text-paper/60">Wczytywanie danych…</p>}

      <nav role="tablist" aria-label="Działy panelu rodzica" className="flex flex-wrap gap-2">
        {TABS.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            role="tab"
            aria-selected={tab === candidate.id}
            onClick={() => choose(candidate.id)}
            className={`min-h-12 rounded-full px-5 text-sm font-bold transition ${
              tab === candidate.id ? "bg-hero-gold text-night" : "bg-white/10 text-paper hover:bg-white/15"
            }`}
          >
            {candidate.label}
          </button>
        ))}
      </nav>

      <div role="tabpanel">
        {tab === "dzwieki" && <LigaPanel />}
        {tab === "akademia" && <AkademiaPanel />}
        {tab === "synchronizacja" && <SyncPanel />}
        {tab === "raport" && <ReportPanel />}
      </div>
    </div>
  );
}
