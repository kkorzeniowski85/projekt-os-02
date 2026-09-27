"use client";

/**
 * „Trwa ćwiczenie" — wspólna flaga dla całej karty.
 *
 * Dwie rzeczy zależą od niej:
 *  - service worker po aktualizacji przeładowuje stronę, gdy aplikacja zejdzie
 *    z ekranu (ServiceWorkerRegistrar). W trakcie sesji albo próbnego testu to
 *    by urwało pracę dziecka (próby siedzą w pamięci do końca sesji), więc
 *    przeładowanie czeka, aż ekrany ćwiczeń skończą;
 *  - ekran tabletu nie gaśnie w trakcie ćwiczenia (Screen Wake Lock). Dziecko
 *    słucha nagrania albo myśli nad odpowiedzią i nie dotyka ekranu — po
 *    30 s tablet by go wygasił, a odblokowywanie w środku zadania rozprasza.
 *    Prośba rodzica (2026-09-27). Blokada trzyma się tylko podczas ćwiczenia
 *    i tylko gdy strona jest widoczna; poza tym obowiązuje zwykłe wygaszanie.
 * Jedna flaga dla obu działów: silniki Dźwięków (components/session) i
 * Akademii (components/akademia/session, próbny test) zgłaszają się tutaj.
 */

import { useEffect } from "react";

let active = 0;

// --- Wake Lock -----------------------------------------------------------------

type WakeLockSentinel = { released: boolean; release: () => Promise<void> };
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> } };

let sentinel: WakeLockSentinel | null = null;
let requesting = false;

async function acquireWakeLock(): Promise<void> {
  const wakeLock = (navigator as WakeLockNavigator).wakeLock;
  if (!wakeLock || requesting || (sentinel && !sentinel.released)) return;
  if (document.visibilityState !== "visible") return;
  requesting = true;
  try {
    sentinel = await wakeLock.request("screen");
    // Zwolniona przez system (np. karta w tle) — w tle nic nie robimy, a po
    // powrocie na ekran visibilitychange poprosi o nową.
    if (!isBusy()) await sentinel.release();
  } catch {
    // Brak zgody albo tryb oszczędzania energii — ekran po prostu gaśnie jak zwykle.
  } finally {
    requesting = false;
  }
}

function releaseWakeLock(): void {
  const current = sentinel;
  sentinel = null;
  if (current && !current.released) void current.release().catch(() => undefined);
}

if (typeof document !== "undefined") {
  // System zwalnia blokadę, gdy strona schodzi z ekranu; po powrocie trzeba
  // poprosić o nią jeszcze raz — o ile ćwiczenie dalej trwa.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && isBusy()) void acquireWakeLock();
  });
}

// --- Flaga ---------------------------------------------------------------------

/** Zgłasza ćwiczenie w toku; zwraca funkcję, która je kończy (bezpieczna do wielokrotnego wywołania). */
export function markBusy(): () => void {
  active += 1;
  if (active === 1) void acquireWakeLock();
  let done = false;
  return () => {
    if (done) return;
    done = true;
    active -= 1;
    if (active === 0) releaseWakeLock();
  };
}

export function isBusy(): boolean {
  return active > 0;
}

/** Hook: ekran jest „w toku", dopóki `busy` jest true. */
export function useBusy(busy: boolean): void {
  useEffect(() => (busy ? markBusy() : undefined), [busy]);
}
