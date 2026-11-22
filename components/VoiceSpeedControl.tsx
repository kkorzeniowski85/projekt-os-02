"use client";

/**
 * Suwak tempa głosu — jeden dla całej aplikacji (lib/settings.ts →
 * voiceSpeed). Pięć kroków: dwa wolniejsze, „jak nagrano” i dwa szybsze.
 * Zmiana działa od razu, także na nagranie, które właśnie gra (lib/audio.ts,
 * lib/akademia/audio.ts). Głoski zostają bez zmian.
 */

import { useId } from "react";
import { VOICE_SPEEDS, voiceSpeedLabel, useSettings, writeSettings } from "@/lib/settings";

export function VoiceSpeedControl({ compact = false }: { compact?: boolean }) {
  const { voiceSpeed } = useSettings();
  const id = useId();
  const index = Math.max(0, VOICE_SPEEDS.indexOf(voiceSpeed));
  const describe =
    voiceSpeed === 1 ? "jak nagrano" : voiceSpeed < 1 ? "wolniej" : "szybciej";

  return (
    <div
      className={`flex w-full flex-col items-center gap-1 ${
        compact ? "max-w-sm" : "max-w-md rounded-2xl bg-white/5 p-3"
      }`}
    >
      <label htmlFor={id} className="text-sm font-bold text-paper/70">
        Tempo głosu: {voiceSpeedLabel(voiceSpeed)}{" "}
        <span className="font-normal text-paper/55">({describe})</span>
      </label>
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          aria-label="Wolniej"
          disabled={index === 0}
          onClick={() => writeSettings({ voiceSpeed: VOICE_SPEEDS[index - 1] })}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl transition active:translate-y-0.5 disabled:opacity-30"
        >
          <span aria-hidden>🐢</span>
        </button>
        <input
          id={id}
          type="range"
          min={0}
          max={VOICE_SPEEDS.length - 1}
          step={1}
          value={index}
          aria-valuetext={`${voiceSpeedLabel(voiceSpeed)}, ${describe}`}
          onChange={(event) =>
            writeSettings({ voiceSpeed: VOICE_SPEEDS[Number(event.target.value)] ?? 1 })
          }
          className="h-11 w-full cursor-pointer accent-hero-gold"
        />
        <button
          type="button"
          aria-label="Szybciej"
          disabled={index === VOICE_SPEEDS.length - 1}
          onClick={() => writeSettings({ voiceSpeed: VOICE_SPEEDS[index + 1] })}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl transition active:translate-y-0.5 disabled:opacity-30"
        >
          <span aria-hidden>🐇</span>
        </button>
      </div>
      <div aria-hidden className="flex w-full justify-between px-14 text-xs text-paper/45">
        {VOICE_SPEEDS.map((speed) => (
          <span key={speed} className={speed === voiceSpeed ? "font-bold text-paper" : undefined}>
            {voiceSpeedLabel(speed)}
          </span>
        ))}
      </div>
    </div>
  );
}
