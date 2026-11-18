"use client";

/**
 * Wybór zakresu liczb w tematach odejmowania i dodawania (ekran startu
 * tematu). Ustawienie urządzenia — lib/settings.ts (calcRange). Temat i jego
 * postęp zostają te same; zmienia się tylko, z jakich liczb losowane są
 * zadania (lib/akademia/curriculum/calc.ts).
 */

import { CALC_RANGE_OPTIONS, useSettings, writeSettings } from "@/lib/settings";

export function CalcRangePicker() {
  const { calcRange } = useSettings();
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-2 rounded-2xl bg-white/5 p-3">
      <p className="text-sm font-bold text-paper/70">Zakres liczb</p>
      <div role="group" aria-label="Zakres liczb" className="flex flex-wrap justify-center gap-2">
        {CALC_RANGE_OPTIONS.map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => writeSettings({ calcRange: range })}
            aria-pressed={calcRange === range}
            className={`min-h-12 min-w-20 rounded-full px-4 text-lg font-black transition active:translate-y-0.5 ${
              calcRange === range ? "bg-hero-gold text-night" : "bg-white/10 text-paper"
            }`}
          >
            do {range}
          </button>
        ))}
      </div>
      <p className="max-w-sm text-center text-xs text-paper/55">
        {calcRange === 20
          ? "Liczby do 20 — podstawowe odejmowanie przez dziesiątkę."
          : `Większość zadań z liczb do ${calcRange}, część z mniejszych — żeby to, co już umiesz, nie uciekło.`}
      </p>
    </div>
  );
}
