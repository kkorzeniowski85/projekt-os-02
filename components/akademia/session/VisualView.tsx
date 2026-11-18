"use client";

/**
 * Obrazek pod pytaniem: duży napis, zegar, tablica „lots of", ciąg z luką,
 * tekst czytanki do zaglądania.
 */

import { useState } from "react";
import { ClockFace } from "@/components/akademia/ClockFace";
import { Speaker } from "@/components/akademia/ui";
import { playText } from "@/lib/akademia/audio";
import { pl, plForm } from "@/lib/akademia/pl";
import type { MarkStyle, Visual } from "@/lib/akademia/session/exercise";

export function VisualView({ visual, small = false }: { visual: Visual; small?: boolean }) {
  switch (visual.kind) {
    case "big":
      return (
        <p
          className={`font-reading font-black tabular-nums ${small ? "text-2xl" : "text-5xl sm:text-6xl"}`}
        >
          {visual.text}
        </p>
      );
    case "emoji":
      return (
        <div className={small ? "text-4xl" : "text-7xl"} aria-hidden>
          {visual.text}
        </div>
      );
    case "clock":
      return <ClockFace hour={visual.hour} minute={visual.minute} size={small ? 110 : 190} />;
    case "array":
      return <DotArray rows={visual.rows} cols={visual.cols} emoji={visual.emoji} small={small} />;
    case "sequence":
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {visual.items.map((value, index) => (
            <span
              key={index}
              className={`flex min-h-14 min-w-14 items-center justify-center rounded-2xl px-2 text-2xl font-black tabular-nums ${
                value === null ? "border-4 border-dashed border-hero-gold text-hero-gold" : "bg-white/10"
              }`}
            >
              {value === null ? "?" : value < 0 ? `−${-value}` : value}
            </span>
          ))}
        </div>
      );
    case "passage":
      return <PassagePeek title={visual.title} sentences={visual.sentences} />;
    case "marked":
      return <MarkedPicture emoji={visual.emoji} mark={visual.mark} small={small} />;
    case "dots":
      return <TenFrames total={visual.total} crossed={visual.crossed} added={visual.added} small={small} />;
  }
}

/**
 * Kropki w dziesiątkach, każda dziesiątka jako 5 + 5 (jak „ten frame” w
 * angielskiej klasie) — oko od razu widzi „pełna dziesiątka i jeszcze 3”.
 * Odejmowanie: zabrane kropki są przekreślone — zwykle ostatnie `crossed`, a
 * gdy zabieramy pełne dziesiątki (27 − 10), całe pierwsze rzędy: jedności
 * zostają nietknięte, dokładnie jak mówi wyjaśnienie. Dodawanie: `added`
 * dołożonych kropek w drugim kolorze, dalej w tych samych rzędach.
 *
 * Rozmiar z klas, nie z pikseli: na wąskim telefonie kropki są mniejsze (rząd
 * mieści się w karcie), od 640 px pełne. Przy ponad 30 kropkach (zakres do 50
 * i do 100) — mniejsze, żeby słupek dziesiątek nie zepchnął klawiatury.
 */
