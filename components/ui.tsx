"use client";

import { useState, type ReactNode } from "react";
import { playPhoneme, playWord } from "@/lib/audio";

/** Duży przycisk — minimum 64 px wysokości, bo celuje w niego palec 7-latka. */
export function BigButton({
  children,
  onClick,
  tone = "primary",
  disabled = false,
  full = false,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "primary" | "yes" | "no" | "quiet";
  disabled?: boolean;
  full?: boolean;
}) {
  const tones: Record<string, string> = {
    primary: "bg-hero-blue text-white shadow-[0_6px_0_#1c47b3]",
    yes: "bg-hero-lime text-night shadow-[0_6px_0_#4fae42]",
    no: "bg-hero-pink text-white shadow-[0_6px_0_#c93c76]",
    quiet: "bg-white/10 text-paper shadow-[0_4px_0_rgba(0,0,0,0.25)]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-16 rounded-blob px-7 py-4 text-2xl font-bold transition active:translate-y-1 active:shadow-none disabled:opacity-40 ${tones[tone]} ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-blob border border-white/10 bg-white/5 p-5 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Przycisk "posłuchaj" dla całego słowa. */
export function WordSpeaker({
  word,
  label = "Posłuchaj",
  size = "md",
}: {
  word: string;
  label?: string;
  size?: "md" | "lg";
}) {
  return (
    <button
      type="button"
      onClick={() => void playWord(word)}
      aria-label={`${label}: ${word}`}
      className={`flex items-center gap-3 rounded-blob bg-hero-gold font-bold text-night shadow-[0_6px_0_#c99a1f] transition active:translate-y-1 active:shadow-none ${
        size === "lg" ? "px-8 py-5 text-3xl" : "px-5 py-3 text-xl"
      }`}
    >
      <span aria-hidden>🔊</span>
      {label}
    </button>
  );
}

/**
 * Przycisk czystej głoski. Gdy nagrania jeszcze nie ma, odtwarza przykładowe
 * słowo i mówi o tym wprost — zamiast udawać, że syntezator poprawnie wymawia
 * samo "sh".
 */
export function PhonemeSpeaker({
  soundId,
  grapheme,
  exampleWord,
}: {
  soundId: string;
  grapheme: string;
  exampleWord: string;
}) {
  const [approximate, setApproximate] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={async () => {
          const result = await playPhoneme(soundId, exampleWord);
          setApproximate(result.approximate);
        }}
        aria-label={`Posłuchaj dźwięku ${grapheme}`}
        className="animate-pulse-ring flex h-40 w-40 flex-col items-center justify-center rounded-full bg-hero-gold text-night shadow-[0_8px_0_#c99a1f] transition active:translate-y-1 active:shadow-none"
      >
        <span className="text-6xl font-black">{grapheme}</span>
        <span className="text-lg font-bold">🔊 posłuchaj</span>
      </button>
      {approximate && (
        <p className="max-w-xs text-center text-xs text-hero-gold/80">
          Brak nagrania czystej głoski — odtworzono słowo „{exampleWord}”. Wymowę głoski
          pokazuje rodzic (patrz wskazówka).
        </p>
      )}
    </div>
  );
}

/** Pasek postępu sesji — kropki, nie procenty. */
export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label={`Krok ${current + 1} z ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-2.5 w-2.5 rounded-full ${
            index < current ? "bg-hero-lime" : index === current ? "bg-hero-gold" : "bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

/** Ramka ze wskazówką dla rodzica — widoczna tylko w trybie wspólnym. */
export function ParentTip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-hero-cyan/40 bg-hero-cyan/10 p-4 text-sm leading-relaxed text-paper/90">
      <p className="mb-1 font-bold text-hero-cyan">Dla rodzica</p>
      {children}
    </div>
  );
}
