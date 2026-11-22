"use client";

/**
 * Karty panelu rodzica z pomysłów z aplikacji OET (2026-11-22):
 *  - Ten tydzień — raport tygodniowy do skopiowania (lib/week.ts),
 *  - Słowa, które uciekają — po 4 „ucieczkach” rodzic decyduje (lib/progress/review.ts),
 *  - Plan powtórek — FSRS albo dawny prosty (przełącznik, lib/settings.ts).
 */

import { useState } from "react";
import { BigButton, Card, PhraseSpeaker, WordSpeaker } from "@/components/ui";
import { useProgress as useAkademiaProgress } from "@/lib/akademia/progress/store";
import { REVIEW_DAILY_MAX, overdueCount, reviewKeyParts, slippingItems } from "@/lib/progress/review";
import { useProgress } from "@/lib/progress/store";
import { useSettings, writeSettings } from "@/lib/settings";
import { DAY_LETTERS, WEEK_GOAL_DAYS, weekReport } from "@/lib/week";

const KIND_LABEL: Record<string, string> = {
  vocab: "słowo",
  phrase: "zwrot",
  command: "polecenie",
  collocation: "kolokacja",
};

export function WeekReportCard() {
  const { state } = useProgress();
  const { state: akademia } = useAkademiaProgress();
  const report = weekReport(state, akademia);
  const [copied, setCopied] = useState(false);
  const daysDone = report.days.filter(Boolean).length;

  async function copy() {
    try {
      await navigator.clipboard.writeText(report.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Ten tydzień</h2>
      <p className="mb-3 text-sm text-paper/70">
        Dni nauki: <strong>{daysDone} z 7</strong> (cel {WEEK_GOAL_DAYS}). Bez serii — opuszczony dzień niczego nie
        kasuje.
      </p>
      <div className="mb-3 flex gap-2" aria-hidden>
        {report.days.map((done, index) => (
          <span
            key={index}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
              done ? "bg-hero-lime text-night" : "bg-white/10 text-paper/50"
            }`}
          >
            {DAY_LETTERS[index]}
          </span>
        ))}
      </div>
      <pre className="mb-3 overflow-x-auto rounded-2xl bg-black/20 p-3 text-xs leading-relaxed whitespace-pre-wrap text-paper/85">
        {report.text}
      </pre>
      <BigButton tone="quiet" onClick={() => void copy()}>
        {copied ? "Skopiowane ✓" : "📋 Kopiuj raport"}
      </BigButton>
    </Card>
  );
}

export function SlippingCard() {
  const { state, setItemDecision } = useProgress();
  const slipping = slippingItems(state);
  const stopped = Object.entries(state.itemDecisions ?? {})
    .filter(([, decision]) => decision.action === "stop")
    .map(([key]) => key);

  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Słowa, które uciekają</h2>
      <p className="mb-3 text-sm text-paper/70">
        Słowo, które dziecko zapomniało już 4 razy, wypada z Powtórki — samo powtarzanie przestało działać. Przećwiczcie
        je razem (obrazek, gest, zdanie z życia) i zdecyduj: nowa szansa (plan liczy się od nowa) albo odpuszczamy.
      </p>
      {slipping.length === 0 ? (
        <p className="text-sm text-paper/60">Nic nie ucieka. 🎉</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {slipping.map((plan) => {
            const { kind } = reviewKeyParts(plan.key);
            return (
              <li key={plan.key} className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/5 p-3">
                {kind === "vocab" ? (
                  <WordSpeaker word={plan.last.item} label={plan.last.item} reading />
                ) : (
                  <PhraseSpeaker text={plan.last.item} />
                )}
                <span className="text-xs text-paper/60">
                  {KIND_LABEL[kind] ?? kind} · uciekło {plan.lapses}×
                </span>
                <span className="ml-auto flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setItemDecision(plan.key, "retry")}
                    className="min-h-11 rounded-full bg-hero-lime px-4 text-sm font-bold text-night"
                  >
                    Spróbujmy jeszcze raz
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemDecision(plan.key, "stop")}
                    className="min-h-11 rounded-full bg-white/10 px-4 text-sm font-bold"
                  >
                    Odpuść
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {stopped.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-paper/70">Odpuszczone ({stopped.length})</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {stopped.map((key) => (
              <li key={key} className="flex items-center gap-2">
                <span className="font-reading">{reviewKeyParts(key).item}</span>
                <button
                  type="button"
                  onClick={() => setItemDecision(key, "retry")}
                  className="ml-auto min-h-11 rounded-full bg-white/10 px-4 text-sm font-bold"
                >
                  Przywróć
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

export function ReviewPlanCard() {
  const { state } = useProgress();
  const { reviewPlan } = useSettings();
  const overdue = reviewPlan === "fsrs" ? overdueCount(state) : 0;

  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Plan powtórek</h2>
      <p className="mb-3 text-sm text-paper/70">
        <strong>FSRS</strong> (od 22.11.2026): wszystko, co dziecko już poznało, wraca po czasie — dobra odpowiedź
        odsuwa słowo na dłużej, pomyłka przybliża. Najwyżej {REVIEW_DAILY_MAX} dziennie, najpierw to, co najpewniej
        ucieka. <strong>Prosty</strong> (jak wcześniej): wraca tylko to, co ostatnio pomylone. Przełączenie niczego nie
        kasuje — plan liczy się z historii odpowiedzi. Ustawienie tylko na tym urządzeniu.
      </p>
      <div role="group" aria-label="Plan powtórek" className="flex flex-wrap gap-2">
        {(["fsrs", "simple"] as const).map((plan) => (
          <button
            key={plan}
            type="button"
            onClick={() => writeSettings({ reviewPlan: plan })}
            aria-pressed={reviewPlan === plan}
            className={`min-h-11 rounded-full px-5 text-sm font-bold ${
              reviewPlan === plan ? "bg-hero-gold text-night" : "bg-white/10 text-paper"
            }`}
          >
            {plan === "fsrs" ? "FSRS" : "Prosty"}
          </button>
        ))}
      </div>
      {overdue > REVIEW_DAILY_MAX && (
        <p className="mt-3 text-sm text-hero-gold">
          Czeka {overdue} powtórek — rozłożą się na kolejne dni (najwyżej {REVIEW_DAILY_MAX} dziennie), żeby po przerwie
          nie wysypały się naraz.
        </p>
      )}
    </Card>
  );
}
