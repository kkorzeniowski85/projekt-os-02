"use client";

/**
 * Synchronizacja nagrań głosek zrobionych przez rodzica.
 *
 * PO CO: nagrania żyją w IndexedDB, czyli per urządzenie i per przeglądarka.
 * Bez tego rodzic nagrywa komplet na komputerze, a dziecko na tablecie słyszy
 * syntezator — aplikacja wygląda wszędzie tak samo, ale brzmi inaczej.
 *
 * DLACZEGO OSOBNO OD POSTĘPU: postęp to jeden mały dokument, a nagrania to
 * kilkadziesiąt plików dźwiękowych. Razem przekroczyłyby limit jednej skrzynki
 * i każda drobna zmiana postępu kazałaby przesyłać całe audio. Dlatego każde
 * nagranie ma własną szufladę pod tym samym kodem rodziny, a obok leży spis
 * treści, po którym poznajemy, czego nam brakuje — bez ściągania czegokolwiek.
 *
 * ROZSTRZYGANIE SPORÓW: wygrywa nowszy znacznik czasu, osobno dla każdej
 * głoski. Skasowanie też ma swój znacznik (lib/recordings.ts), więc "nagrane
 * wczoraj" nie wskrzesi czegoś, co dziś świadomie skasowano — i odwrotnie,
 * poprawka nagrana po skasowaniu normalnie się rozejdzie.
 */

import {
  deleteRecording,
  deletionMarks,
  getRecording,
  listRecordings,
  markDeleted,
  saveRecording,
} from "@/lib/recordings";
import { mailboxUrl, readMailbox, writeMailbox } from "./sync";

/** Nagranie po zakodowaniu base64 rośnie o jedną trzecią — stąd zapas. */
const LIMIT_NAGRANIA = 700_000;

/** Zdarzenie dla panelu rodzica: lista nagrań właśnie się zmieniła. */
export const RECORDINGS_CHANGED = "phonics:nagrania-zmienione";

type Wpis = {
  id: string;
  /** Czas nagrania albo skasowania — po nim rozstrzygamy, co jest świeższe. */
  ts: number;
  mime?: string;
  usuniete?: boolean;
};

type Spis = { items: Wpis[] };

function spisUrl(code: string): string {
  return mailboxUrl(code, "-nagrania");
}

function nagranieUrl(code: string, id: string): string {
  return mailboxUrl(code, `-n-${id}`);
}

// --- kodowanie -------------------------------------------------------------

async function doBase64(blob: Blob): Promise<string> {
  const bajty = new Uint8Array(await blob.arrayBuffer());
  // Porcjami, bo apply/spread na kilkuset tysiącach argumentów przepełnia stos.
  let binarnie = "";
  const PORCJA = 0x8000;
  for (let i = 0; i < bajty.length; i += PORCJA) {
    binarnie += String.fromCharCode(...bajty.subarray(i, i + PORCJA));
  }
  return btoa(binarnie);
}

function zBase64(base64: string, mime: string): Blob {
  const binarnie = atob(base64);
  const bajty = new Uint8Array(binarnie.length);
  for (let i = 0; i < binarnie.length; i++) bajty[i] = binarnie.charCodeAt(i);
  return new Blob([bajty], { type: mime });
}

// --- spis treści -----------------------------------------------------------

function mojSpis(
  lokalne: { id: string; mime: string; createdTs: number }[],
  skasowane: Record<string, number>,
): Map<string, Wpis> {
  const spis = new Map<string, Wpis>();
  for (const r of lokalne) spis.set(r.id, { id: r.id, ts: r.createdTs, mime: r.mime });
  for (const [id, ts] of Object.entries(skasowane)) {
    const istniejacy = spis.get(id);
    if (!istniejacy || ts > istniejacy.ts) spis.set(id, { id, ts, usuniete: true });
  }
  return spis;
}

function scalSpisy(moj: Map<string, Wpis>, zdalny: Wpis[]): Map<string, Wpis> {
  const wynik = new Map(moj);
  for (const wpis of zdalny) {
    if (!wpis?.id || typeof wpis.ts !== "number") continue;
    const nasz = wynik.get(wpis.id);
    if (!nasz || wpis.ts > nasz.ts) wynik.set(wpis.id, wpis);
  }
  return wynik;
}

// --- silnik ----------------------------------------------------------------

export type WynikNagran = {
  pobrane: string[];
  wyslane: string[];
  skasowane: string[];
  bledy: number;
};

