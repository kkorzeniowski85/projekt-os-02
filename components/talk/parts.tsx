"use client";

/**
 * Wspólne klocki Rozmowy z bohaterem (TalkRunner, RoleSwap): fale dźwięku,
 * dymek z kwestią i „Sam” — dziecko-rozmówca, które odpowiada bohaterowi we
 * wzorcowych dialogach (to samo imię pada w odpowiedzi „My name is Sam.”).
 */

import type { ReactNode } from "react";

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Imię dziecka-rozmówcy we wzorcowych dialogach. */
export const PARTNER_NAME = "Sam";

/** Fale dźwięku przy dymku — widać, kto właśnie mówi. */
export function SoundWaves() {
  return (
    <span className="ml-2 inline-flex h-4 items-end gap-0.5 align-middle" aria-hidden>
      {[0, 1, 2, 3].map((bar) => (
        <span
          key={bar}
          className="wave-bar h-full w-1 rounded-full bg-hero-gold"
          style={{ animationDelay: `${bar * 120}ms` }}
        />
      ))}
    </span>
  );
}

/** Sam — okrągła plakietka z buźką, tej samej wielkości co bohater obok. */
export function PartnerAvatar({ size = 64 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-hero-lime/25 ring-2 ring-hero-lime/60"
      style={{ width: size, height: size, fontSize: size * 0.55 }}
      role="img"
      aria-label={PARTNER_NAME}
    >
      🧒
    </span>
  );
}

/**
 * Dymek z kwestią: kto mówi (etykieta), zdanie po angielsku i — jeśli podane —
 * po polsku. Stuknięcie odtwarza kwestię jeszcze raz. `side` — po której
 * stronie stoi postać (bohater z lewej, rozmówca z prawej).
 */
export function SpeechBubble({
  avatar,
  side = "left",
  label,
  text,
  textPl,
  speaking,
  tone = "plain",
  onPlay,
}: {
  avatar: ReactNode;
  side?: "left" | "right";
  label: string;
  text: string;
  textPl?: string;
  speaking: boolean;
  /** `answer` — zielonkawy dymek odpowiedzi. */
  tone?: "plain" | "answer";
  onPlay: () => void;
}) {
  const idle = tone === "answer" ? "bg-hero-lime/10" : "bg-white/10";
  return (
    <div
      className={`flex w-full max-w-2xl items-center gap-3 text-left ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      <div className={`shrink-0 ${speaking ? "animate-talk" : ""}`}>{avatar}</div>
      <button
        type="button"
        onClick={onPlay}
        className={`flex-1 rounded-2xl px-4 py-3 text-left transition active:translate-y-0.5 ${
          speaking ? "bg-hero-gold/15 ring-2 ring-hero-gold/60" : idle
        }`}
        aria-label={`${label}: ${text} — stuknij, żeby posłuchać`}
      >
        <span className="block text-xs font-bold tracking-wide text-paper/60 uppercase">
          {label} 🔊{speaking && <SoundWaves />}
        </span>
        <span className="font-reading block text-2xl leading-snug sm:text-3xl">{text}</span>
        {textPl && <span className="block text-base text-hero-cyan">{textPl}</span>}
      </button>
    </div>
  );
}
