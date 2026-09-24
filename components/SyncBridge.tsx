"use client";

/**
 * Link parowania (#sync=…) podłącza oba działy naraz.
 *
 * Magazyny postępu obu działów same zaglądają do adresu (adoptFromHash), ale
 * dopiero po wczytaniu danych — i ten, który zdąży pierwszy, sprząta adres,
 * więc drugi dział zostałby bez kodu. Ten komponent siedzi wewnątrz obu
 * ProgressProviderów: jego efekt działa przy pierwszym renderze, przed
 * efektami magazynów, i przekazuje kod obu działom w ustalonej kolejności
 * (lib/familySync.ts). Magazyny zastają już czysty adres i gotowe kody.
 */

import { useEffect } from "react";
import { adoptPairingLink } from "@/lib/familySync";

export function SyncBridge() {
  useEffect(() => {
    if (!/[#&]sync=/.test(window.location.hash)) return;
    adoptPairingLink();
  }, []);
  return null;
}
