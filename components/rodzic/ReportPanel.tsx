"use client";

/**
 * Raport dla Claude — jeden tekst z obu działów: raport dawnej Ligi
 * Dźwięków, a pod nim raport Akademii. Każdy liczy jego własny moduł
 * (lib/progress/report.ts, lib/akademia/progress/report.ts), bez zmian.
 * Jeden przycisk „Kopiuj” — rodzic wkleja całość na czat.
 */

import { useMemo, useState } from "react";
import { BigButton, Card } from "@/components/ui";
import {
  buildAttemptsCsv as buildAkademiaAttemptsCsv,
  buildMarkdownReport as buildAkademiaReport,
  buildSessionsCsv as buildAkademiaSessionsCsv,
} from "@/lib/akademia/progress/report";
import { useProgress as useAkademiaProgress } from "@/lib/akademia/progress/store";
import {
  buildAttemptsCsv,
  buildMarkdownReport,
  buildSessionsCsv,
  downloadFile,
} from "@/lib/progress/report";
import { useProgress } from "@/lib/progress/store";

export function ReportPanel() {
  const { state } = useProgress();
  const { state: akademia } = useAkademiaProgress();
  const [copied, setCopied] = useState(false);
  const date = new Date().toISOString().slice(0, 10);

  const report = useMemo(
    () =>
      [
        "# Liga — raport dla Claude (dwa działy)",
        "",
        "Jedna aplikacja, dwa działy nauki: **Dźwięki** (czytanie po angielsku metodą phonics i słownictwo) " +
          "oraz **Akademia** (tabliczka mnożenia pod MTC, matematyka po angielsku, czytanie ze zrozumieniem, język klasy). " +
          "Poniżej dwa raporty, jeden po drugim.",
        "",
        "---",
        "",
        buildMarkdownReport(state),
        "",
        "---",
        "",
        buildAkademiaReport(akademia),
      ].join("\n"),
    [state, akademia],
  );

  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Raport dla Claude</h2>
      <p className="mb-3 text-sm text-paper/60">
        Skopiuj i wklej na czat (co 2-4 tygodnie) — dostaniesz analizę postępu obu działów i
        propozycje, co zmienić. CSV tylko wtedy, gdy trzeba wejść głębiej.
      </p>
      <div className="mb-4 flex flex-wrap gap-3">
        <BigButton
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(report);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              // Schowek bywa niedostępny (np. stara przeglądarka) — wtedy plik.
              downloadFile(`liga-raport-${date}.md`, report, "text/markdown");
            }
          }}
        >
          {copied ? "Skopiowano ✓" : "Kopiuj raport"}
        </BigButton>
        <BigButton
          tone="quiet"
          onClick={() => downloadFile(`liga-raport-${date}.md`, report, "text/markdown")}
        >
          Pobierz .md
        </BigButton>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-paper/60">Dźwięki:</span>
        <BigButton
          tone="quiet"
          onClick={() => downloadFile(`dzwieki-proby-${date}.csv`, buildAttemptsCsv(state), "text/csv")}
        >
          CSV: próby
        </BigButton>
        <BigButton
          tone="quiet"
          onClick={() => downloadFile(`dzwieki-sesje-${date}.csv`, buildSessionsCsv(state), "text/csv")}
        >
          CSV: sesje
        </BigButton>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-paper/60">Akademia:</span>
        <BigButton
          tone="quiet"
          onClick={() =>
            downloadFile(`akademia-proby-${date}.csv`, buildAkademiaAttemptsCsv(akademia), "text/csv")
          }
        >
          CSV: próby
        </BigButton>
        <BigButton
          tone="quiet"
          onClick={() =>
            downloadFile(`akademia-sesje-${date}.csv`, buildAkademiaSessionsCsv(akademia), "text/csv")
          }
        >
          CSV: sesje
        </BigButton>
      </div>
      <pre className="max-h-[32rem] overflow-auto rounded-2xl bg-black/30 p-4 text-xs whitespace-pre-wrap select-text">
        {report}
      </pre>
    </Card>
  );
}
