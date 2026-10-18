"use client";

/**
 * 🕒 Zegar po angielsku — ściąga z wielkim zegarem wskazówkowym (prawie cały
 * ekran), który dziecko przestawia palcem: długa czerwona = minuty, krótka =
 * godziny. Prośby rodzica (2026-10-18):
 *  - wskazówka idzie PŁYNNIE za palcem, a wartość jest co do minuty (po
 *    puszczeniu wskazówka dosuwa się do najbliższej kreski);
 *  - opisy zmieniają się na żywo w trakcie przesuwania;
 *  - wymowa po kliknięciu — nagranie dla każdej godziny co do minuty
 *    (lib/akademia/curriculum/clockGuide.ts, clockGuidePhrases).
 * Pod / obok zegara: „Say it” i „Write it” po angielsku (słowami i cyframi:
 * 3:15, 3:15 pm, 15:15), polski tylko jako podpowiedź. Bez punktów.
 */

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ClockFace } from "@/components/akademia/ClockFace";
import { Card, PageHeader, ParentTip } from "@/components/akademia/ui";
import { playText, unlockAudio } from "@/lib/akademia/audio";
import {
  CLOCK_EXAMPLES,
  DAY_MINUTES,
  dayMinuteOf,
  partOfDay,
  ruleTime,
  sayTime,
  sayTimePl,
  timeOf,
  writeTime,
} from "@/lib/akademia/curriculum/clockGuide";

/** Kąt punktu względem środka tarczy: 0° = 12, zgodnie z ruchem wskazówek. */
function angleOf(event: ReactPointerEvent<HTMLDivElement>, box: DOMRect): { angle: number; radius: number } {
  const x = event.clientX - (box.left + box.width / 2);
  const y = event.clientY - (box.top + box.height / 2);
  const angle = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
  // Promień w jednostkach tarczy (viewBox 200 × 200).
  const radius = (Math.hypot(x, y) / box.width) * 200;
  return { angle, radius };
}

const angleGap = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
/** Ten sam kąt, ale najbliższy poprzedniemu (bez obrotu o 360° przy przejściu przez 12). */
const nearest = (previous: number, target: number) => target + 360 * Math.round((previous - target) / 360);

type Live = { hand: "minute" | "hour"; angle: number } | null;

