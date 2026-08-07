"use client";

/**
 * Automatyczna synchronizacja postępu między urządzeniami.
 *
 * ZASADA DZIAŁANIA: wspólna "skrzynka" — jeden dokument JSON pod losowym,
 * niezgadywalnym adresem (jsonblob.com). Każde urządzenie po każdej zmianie
 * wysyła tam SCALONY stan (pobierz → scal → wyślij), a przy każdym otwarciu
 * i co kilka minut pobiera i scala u siebie. Scalanie to unia sesji po `id`
 * (lib/progress/merge.ts) — jest idempotentne, więc kolejność i powtórzenia
 * nie szkodzą, a stany zbiegają się same.
 *
 * ŹRÓDŁEM PRAWDY pozostaje urządzenie (localStorage). Skrzynka to tylko
 * transport: jej utrata (usługa może wygasić nieużywany dokument) nie gubi
 * żadnych danych — trzeba jedynie raz kliknąć "utwórz nową" i sparować
 * urządzenia ponownie. Ten kompromis jest wpisany w projekt świadomie:
 * zero kont, zero konfiguracji chmury, zero udziału rodzica w codziennym
 * działaniu.
 *
 * PAROWANIE: link z kodem w części #sync=... — kliknięcie linku na drugim
 * urządzeniu podłącza je na stałe. Kod nie występuje nigdzie w publicznym
 * kodzie aplikacji; zna go tylko rodzina.
 *
 * PRYWATNOŚĆ: w skrzynce lądują statystyki nauki i imię wpisane w ustawieniach.
 * Adres jest losowy (nie do zgadnięcia), ale to usługa zewnętrzna — nie
 * trzymamy tam niczego wrażliwego.
 */

import { mergeProgress, parseProgressFile } from "./merge";
import type { ProgressState } from "./types";

const API = "https://jsonblob.com/api/jsonBlob";
const STORAGE_KEY = "phonics.sync.v1";

export type SyncStatus = {
  enabled: boolean;
  mailboxId: string | null;
  lastOkTs: number | null;
  lastError: "siec" | "skrzynka-wygasla" | null;
  syncing: boolean;
};

let status: SyncStatus = {
  enabled: false,
  mailboxId: null,
  lastOkTs: null,
  lastError: null,
  syncing: false,
};

const listeners = new Set<(s: SyncStatus) => void>();

function emit(zmiany: Partial<SyncStatus>) {
  status = { ...status, ...zmiany };
  listeners.forEach((cb) => cb(status));
}

export function subscribeSync(cb: (s: SyncStatus) => void): () => void {
  listeners.add(cb);
  cb(status);
  return () => listeners.delete(cb);
}

export function getSyncStatus(): SyncStatus {
  return status;
}

// --- kod rodziny -----------------------------------------------------------

export function loadSyncId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const id = (JSON.parse(raw) as { mailboxId?: string }).mailboxId ?? null;
    emit({ enabled: Boolean(id), mailboxId: id });
    return id;
  } catch {
    return null;
  }
}

function saveSyncId(id: string | null): void {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, JSON.stringify({ mailboxId: id }));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // brak localStorage — synchronizacja i tak nie ma sensu
  }
  emit({ enabled: Boolean(id), mailboxId: id, lastError: null });
}

export function disableSync(): void {
  saveSyncId(null);
}

/**
 * Przejęcie kodu z linku parowania (#sync=...). Wywoływane raz przy starcie.
 * Zwraca true, gdy urządzenie właśnie zostało sparowane.
 */
export function adoptFromHash(): boolean {
  if (typeof window === "undefined") return false;
  const match = window.location.hash.match(/[#&]sync=([a-zA-Z0-9-]+)/);
  if (!match) return false;
  saveSyncId(match[1]);
  // Sprzątamy adres, żeby kod nie wisiał w pasku i historii.
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return true;
}

export function pairingLink(): string | null {
  if (!status.mailboxId || typeof window === "undefined") return null;
  return `${window.location.origin}${window.location.pathname.replace(/rodzic\/?$/, "")}#sync=${status.mailboxId}`;
}

// --- rozmowa ze skrzynką ---------------------------------------------------

async function timeoutFetch(url: string, init: RequestInit = {}, ms = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

/** Założenie nowej skrzynki z bieżącym stanem. Zwraca kod albo null. */
export async function createMailbox(state: ProgressState): Promise<string | null> {
  try {
    const response = await timeoutFetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!response.ok) return null;
    const location = response.headers.get("Location") ?? "";
    const id = location.split("/").filter(Boolean).pop() ?? null;
    if (id) {
      saveSyncId(id);
      emit({ lastOkTs: Date.now() });
    }
    return id;
  } catch {
    emit({ lastError: "siec" });
    return null;
  }
}

type Zdalne = { state: ProgressState | null; etag: string | null; wygasla: boolean };

async function pobierz(id: string): Promise<Zdalne | null> {
  try {
    const response = await timeoutFetch(`${API}/${id}`);
    if (response.status === 404) return { state: null, etag: null, wygasla: true };
    if (!response.ok) return null;
    const text = await response.text();
    return {
      state: parseProgressFile(text),
      etag: response.headers.get("ETag"),
      wygasla: false,
    };
  } catch {
    return null;
  }
}

async function wyslij(id: string, state: ProgressState, etag: string | null): Promise<boolean> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // Znacznik wersji chroni przed nadpisaniem cudzej równoczesnej zmiany —
    // przy konflikcie serwer odmówi i spróbujemy jeszcze raz od pobrania.
    if (etag) headers["If-Match"] = etag;
    const response = await timeoutFetch(`${API}/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(state),
    });
    if (response.status === 412) return false;
    return response.ok;
  } catch {
    return false;
  }
}

// --- silnik ----------------------------------------------------------------

/**
 * Pełny obieg: pobierz → scal → (jeśli mamy coś nowego) wyślij.
 * `applyMerged` oddaje scalony stan do magazynu aplikacji — wołający decyduje,
 * czy faktycznie coś się zmieniło i czy zapisać.
 */
export async function syncNow(
  localState: ProgressState,
  applyMerged: (merged: ProgressState) => void,
): Promise<void> {
  const id = status.mailboxId ?? loadSyncId();
  if (!id || status.syncing) return;
  emit({ syncing: true });

  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const zdalne = await pobierz(id);
      if (!zdalne) {
        emit({ lastError: "siec" });
        return;
      }
      if (zdalne.wygasla) {
        emit({ lastError: "skrzynka-wygasla" });
        return;
      }

      const merged = zdalne.state ? mergeProgress(localState, zdalne.state) : localState;
      applyMerged(merged);

      // Wysyłamy tylko, gdy skrzynka nie ma czegoś, co mamy my.
      const zdalnaSesje = new Set((zdalne.state?.sessions ?? []).map((s) => s.id));
      const mamyWiecej =
        merged.sessions.some((s) => !zdalnaSesje.has(s.id)) ||
        merged.attempts.length > (zdalne.state?.attempts.length ?? 0) ||
        merged.childName !== zdalne.state?.childName;

      if (!mamyWiecej) {
        emit({ lastOkTs: Date.now(), lastError: null });
        return;
      }
      if (await wyslij(id, merged, zdalne.etag)) {
        emit({ lastOkTs: Date.now(), lastError: null });
        return;
      }
      // 412 = ktoś wysłał równocześnie — pobieramy jeszcze raz i ponawiamy.
    }
    emit({ lastError: "siec" });
  } finally {
    emit({ syncing: false });
  }
}
