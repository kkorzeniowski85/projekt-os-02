"use client";

/**
 * Zakładka „Jak pisać w zeszycie": układy działań pisemnych tak, jak wyglądają
 * w angielskim zeszycie (White Rose / NCETM), do przepisania na kartkę.
 * Bez ćwiczeń i punktów — to wzór do naśladowania ręką, nie test. Każdy
 * zwrot nauczycielki ma nagranie: przycisk z samym zdaniem, stuknięcie czyta.
 */

import { Fragment, type ReactNode } from "react";
import { Card, PageHeader, ParentTip } from "@/components/akademia/ui";
import { playText } from "@/lib/akademia/audio";
import {
  NOTEBOOK_METHODS,
  NOTEBOOK_NOTATION,
  NOTEBOOK_PHRASES,
  type NotebookRow,
} from "@/lib/akademia/curriculum/maths";

export default function NotebookPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Jak pisać w zeszycie" subtitle="✍️ Matematyka · układ jak w angielskiej szkole" back="/matematyka/" />

      <Card className="flex flex-col gap-3">
        <p className="text-lg leading-snug">
          W angielskiej szkole matematykę pisze się w zeszycie w kratkę: <strong>jedna cyfra w jednej kratce</strong>, data u
          góry strony podkreślona linijką. Poniżej wzory do przepisania na kartkę — kratka po kratce, dokładnie tak
          samo.
        </p>
        <div className="flex flex-wrap gap-2">
          {NOTEBOOK_PHRASES.map((phrase) => (
            <PhraseButton key={phrase} text={phrase} />
          ))}
        </div>
      </Card>

      {NOTEBOOK_METHODS.map((method) => (
        <Card key={method.id} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-2xl font-black">
              <span aria-hidden>{method.emoji}</span> {method.titlePl}
            </h2>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-paper/70">{method.yearPl}</span>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex flex-col items-center gap-2">
              <p className="font-reading text-2xl font-black tabular-nums">{method.sumEn}</p>
              <NotebookGrid rows={method.rows} />
            </div>
            <ol className="flex flex-1 list-decimal flex-col gap-2 pl-5 text-base leading-snug text-paper/90">
              {method.stepsPl.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-paper/60">Co mówi nauczycielka</p>
            <div className="flex flex-wrap gap-2">
              {method.phrases.map((phrase) => (
                <PhraseButton key={phrase} text={phrase} />
              ))}
            </div>
          </div>
          <p className="rounded-2xl bg-hero-pink/10 p-3 text-sm leading-relaxed text-paper/90">
            <strong className="text-hero-pink">Inaczej niż w Polsce: </strong>
            {method.differencePl}
          </p>
        </Card>
      ))}

      <Card className="flex flex-col gap-4">
        <h2 className="text-2xl font-black">🔢 Cyfry, kropka, przecinek, pieniądze, data</h2>
        <ul className="flex flex-col gap-3">
          {NOTEBOOK_NOTATION.map((item) => (
            <li key={item.shown} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
              <span className="font-reading min-w-56 whitespace-pre text-4xl font-black tabular-nums">{item.shown}</span>
              <span className="text-base leading-snug text-paper/90">{item.pl}</span>
            </li>
          ))}
        </ul>
      </Card>

      <ParentTip title="Jak ćwiczyć z kartką (dla rodzica)">
        <p>
          Jedno działanie dziennie, na kartce w kratkę (może być zeszyt w kratkę 1 cm). Dziecko przepisuje układ z ekranu
          kratka po kratce — z literami H T O, małymi cyframi pod kreską, przekreśleniem. Rodzic stuka w zwrot i czyta
          go razem z nagraniem, dziecko robi ten krok ręką. Nie chodzi o liczenie (to dziecko umie), tylko o to, żeby
          układ i słowa („exchange”, „remainder”) były oswojone, zanim zobaczy je na tablicy. Po tygodniu można dać
          własne liczby: „347 + 285 — set it out like this”.
        </p>
      </ParentTip>
    </div>
  );
}

/** Przycisk z samym zdaniem — stuknięcie czyta (jak PhraseSpeaker w Lidze). */
function PhraseButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => void playText(text)}
      aria-label={`Posłuchaj: ${text}`}
      className="flex max-w-full items-center gap-2 rounded-blob bg-hero-gold px-4 py-3 text-left text-lg font-bold text-night shadow-[0_5px_0_#c99a1f] transition active:translate-y-1 active:shadow-none"
    >
      <span aria-hidden>🔊</span>
      <span className="font-reading">{text}</span>
    </button>
  );
}

/**
 * Kratki zeszytu: każda komórka to jedna kratka. „rule" = kreska wyniku,
 * `frameFrom` = „przystanek" dzielenia (kreska nad dzielną i z lewej).
 */
function NotebookGrid({ rows }: { rows: NotebookRow[] }) {
  const columns = Math.max(...rows.map((row) => (row === "rule" ? 0 : row.cells.length)));
  return (
    <div
      className="inline-grid rounded-xl bg-paper p-2 text-night"
      style={{ gridTemplateColumns: `repeat(${columns}, 2.75rem)` }}
      role="img"
      aria-label="Układ działania w kratkach zeszytu"
    >
      {rows.map((row, rowIndex) =>
        row === "rule" ? (
          <div key={rowIndex} className="h-1.5 border-t-4 border-night" style={{ gridColumn: `1 / span ${columns}` }} />
        ) : (
          <Fragment key={rowIndex}>
            {Array.from({ length: columns }, (_, col) => {
              const framed = row.frameFrom !== undefined && col >= row.frameFrom;
              return (
                <span
                  key={col}
                  className={`flex h-11 items-center justify-center border border-hero-blue/15 font-reading text-3xl font-black tabular-nums ${
                    row.muted ? "text-base font-bold text-night/45" : ""
                  } ${framed ? "border-t-4 border-t-night" : ""} ${framed && col === row.frameFrom ? "border-l-4 border-l-night" : ""}`}
                >
                  {renderCell(row.cells[col] ?? "")}
                </span>
              );
            })}
          </Fragment>
        ),
      )}
    </div>
  );
}

/** ^1^ = mała cyfra (exchange), ~7~ = przekreślona. */
function renderCell(cell: string): ReactNode {
  return cell.split(/(\^[^^]+\^|~[^~]+~)/).map((token, index) => {
    if (token.startsWith("^")) {
      return (
        <sup key={index} className="text-base font-black text-hero-pink">
          {token.slice(1, -1)}
        </sup>
      );
    }
    if (token.startsWith("~")) {
      return (
        <s key={index} className="text-night/50 decoration-hero-pink decoration-[3px]">
          {token.slice(1, -1)}
        </s>
      );
    }
    return <Fragment key={index}>{token}</Fragment>;
  });
}