function DraggableClock({ dayMinute, onChange }: { dayMinute: number; onChange: (next: number) => void }) {
  const [live, setLive] = useState<Live>(null);
  /** Wskazówka pod palcem — w refie, żeby ruch tuż po dotknięciu nie przepadł przed renderem. */
  const handRef = useRef<"minute" | "hour" | null>(null);
  const valueRef = useRef(dayMinute);
  valueRef.current = dayMinute;
  const shown = useRef<{ hour: number; minute: number } | null>(null);

  // Kąty do narysowania: w trakcie przeciągania wskazówka pod palcem stoi
  // DOKŁADNIE pod palcem (płynnie), druga wynika z niej; bez palca — z wartości.
  const { hour12, minute } = timeOf(dayMinute);
  let minuteAngle = minute * 6;
  let hourAngle = ((hour12 % 12) + minute / 60) * 30;
  if (live?.hand === "minute") {
    const exact = live.angle / 6; // minuta z ułamkiem pod palcem
    let offset = exact - minute;
    if (offset > 30) offset -= 60;
    if (offset < -30) offset += 60;
    const continuous = (((dayMinute + offset) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
    minuteAngle = live.angle;
    hourAngle = ((continuous / 60) % 12) * 30;
  } else if (live?.hand === "hour") {
    hourAngle = live.angle;
  }
  const previous = shown.current ?? { hour: hourAngle, minute: minuteAngle };
  const drawn = { hour: nearest(previous.hour, hourAngle), minute: nearest(previous.minute, minuteAngle) };
  shown.current = drawn;

  const move = (event: ReactPointerEvent<HTMLDivElement>, hand: "minute" | "hour") => {
    const { angle } = angleOf(event, event.currentTarget.getBoundingClientRect());
    setLive({ hand, angle });
    const current = timeOf(valueRef.current);
    if (hand === "minute") {
      // Wartość = najbliższa kreska minutowa. Przejście przez 12 zmienia godzinę
      // (różnica po krótszej stronie tarczy), jak w prawdziwym zegarze.
      const target = Math.round(angle / 6) % 60;
      let delta = target - current.minute;
      if (delta > 30) delta -= 60;
      if (delta <= -30) delta += 60;
      if (delta !== 0) onChange(valueRef.current + delta);
    } else {
      // Krótka wskazówka stoi między liczbami (o 7:50 tuż przed 8) — odejmujemy
      // przesunięcie od minut, żeby szła za palcem bez przeskoku.
      const target = ((Math.round(angle / 30 - current.minute / 60) % 12) + 12) % 12;
      let delta = target - (current.hour12 % 12);
      if (delta > 6) delta -= 12;
      if (delta <= -6) delta += 12;
      if (delta !== 0) onChange(valueRef.current + delta * 60);
    }
  };

  return (
    <div
      className="relative shrink-0 touch-none select-none"
      style={{ width: "min(92vw, 78vh, 760px)", aspectRatio: "1" }}
      onPointerDown={(event) => {
        unlockAudio();
        const { angle, radius } = angleOf(event, event.currentTarget.getBoundingClientRect());
        // Krótka wskazówka, gdy palec jest blisko środka i przy niej; inaczej długa.
        const hand =
          radius < 62 && angleGap(angle, ((hour12 % 12) + minute / 60) * 30) < angleGap(angle, minute * 6)
            ? "hour"
            : "minute";
        // Przechwycenie: palec może zjechać poza tarczę, a wskazówka dalej idzie
        // za nim. Bywa odrzucane (stare przeglądarki) — wtedy działa bez niego.
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // bez przechwycenia
        }
        handRef.current = hand;
        move(event, hand);
      }}
      onPointerMove={(event) => {
        if (handRef.current) move(event, handRef.current);
      }}
      onPointerUp={() => {
        handRef.current = null;
        setLive(null);
      }}
      onPointerCancel={() => {
        handRef.current = null;
        setLive(null);
      }}
      role="img"
      aria-label={`Zegar pokazuje ${hour12}:${String(minute).padStart(2, "0")} — przeciągnij wskazówkę palcem`}
    >
      <div className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full">
        <ClockFace
          hour={hour12}
          minute={minute}
          size={760}
          hourAngle={drawn.hour}
          minuteAngle={drawn.minute}
          // Pod palcem bez opóźnienia; po puszczeniu krótki dosuw do kreski.
          animate={live === null}
          highlight={live !== null}
        />
      </div>
    </div>
  );
}

function SayButton({ text, big = false }: { text: string; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => {
        unlockAudio();
        void playText(text);
      }}
      className={`flex w-full max-w-full items-center gap-3 rounded-blob bg-hero-gold text-left font-bold text-night shadow-[0_6px_0_#c99a1f] transition active:translate-y-1 active:shadow-none ${
        big ? "min-h-16 px-6 py-4 text-3xl" : "min-h-11 px-4 py-2 text-lg"
      }`}
    >
      <span aria-hidden>🔊</span>
      <span className="font-reading">{text}</span>
    </button>
  );
}

function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  const btn = "flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl font-black active:translate-y-0.5";
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onMinus} className={btn} aria-label={`${label} mniej`}>
        −
      </button>
      <span className="min-w-16 text-center text-xs text-paper/70">{label}</span>
      <button type="button" onClick={onPlus} className={btn} aria-label={`${label} więcej`}>
        +
      </button>
    </div>
  );
}

