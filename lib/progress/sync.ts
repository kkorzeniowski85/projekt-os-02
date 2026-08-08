"use client";

/**
 * Automatyczna synchronizacja postępu między urządzeniami.
 *
 * ZASADA DZIAŁANIA: wspólna "skrzynka" — jeden dokument JSON pod losowym,
 * niezgadywalnym adresem. Każde urządzenie po zmianie wysyła tam SCALONY stan
 * (pobierz → scal → wyślij), a przy każdym otwarciu i co kilka minut pobiera
 * i scala u siebie. Scalanie to unia sesji po `id` (lib/progress/merge.ts) —
 * jest idempotentne, więc kolejność i powtórzenia nie szkodzą, a stany
 * zbiegają się same.
 *
 * ADRES SKRZYNKI WYMYŚLAMY SAMI — to najważniejsza decyzja w tym pliku i
 * wynik bolesnej lekcji z poprzedniej wersji, która kazała usłudze utworzyć
 * skrzynkę i oddać jej adres w nagłówku odpowiedzi. Tamto podejście miało trzy
 * wady, których tu już nie ma:
 *
 *  1. Włączenie synchronizacji było zapytaniem sieciowym, więc mogło się nie
 *     udać — a wtedy rodzic zostawał z komunikatem o błędzie i bez linku.
 *     Teraz włączenie to wylosowanie kodu lokalnie: nie ma czego zepsuć.
 *  2. Adres przychodził w nagłówku `Location`, który potrafią wyciąć antywirusy
 *     i firmowe proxy podsłuchujące HTTPS. Skrzynka powstawała, ale aplikacja
 *     nigdy nie poznawała jej adresu.
 *  3. Skasowanie skrzynki po stronie usługi (poprzednia usługa robiła to po
 *     24 godzinach!) na zawsze unieważniało adres i wymuszało parowanie od
 *     nowa. Teraz adres jest nasz: kolejny zapis po prostu odtwarza skrzynkę
 *     w tym samym miejscu, a urządzenia dalej się rozumieją.
 *
 * ŹRÓDŁEM PRAWDY pozostaje urządzenie (localStorage). Skrzynka to wyłącznie
 * transport — jej utrata nie gubi ani jednej sesji.
 *
 * PAROWANIE: link z kodem w części #sync=... — kliknięcie go na drugim
 * urządzeniu podłącza je na stałe.
 *
 * PRYWATNOŚĆ: w skrzynce lądują statystyki nauki i imię wpisane w ustawieniach.
 * Adres jest losowy (120 bitów), ale to usługa zewnętrzna i kto zna adres, ten
 * czyta i pisze — więc nie trzymamy tam niczego wrażliwego.
 */

import { mergeProgress, parseProgressFile } from "./merge";
import type { ProgressState } from "./types";

const ENDPOINT = "https://textdb.dev/api/data";
const KEY_PREFIX = "liga-dzwiekow-";
const STORAGE_KEY = "phonics.sync.v2";
/** Klucz poprzedniej wersji (inna usługa) — tamte kody są bezużyteczne. */
const STORAGE_KEY_STARY = "phonics.sync.v1";
/** Usługa odrzuca ładunki powyżej ~1 MB; zostawiamy zapas na koperty. */
const LIMIT_BAJTOW = 800_000;

export type SyncError = "brak-sieci" | "usluga-odmowila" | "za-duzo-danych";

export type SyncStatus = {
  enabled: boolean;
  code: string | null;
  lastOkTs: number | null;
  lastError: SyncError | null;
  /** Szczegół techniczny do panelu rodzica — bez niego diagnoza to zgadywanie. */
  lastErrorDetail: string | null;
  syncing: boolean;
};

