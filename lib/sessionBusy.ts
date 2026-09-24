"use client";

/**
 * „Trwa ćwiczenie" — wspólna flaga dla całej karty.
 *
 * Service worker po aktualizacji przeładowuje stronę, gdy aplikacja zejdzie z
 * ekranu (ServiceWorkerRegistrar). W trakcie sesji albo próbnego testu to by
 * urwało pracę dziecka (próby siedzą w pamięci do końca sesji), więc ekrany
 * ćwiczeń zgłaszają tu, że są w toku, a przeładowanie czeka, aż skończą.
 * Jedna flaga dla obu działów: silniki Dźwięków (components/session) i
 * Akademii (components/akademia/session, próbny test) zgłaszają się tutaj.
 */

import { useEffect } from "react";

let active = 0;

/** Zgłasza ćwiczenie w toku; zwraca funkcję, która je kończy (bezpieczna do wielokrotnego wywołania). */
export function markBusy(): () => void {
  active += 1;
  let done = false;
  return () => {
    if (done) return;
    done = true;
    active -= 1;
  };
}

export function isBusy(): boolean {
  return active > 0;
}

/** Hook: ekran jest „w toku", dopóki `busy` jest true. */
export function useBusy(busy: boolean): void {
  useEffect(() => (busy ? markBusy() : undefined), [busy]);
}
