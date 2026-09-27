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

export type Settings = {
  /** Bez „Pokaż ruchem!” i „Teraz ty rządzisz” w sesjach toru 2 — decyzja rodzica. */
  noMovement: boolean;
};

const DEFAULTS: Settings = { noMovement: false };

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
    const parsed = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
    value = { ...DEFAULTS, noMovement: parsed.noMovement === true };
  } catch {
    // Uszkodzony zapis — domyślne.
  }
  cached = { raw, value };
  return value;
}

export function writeSettings(patch: Partial<Settings>): void {
  const next = { ...readSettings(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Brak miejsca / tryb prywatny — ustawienie nie przetrwa, ale nic się nie psuje.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
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
  return useSyncExternalStore(subscribe, readSettings, () => DEFAULTS);
}