export function TenFrames({
  total,
  crossed = 0,
  added = 0,
  small = false,
}: {
  total: number;
  crossed?: number;
  added?: number;
  small?: boolean;
}) {
  const count = total + added;
  const rows = Math.ceil(count / 10);
  const dense = count > 30;
  const dot = small || dense ? "size-3 sm:size-4" : "size-[18px] sm:size-[26px]";
  const fiveGap = small || dense ? "gap-1" : "gap-1 sm:gap-1.5";
  const rowGap = small || dense ? "gap-2 px-2 py-1" : "gap-2 px-2 py-1.5 sm:gap-3 sm:px-3 sm:py-2";
  const wholeTens = crossed > 0 && crossed % 10 === 0;
  const left = total - crossed;
  const label =
    added > 0
      ? `${pl(total, "kropka", "kropki", "kropek")} i ${pl(added, "dołożona", "dołożone", "dołożonych")} — razem ${count}`
      : `${pl(total, "kropka", "kropki", "kropek")}, ${pl(crossed, "skreślona", "skreślone", "skreślonych")} — ${plForm(left, "zostaje", "zostają", "zostaje")} ${left}`;
  return (
    <div className={`flex flex-col items-center ${dense ? "gap-1" : "gap-2"}`} role="img" aria-label={label}>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className={`flex rounded-2xl bg-white/5 ${rowGap}`}>
          {[0, 5].map((half) => (
            <div key={half} className={`flex ${fiveGap}`}>
              {Array.from({ length: 5 }, (_, i) => {
                const n = row * 10 + half + i; // indeks kropki od 0
                if (n >= count) return <span key={i} className={dot} />;
                const isAdded = n >= total;
                const isCrossed = !isAdded && (wholeTens ? n < crossed : n >= total - crossed);
                return (
                  <span
                    key={i}
                    className={`relative inline-block rounded-full ${dot}`}
                    style={{ background: isAdded ? "#ffc93c" : isCrossed ? "rgba(255,255,255,0.18)" : "#21d4fd" }}
                  >
                    {isCrossed && (
                      <svg viewBox="0 0 10 10" className="absolute inset-0" aria-hidden>
                        <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" stroke="#ff9cc6" strokeWidth="1.6" strokeLinecap="round" />
                        <line x1="8.5" y1="1.5" x2="1.5" y2="8.5" stroke="#ff9cc6" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Obrazek z zaznaczeniem jak ołówkiem na kartce. Kółko i podkreślenie są
 * rysowane, a nie symbolizowane — dziecko ma zobaczyć, co ZROBIĆ ręką.
 */
export function MarkedPicture({
  emoji,
  mark,
  small = false,
}: {
  emoji: string;
  mark: MarkStyle;
  small?: boolean;
}) {
  const size = small ? 92 : 120;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={MARK_LABEL[mark]}>
      {mark === "colour" && <rect x="14" y="14" width="72" height="62" rx="14" fill="#ffc93c" opacity="0.85" />}
      <text x="50" y="47" textAnchor="middle" dominantBaseline="central" fontSize="44">
        {emoji}
      </text>
      {mark === "circle" && <ellipse cx="50" cy="46" rx="38" ry="34" fill="none" stroke="#e33d5a" strokeWidth="5" />}
      {mark === "underline" && <line x1="18" y1="86" x2="82" y2="86" stroke="#e33d5a" strokeWidth="6" strokeLinecap="round" />}
      {mark === "cross" && (
        <g stroke="#e33d5a" strokeWidth="7" strokeLinecap="round">
          <line x1="20" y1="18" x2="80" y2="78" />
          <line x1="80" y1="18" x2="20" y2="78" />
        </g>
      )}
      {mark === "tick" && (
        <polyline points="62,70 72,82 94,52" fill="none" stroke="#e33d5a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

const MARK_LABEL: Record<MarkStyle, string> = {
  tick: "zaznaczone ptaszkiem",
  circle: "zakreślone kółkiem",
  underline: "podkreślone",
  cross: "skreślone",
  colour: "pokolorowane",
};

/**
 * Tablica „rows lots of cols". Rzędy odstępują od siebie, bo cała idea to
 * zobaczyć GRUPY — 3 × 4 to trzy grupy po cztery, nie dwanaście kropek.
 */
export function DotArray({
  rows,
  cols,
  emoji,
  small = false,
}: {
  rows: number;
  cols: number;
  emoji?: string;
  small?: boolean;
}) {
  const size = small ? "text-base" : cols > 8 ? "text-lg" : "text-2xl";
  return (
    <div className="flex flex-col items-center gap-1.5" aria-label={`${pl(rows, "rząd", "rzędy", "rzędów")} po ${cols}`}>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex gap-1 rounded-full bg-white/5 px-2 py-0.5">
          {Array.from({ length: cols }, (_, col) => (
            <span key={col} className={`${size} leading-none`} aria-hidden>
              {emoji ?? "🔵"}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Tekst czytanki pod pytaniem. W angielskiej szkole na pytania odpowiada się
 * z tekstem przed oczami — umiejętność „zajrzyj i znajdź" jest częścią
 * rozumienia, a nie ściąganiem. Zwinięty na starcie tylko na telefonie.
 */
function PassagePeek({ title, sentences }: { title: string; sentences: string[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/20 text-left">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-bold text-paper/70"
      >
        <span>📖 {title}</span>
        <span>{open ? "zwiń ▴" : "pokaż tekst ▾"}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-1.5 px-4 pb-3">
          {sentences.map((sentence, index) => (
            <p key={index} className="flex items-start gap-2">
              <Speaker size="sm" onPlay={() => void playText(sentence)} ariaLabel={`Posłuchaj: ${sentence}`} />
              <span className="font-reading pt-1.5 text-lg leading-snug">{sentence}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
