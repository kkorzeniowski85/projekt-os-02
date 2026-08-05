/**
 * Przenoszenie postępu między urządzeniami przez plik (np. na Dysku Google).
 *
 * Zasada scalania: NIGDY nie nadpisujemy — bierzemy unię sesji i prób po `id`
 * z obu stanów i odtwarzamy stan pochodny (statusy dźwięków, odblokowane
 * postacie), przepuszczając wszystkie sesje chronologicznie przez te same
 * reguły, które działają na żywo. Wynik jest taki, jakby wszystkie sesje
 * odbyły się na jednym urządzeniu.
 *
 * Dzięki temu kolejność operacji nie ma znaczenia: można wczytać stary plik
 * po nowym, ten sam plik dwa razy, albo pliki z dwóch różnych urządzeń —
 * postęp może tylko urosnąć. To jest też fundament pod przyszłą automatyczną
 * synchronizację (Drive API / backend): tam scala się dokładnie tak samo.
 */

import { applySessionResult, RULES } from "./rules";
import {
  emptyProgress,
  PROGRESS_SCHEMA_VERSION,
  type Attempt,
  type ProgressState,
  type SessionRecord,
} from "./types";

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const newer = a.updatedTs >= b.updatedTs ? a : b;

  const sessions: SessionRecord[] = uniqueById([...a.sessions, ...b.sessions]).sort(
    (x, y) => x.endedTs - y.endedTs,
  );
  const attempts: Attempt[] = uniqueById([...a.attempts, ...b.attempts])
    .sort((x, y) => x.ts - y.ts)
    .slice(-RULES.attemptLogLimit);

  let merged = emptyProgress(newer.childName);
  for (const session of sessions) {
    merged = applySessionResult(merged, session);
  }

  return {
    ...merged,
    attempts,
    unlockedHeroes: [
      ...new Set([...merged.unlockedHeroes, ...a.unlockedHeroes, ...b.unlockedHeroes]),
    ],
  };
}

/** Treść pliku wymiany — czytelny JSON, żeby dało się zajrzeć do środka. */
export function buildProgressExport(state: ProgressState): string {
  return JSON.stringify(state, null, 2);
}

export function progressFileName(now = new Date()): string {
  return `liga-dzwiekow-postep-${now.toISOString().slice(0, 10)}.json`;
}

/**
 * Walidacja wczytywanego pliku. Zwraca null przy śmieciach — świadomie
 * odrzucamy też inne wersje schematu, zamiast zgadywać migrację w locie.
 */
export function parseProgressFile(text: string): ProgressState | null {
  try {
    // BOM i białe znaki zdarzają się po przejściu pliku przez edytory/Dysk.
    const data = JSON.parse(text.replace(/^﻿/, "").trim()) as ProgressState;
    if (typeof data !== "object" || data === null) return null;
    if (data.version !== PROGRESS_SCHEMA_VERSION) return null;
    if (!Array.isArray(data.sessions) || !Array.isArray(data.attempts)) return null;
    if (typeof data.sounds !== "object" || data.sounds === null) return null;
    if (typeof data.childName !== "string") return null;
    return data;
  } catch {
    return null;
  }
}