export default function ClockGuidePage() {
  const [dayMinute, setDayMinute] = useState(dayMinuteOf(3, 30, true));
  const [sentence, setSentence] = useState<{ en: string; pl?: string } | null>(null);
  const { hour12, minute, pm } = timeOf(dayMinute);
  const said = sayTime(hour12, minute);
  const written = writeTime(dayMinute);
  const day = partOfDay(dayMinute);

  // Własne ustawienie zegara kasuje zdanie z przykładu „z życia”.
  const set = (next: number) => {
    setDayMinute(((next % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES);
    setSentence(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Zegar po angielsku" subtitle="🕒 Matematyka · jak powiedzieć i jak napisać godzinę" back="/matematyka/" />

      <Card className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col items-center gap-3">
          <DraggableClock dayMinute={dayMinute} onChange={set} />
          <p className="max-w-md text-center text-sm text-paper/60">
            Przeciągnij palcem wskazówkę: <span className="font-bold text-hero-pink">długa czerwona</span> to minuty,{" "}
            <span className="font-bold">krótka</span> to godziny.
          </p>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
            <Stepper label="godzina" onMinus={() => set(dayMinute - 60)} onPlus={() => set(dayMinute + 60)} />
            <Stepper label="5 minut" onMinus={() => set(dayMinute - 5)} onPlus={() => set(dayMinute + 5)} />
            <Stepper label="minuta" onMinus={() => set(dayMinute - 1)} onPlus={() => set(dayMinute + 1)} />
          </div>
          <div className="flex gap-2" role="group" aria-label="Pora dnia">
            {[
              { label: "☀️ am — rano", value: false },
              { label: "🌙 pm — po południu", value: true },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => set(dayMinuteOf(hour12, minute, option.value))}
                aria-pressed={pm === option.value}
                className={`min-h-11 rounded-full px-4 text-sm font-bold ${
                  pm === option.value ? "bg-hero-cyan text-night" : "bg-white/10 text-paper"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Opisy zmieniają się na żywo przy przesuwaniu wskazówek; stałe
            wysokości bloków, żeby układ nie skakał przy dłuższych zwrotach. */}
        <div className="flex w-full min-w-0 flex-col gap-5 lg:max-w-md">
          <section className="flex flex-col gap-2" aria-live="polite">
            <h2 className="text-lg font-black">
              🗣️ Say it <span className="text-sm font-normal text-paper/50">— jak powiedzieć (stuknij)</span>
            </h2>
            <p className="text-sm text-paper/60">What&apos;s the time?</p>
            <div className="min-h-[5.5rem]">
              <SayButton text={said} big />
            </div>
            <p className="font-reading min-h-[3.5rem] text-lg">
              It&apos;s {said}
              {day === "midday" || day === "midnight" ? ` — ${day}` : ` ${day}`}.
            </p>
            <p className="min-h-[2.5rem] text-sm text-hero-gold">{ruleTime(hour12, minute)}</p>
            {sentence && (
              <div className="flex flex-col gap-1 rounded-2xl bg-white/5 p-3">
                <SayButton text={sentence.en} />
                {sentence.pl && <p className="text-sm text-hero-cyan">{sentence.pl}</p>}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-black">
              ✍️ Write it <span className="text-sm font-normal text-paper/50">— jak napisać</span>
            </h2>
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="font-reading min-h-[2rem] text-2xl font-bold">{said}</p>
              <p className="text-xs text-paper/50">in words — słowami, jak w zeszycie</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: written.short, note: "z tarczy" },
                { value: written.twelve, note: "12-hour" },
                { value: written.twentyFour, note: "24-hour" },
              ].map((form) => (
                <div key={form.note} className="min-w-fit flex-1 rounded-2xl bg-white/5 p-3">
                  <p className="font-reading whitespace-nowrap text-2xl font-black tabular-nums sm:text-3xl">{form.value}</p>
                  <p className="text-xs text-paper/50">{form.note}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-paper/50">
              12-hour (am / pm) — na co dzień w Anglii · 24-hour — rozkład jazdy (Year 4)
            </p>
          </section>

          <p className="text-sm text-paper/60">
            🇵🇱 po polsku: <span className="text-paper/85">{sayTimePl(hour12, minute)}</span>
          </p>
        </div>
      </Card>

      {CLOCK_EXAMPLES.map((group) => (
        <Card key={group.title} className="flex flex-col gap-3">
          <h2 className="text-lg font-black">{group.title}</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {group.items.map((item) => {
              const time = timeOf(item.dayMinute);
              const label = item.en ?? sayTime(time.hour12, time.minute);
              const active = item.dayMinute === dayMinute && (!item.en || sentence?.en === item.en);
              return (
                <button
                  key={`${item.dayMinute}-${label}`}
                  type="button"
                  onClick={() => {
                    unlockAudio();
                    setDayMinute(item.dayMinute);
                    setSentence(item.en ? { en: item.en, pl: item.pl } : null);
                    void playText(label);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  aria-pressed={active}
                  className={`flex flex-col items-start gap-0.5 rounded-2xl p-3 text-left transition active:translate-y-0.5 ${
                    active ? "bg-hero-gold/20 ring-2 ring-hero-gold" : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="font-reading text-lg font-bold">🕒 {label}</span>
                  <span className="text-xs text-hero-cyan tabular-nums">{writeTime(item.dayMinute).twelve}</span>
                </button>
              );
            })}
          </div>
        </Card>
      ))}

      <ParentTip title="Jak ćwiczyć w domu (dla rodzica)">
        <p>
          Bawcie się na zmianę: Ty mówisz godzinę po angielsku („quarter to four”), dziecko ustawia wskazówki — i
          odwrotnie: dziecko ustawia, a Ty mówisz. Najczęstsza pułapka: „half past three” to 3:30, a polskie ucho
          słyszy „wpół do czwartej”. Wspominajcie godziny przy okazji: „It&apos;s half past seven — time for
          breakfast!”.
        </p>
      </ParentTip>
    </div>
  );
}
