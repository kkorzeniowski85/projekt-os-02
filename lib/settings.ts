"use client";

/**
 * Ustawienia rodzica dla tego urządzenia — bez synchronizacji, bo dotyczą
 * tego, jak ćwiczy się TUTAJ (np. czy na tym tablecie robimy ćwiczenia
 * ruchowe), a nie postępu dziecka. Klucz z przedrostkiem `phonics.` jak reszta
 * danych Ligi (wspólna domena z innymi projektami; wersja testowa przemapuje
 * go na `beta.` sama).
 */

import { useSyncExternalStore } from "react";

const KEY = "phonics.settings.v1";
const CHANGE_EVENT = "phonics-settings-change";

/**
 * Tempo głosu w całej aplikacji (Dźwięki i Akademia): słowa, zdania, scenki,
 * książeczki, rymowanki, historie, liczby — wszystko, co mówi lektor. Nie
 * dotyczy głosek (czysty dźwięk litery, także nagrany przez rodzica) ani
 * dźwięków nagród. 1 = tak, jak nagrano; mniej = wolniej, więcej = szybciej
 * (prośba rodzica 2026-11-22, przy przejściu na żywsze nagrania ElevenLabs).
 * Zastąpiło trzy tempa historii z Czytania (2026-09-30) — dawne „Wolniej” i
 * „Najwolniej” przechodzą na 0,85 i 0,7.
 */
export const VOICE_SPEEDS = [0.7, 0.85, 1, 1.15, 1.3] as const;
export type VoiceSpeed = (typeof VOICE_SPEEDS)[number];

export function voiceSpeedLabel(speed: number): string {
  return `${String(speed).replace(".", ",")}×`;
}

const LEGACY_STORY_SPEEDS: Record<string, VoiceSpeed> = { normal: 1, slower: 0.85, slowest: 0.7 };

/**
 * Zakres liczb w odejmowaniu i dodawaniu (Akademia → Matematyka). Ustawienie
 * urządzenia, jak tempo głosu; tematy i postęp zostają te same.
 */
export const CALC_RANGE_OPTIONS = [20, 30, 50, 100] as const;
export type CalcRangeSetting = (typeof CALC_RANGE_OPTIONS)[number];

export type Settings = {
  /** Zakres liczb w tematach odejmowania i dodawania (Akademia). */
  calcRange: CalcRangeSetting;
  /** Tempo głosu lektora w całej aplikacji — patrz VOICE_SPEEDS. */
  voiceSpeed: VoiceSpeed;
  /** Bez „Pokaż ruchem!” i „Teraz ty rządzisz” w sesjach toru 2 — decyzja rodzica. */
  noMovement: boolean;
};

const DEFAULTS: Settings = { noMovement: false, voiceSpeed: 1, calcRange: 30 };

let cached: { raw: string | null; value: Settings } | null = null;

export function readSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return DEFAULTS;
  }
  // Ten sam obiekt dla tego samego zapisu — useSyncExternalStore porównuje
  // tożsamością i bez tego renderowałby w pętli.
  if (cached && cached.raw === raw) return cached.value;
  let value = DEFAULTS;
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<Settings> & { storySpeed?: string }) : {};
    value = {
      ...DEFAULTS,
      noMovement: parsed.noMovement === true,
      voiceSpeed: (VOICE_SPEEDS as readonly number[]).includes(parsed.voiceSpeed as number)
        ? (parsed.voiceSpeed as VoiceSpeed)
        : (LEGACY_STORY_SPEEDS[parsed.storySpeed ?? ""] ?? 1),
      calcRange: (CALC_RANGE_OPTIONS as readonly number[]).includes(parsed.calcRange as number)
        ? (parsed.calcRange as CalcRangeSetting)
        : 30,
    };
  } catch {
    // Uszkodzony zapis — domyślne.
  }
  cached = { raw, value };
  return value;
}

export function writeSettings(patch: Partial<Settings>): void {
  // Pełny, poprawny zapis — dawne pole storySpeed znika przy pierwszej zmianie.
  const next = { ...readSettings(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Brak miejsca / tryb prywatny — ustawienie nie przetrwa, ale nic się nie psuje.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Powiadamia o każdej zmianie ustawień (także z innej karty). Zwraca wypisanie. */
export function subscribeSettings(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Hook: bieżące ustawienia, odświeżane po zapisie (także z innej karty). */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribeSettings, readSettings, () => DEFAULTS);
}