let status: SyncStatus = {
  enabled: false,
  code: null,
  lastOkTs: null,
  lastError: null,
  lastErrorDetail: null,
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

/**
 * 24 znaki z 32-elementowego alfabetu = 120 bitów losowości. Alfabet jest
 * potęgą dwójki (maska &31), więc znaki są równie prawdopodobne — bez tego
 * reszta z dzielenia faworyzowałaby początek alfabetu. Nie ma "l", "o", "0"
 * ani "1", bo kod bywa przepisywany ręcznie z ekranu na ekran.
 */
const ALFABET = "abcdefghijkmnpqrstuvwxyz23456789";

function newCode(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABET[b & 31]).join("");
}

export function loadSyncCode(): string | null {
  try {
    // Kody poprzedniej usługi nie działają w tej — sprzątamy, żeby nie udawały
    // działającej synchronizacji.
    localStorage.removeItem(STORAGE_KEY_STARY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const code = (JSON.parse(raw) as { code?: string }).code ?? null;
    emit({ enabled: Boolean(code), code });
    return code;
  } catch {
    return null;
  }
}

function saveSyncCode(code: string | null): void {
  try {
    if (code) localStorage.setItem(STORAGE_KEY, JSON.stringify({ code }));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // brak localStorage — synchronizacja i tak nie ma sensu
  }
  emit({ enabled: Boolean(code), code, lastError: null, lastErrorDetail: null });
}

/**
 * Włączenie synchronizacji: losujemy kod i od razu go zapisujemy. Celowo NIE
 * czekamy na sieć — link parowania ma się pojawić natychmiast, a pierwsza
 * wysyłka pojedzie w tle (i tak powtarza się co kilka minut).
 */
export function enableSync(): string {
  const code = newCode();
  saveSyncCode(code);
  return code;
}

export function disableSync(): void {
  saveSyncCode(null);
}

/**
 * Przejęcie kodu z linku parowania (#sync=...). Wywoływane raz przy starcie.
 * Zwraca true, gdy urządzenie właśnie zostało sparowane.
 */
export function adoptFromHash(): boolean {
  if (typeof window === "undefined") return false;
  const match = window.location.hash.match(/[#&]sync=([a-zA-Z0-9-]{16,})/);
  if (!match) return false;
  saveSyncCode(match[1]);
  // Sprzątamy adres, żeby kod nie wisiał w pasku i historii.
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return true;
}

export function pairingLink(): string | null {
  if (!status.code || typeof window === "undefined") return null;
  const base = window.location.pathname.replace(/rodzic\/?$/, "");
  return `${window.location.origin}${base}#sync=${status.code}`;
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

function adres(code: string): string {
  return `${ENDPOINT}/${KEY_PREFIX}${code}`;
}

type Wynik<T> =
  | { ok: true; dane: T }
  | { ok: false; rodzaj: SyncError; opis: string };

/** `null` w danych = skrzynka jeszcze pusta (nikt nic nie wysłał). To nie błąd. */
async function pobierz(code: string): Promise<Wynik<ProgressState | null>> {
  let response: Response;
  try {
    response = await timeoutFetch(adres(code));
  } catch (blad) {
    return { ok: false, rodzaj: "brak-sieci", opis: opisWyjatku(blad) };
  }
  if (!response.ok) {
    return { ok: false, rodzaj: "usluga-odmowila", opis: `odczyt HTTP ${response.status}` };
  }

  const text = (await response.text()).trim();
  if (!text) return { ok: true, dane: null };

  // Usługa oddaje treść w kopercie {"value":"<nasz json>"}; gdyby kiedyś
  // zaczęła oddawać samą treść, druga gałąź to obsłuży.
  let surowy = text;
  try {
    const koperta = JSON.parse(text) as { value?: unknown };
    if (typeof koperta?.value === "string") surowy = koperta.value;
  } catch {
    // nie koperta — bierzemy tekst jak leci
  }
  if (!surowy.trim()) return { ok: true, dane: null };

  return { ok: true, dane: parseProgressFile(surowy) };
}

/**
 * Ładunek do wysyłki. Gdy stan urośnie ponad limit usługi, przycinamy DZIENNIK
 * PRÓB — to dane diagnostyczne, a nie postęp. Sesje (z których odtwarza się
 * cały stan) zostają nietknięte, więc przycięcie niczego nie kosztuje: każde
 * urządzenie ma swoje próby u siebie, a scalanie i tak bierze ich unię.
 */
function doWyslania(state: ProgressState): Wynik<string> {
  let tresc = JSON.stringify(state);
  if (tresc.length > LIMIT_BAJTOW) {
    tresc = JSON.stringify({ ...state, attempts: state.attempts.slice(-200) });
  }
  if (tresc.length > LIMIT_BAJTOW) {
    return {
      ok: false,
      rodzaj: "za-duzo-danych",
      opis: `${Math.round(tresc.length / 1024)} kB po przycięciu`,
    };
  }
  return { ok: true, dane: tresc };
}

async function wyslij(code: string, state: ProgressState): Promise<Wynik<true>> {
  const ladunek = doWyslania(state);
  if (!ladunek.ok) return ladunek;

  try {
    const response = await timeoutFetch(adres(code), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: ladunek.dane }),
    });
    if (!response.ok) {
      return { ok: false, rodzaj: "usluga-odmowila", opis: `zapis HTTP ${response.status}` };
    }
    return { ok: true, dane: true };
  } catch (blad) {
    return { ok: false, rodzaj: "brak-sieci", opis: opisWyjatku(blad) };
  }
}

function opisWyjatku(blad: unknown): string {
  if (blad instanceof DOMException && blad.name === "AbortError") return "przekroczony czas (15 s)";
  if (blad instanceof Error) return blad.message;
  return String(blad);
}

// --- silnik ----------------------------------------------------------------

/**
 * Czy mamy coś, czego skrzynka jeszcze nie widziała?
 *
 * Celowo patrzymy tylko na sesje i imię, a NIE na dziennik prób. Próby i tak
 * zawsze przyjeżdżają razem z sesją (zapisuje je ten sam commit), więc nic nam
 * nie umyka — a gdybyśmy je tu liczyli, przycięcie dziennika przy limicie
 * rozmiaru zapętliłoby wysyłkę: skrzynka miałaby na stałe mniej prób niż my,
 * więc każdy obieg uznawałby, że trzeba wysłać jeszcze raz.
 */
function mamyWiecej(merged: ProgressState, zdalny: ProgressState): boolean {
  const znane = new Set(zdalny.sessions.map((s) => s.id));
  return (
    merged.sessions.some((s) => !znane.has(s.id)) || merged.childName !== zdalny.childName
  );
}

/**
 * Pełny obieg: pobierz → scal → (jeśli mamy coś nowego) wyślij.
 * `applyMerged` oddaje scalony stan do magazynu aplikacji — wołający decyduje,
 * czy faktycznie coś się zmieniło i czy zapisać.
 *
 * Bez blokad i wersjonowania: gdy dwa urządzenia zapiszą naraz, jedno nadpisze
 * drugie. Nic nie ginie, bo każde ma swój postęp u siebie i przy następnym
 * obiegu (po sesji albo co 3 minuty) zobaczy brak i dośle go ponownie.
 */
export async function syncNow(
  localState: ProgressState,
  applyMerged: (merged: ProgressState) => void,
): Promise<void> {
  const code = status.code ?? loadSyncCode();
  if (!code || status.syncing) return;
  emit({ syncing: true });

  try {
    const zdalne = await pobierz(code);
    if (!zdalne.ok) {
      emit({ lastError: zdalne.rodzaj, lastErrorDetail: zdalne.opis });
      return;
    }

    const merged = zdalne.dane ? mergeProgress(localState, zdalne.dane) : localState;
    applyMerged(merged);

    if (zdalne.dane && !mamyWiecej(merged, zdalne.dane)) {
      emit({ lastOkTs: Date.now(), lastError: null, lastErrorDetail: null });
      return;
    }

    const wyslany = await wyslij(code, merged);
    if (wyslany.ok) emit({ lastOkTs: Date.now(), lastError: null, lastErrorDetail: null });
    else emit({ lastError: wyslany.rodzaj, lastErrorDetail: wyslany.opis });
  } finally {
    emit({ syncing: false });
  }
}
