/**
 * Jeden kod rodziny dla obu działów.
 *
 * Dział Dźwięki (lib/progress/sync.ts) i dział Akademia
 * (lib/akademia/progress/sync.ts) synchronizują się osobno — każdy do własnej
 * skrzynki (przedrostki „liga-dzwiekow-" i „akademia-ligi-"), każdy według
 * własnej, niezmienionej logiki (scalanie, reset, dołączanie do rodziny).
 * Łączy je tylko kod rodziny: prowadzi Liga, Akademia idzie za nią — tak było
 * już w osobnych aplikacjach (adoptFromLiga).
 *
 * Tu jest rama: wspólna karta w panelu rodzica i link parowania wołają
 * publiczne funkcje obu modułów w takiej kolejności, żeby żaden dział nie
 * został na innym kodzie ani nie wysyłał dalej po wyłączeniu.
 */

import * as akademia from "@/lib/akademia/progress/sync";
import * as liga from "@/lib/progress/sync";

/** Nowy obieg rodziny dla obu działów (Akademia bierze kod Ligi). */
export function enableFamilySync(): void {
  liga.enableSync();
  akademia.enableSync();
}

/** Wyłączenie na tym urządzeniu — w obu działach, żaden nie wysyła dalej. */
export function disableFamilySync(): void {
  liga.disableSync();
  akademia.disableSync();
}

/**
 * Liga przejmuje podany kod rodziny tą samą drogą co link parowania
 * (#sync=…): adoptFromHash zapisuje kod, zaznacza dołączenie do rodziny i
 * sprząta adres. Kod trafia do adresu tylko na tę chwilę (replaceState — bez
 * wpisu w historii).
 */
function ligaAdoptCode(code: string): boolean {
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}#sync=${code}`);
  const adopted = liga.adoptFromHash();
  // Gdyby kod nie pasował do formatu, adoptFromHash nie sprząta — robimy to sami.
  if (!adopted) window.history.replaceState(null, "", `${pathname}${search}`);
  return adopted;
}

/**
 * Link parowania otwarty na tym urządzeniu: podłącza oba działy naraz.
 * Wołane raz przy starcie (components/SyncBridge.tsx), zanim magazyny postępu
 * same zajrzą do adresu — inaczej kod przejąłby tylko ten dział, który
 * zdążyłby pierwszy.
 */
export function adoptPairingLink(): boolean {
  if (!liga.adoptFromHash()) return false;
  akademia.switchToLigaCode();
  return true;
}

/**
 * Podłączenie tego urządzenia krótkim kodem. Najpierw szuflada Ligi (krótkie
 * kody tej aplikacji), potem szuflada osobnej Akademii Ligi — kod pokazany
 * jeszcze tam też zadziała, a Dźwięki przejmą ten sam kod rodziny.
 */
export async function joinFamilyByShortCode(typed: string): Promise<akademia.ShortCodeResult> {
  if (await liga.adoptShortCode(typed)) {
    akademia.switchToLigaCode();
    return "ok";
  }
  const result = await akademia.adoptShortCode(typed);
  if (result === "ok") {
    const code = akademia.loadSyncCode();
    if (code && ligaAdoptCode(code)) akademia.switchToLigaCode();
  }
  return result;
}

/**
 * Dźwięki wyłączone, a Akademia synchronizuje się (sparowana osobno, sprzed
 * połączenia działów): Dźwięki dołączają do tego samego kodu rodziny.
 */
export function ligaJoinsAkademia(): boolean {
  const code = akademia.loadSyncCode();
  if (!code || !ligaAdoptCode(code)) return false;
  akademia.switchToLigaCode();
  return true;
}