/**
 * Jeden obieg nagrań. Świadomie odporny na częściowe niepowodzenia: pojedyncze
 * nagranie, którego nie udało się przesłać, nie przerywa reszty i doślemy je
 * przy następnym obiegu — spis zapisujemy na końcu, więc nic nie znika.
 */
let wTrakcie = false;

export async function syncRecordings(code: string): Promise<WynikNagran> {
  const wynik: WynikNagran = { pobrane: [], wyslane: [], skasowane: [], bledy: 0 };

  // Obieg audio trwa dłużej niż obieg postępu, a wyzwalaczy jest kilka
  // (powrót do aplikacji, koniec sesji, zegar). Bez tej blokady dwa obiegi
  // wysyłałyby te same nagrania równolegle.
  if (wTrakcie) return wynik;
  wTrakcie = true;
  try {
    return await obiegNagran(code, wynik);
  } finally {
    wTrakcie = false;
  }
}

async function obiegNagran(code: string, wynik: WynikNagran): Promise<WynikNagran> {
  const lokalne = await listRecordings();
  const moj = mojSpis(lokalne, deletionMarks());

  const odczyt = await readMailbox(spisUrl(code));
  if (!odczyt.ok) {
    wynik.bledy++;
    return wynik;
  }

  let zdalny: Wpis[] = [];
  if (odczyt.dane.trim()) {
    try {
      zdalny = (JSON.parse(odczyt.dane) as Spis).items ?? [];
    } catch {
      zdalny = [];
    }
  }

  const docelowy = scalSpisy(moj, zdalny);
  const zdalnyWgId = new Map(zdalny.map((w) => [w.id, w]));
  const lokalneWgId = new Map(lokalne.map((r) => [r.id, r]));

  for (const wpis of docelowy.values()) {
    const mamy = lokalneWgId.get(wpis.id);

    // 1. Skasowane wygrywa — usuwamy u siebie, jeśli jeszcze mamy.
    if (wpis.usuniete) {
      if (mamy) {
        try {
          await deleteRecording(wpis.id);
          // deleteRecording stawia własny, świeższy znacznik — cofamy go do
          // czasu oryginalnego skasowania, żeby urządzenia nie licytowały się
          // w nieskończoność coraz nowszymi znacznikami tego samego faktu.
          markDeleted(wpis.id, wpis.ts);
          wynik.skasowane.push(wpis.id);
        } catch {
          wynik.bledy++;
        }
      }
      continue;
    }

    // 2. Nie mamy albo mamy starsze — ściągamy.
    if (!mamy || mamy.createdTs < wpis.ts) {
      const paczka = await readMailbox(nagranieUrl(code, wpis.id));
      if (!paczka.ok || !paczka.dane.trim()) {
        wynik.bledy++;
        continue;
      }
      try {
        const dane = JSON.parse(paczka.dane) as { mime?: string; data?: string; ts?: number };
        if (!dane?.data) throw new Error("pusta paczka");
        await saveRecording(
          wpis.id,
          zBase64(dane.data, dane.mime || wpis.mime || "audio/webm"),
          wpis.ts,
        );
        wynik.pobrane.push(wpis.id);
      } catch {
        wynik.bledy++;
      }
      continue;
    }

    // 3. Mamy świeższe (albo skrzynka w ogóle tego nie zna) — wysyłamy.
    const zdalnyWpis = zdalnyWgId.get(wpis.id);
    if (!zdalnyWpis || zdalnyWpis.ts < mamy.createdTs || zdalnyWpis.usuniete) {
      const wiersz = await getRecording(wpis.id);
      if (!wiersz) continue;
      const base64 = await doBase64(wiersz.blob);
      if (base64.length > LIMIT_NAGRANIA) {
        wynik.bledy++;
        continue;
      }
      const zapis = await writeMailbox(
        nagranieUrl(code, wpis.id),
        JSON.stringify({ mime: wiersz.mime, ts: wiersz.createdTs, data: base64 }),
      );
      if (zapis.ok) wynik.wyslane.push(wpis.id);
      else wynik.bledy++;
    }
  }

  // Spis zapisujemy tylko wtedy, gdy faktycznie się zmienił — inaczej każde
  // urządzenie przepisywałoby go co trzy minuty bez powodu.
  const nowy: Spis = { items: [...docelowy.values()] };
  if (JSON.stringify(nowy.items) !== JSON.stringify(zdalny)) {
    const zapis = await writeMailbox(spisUrl(code), JSON.stringify(nowy));
    if (!zapis.ok) wynik.bledy++;
  }

  if (wynik.pobrane.length || wynik.skasowane.length) {
    window.dispatchEvent(new Event(RECORDINGS_CHANGED));
  }
  return wynik;
}
