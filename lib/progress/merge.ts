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
 * postęp może tylko urosnąć. Tak samo scala automatyczna synchronizacja
 * (sync.ts).
 *
 * Wyjątki (podstawa wspólna z Akademią Ligi — różnice w docs/nastepne-kroki.md):
 *  - reset: sesje i próby starsze niż granica odcięcia (cutoffTs — najnowszy
 *    `resetTs` z obu stron, chyba że później przywrócono kopię) odpadają —
 *    inaczej wyczyszczony postęp wracał z chmury albo ze starego pliku;
 *  - imię: wygrywa późniejsza ZMIANA IMIENIA (`childNameTs`), a nie stan z
 *    późniejszą sesją.
 */

import { applySessionResult, RULES } from "./rules";
import {
  cutoffTs,
  emptyProgress,
  normalizeProgress,
  PROGRESS_SCHEMA_VERSION,
  type Attempt,
  type ProgressState,
  type SessionRecord,
} from "./types";

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

/** Deterministyczny wybór imienia — scalanie musi być przemienne. */
function nameSource(a: ProgressState, b: ProgressState): ProgressState {
  const aTs = a.childNameTs ?? 0;
  const bTs = b.childNameTs ?? 0;
  if (aTs !== bTs) return aTs > bTs ? a : b;
  return a.childName >= b.childName ? a : b;
}

export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const resetTs = Math.max(a.resetTs ?? 0, b.resetTs ?? 0);
  const restoreTs = Math.max(a.restoreTs ?? 0, b.restoreTs ?? 0);
  const cutoff = cutoffTs({ resetTs, restoreTs });
  const nameFrom = nameSource(a, b);

  const sessions: SessionRecord[] = uniqueById([...a.sessions, ...b.sessions])
    .filter((session) => session.endedTs >= cutoff)
    .sort((x, y) => x.endedTs - y.endedTs || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
  const attempts: Attempt[] = uniqueById([...a.attempts, ...b.attempts])
    .filter((attempt) => attempt.ts >= cutoff)
    .sort((x, y) => x.ts - y.ts || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
    .slice(-RULES.attemptLogLimit);

  let merged = emptyProgress(nameFrom.childName);
  for (const session of sessions) {
    merged = applySessionResult(merged, session);
  }

  // Postacie odtwarzają się z sesji; dokładamy te zapisane po stronach, żeby
  // raz zdobyta nie znikła po zmianie reguł. Ale tylko ze stron, które widziały
  // tę samą granicę odcięcia — strona sprzed resetu ma postacie z sesji, które
  // właśnie odpadły.
  // Dołożone sortujemy, żeby kolejność nie zależała od kolejności stron.
  const heroesFrom = [a, b].filter((side) => cutoffTs(side) >= cutoff);
  const extraHeroes = heroesFrom
    .flatMap((side) => side.unlockedHeroes)
    .filter((heroId) => !merged.unlockedHeroes.includes(heroId))
    .sort();

  return {
    ...merged,
    childNameTs: nameFrom.childNameTs ?? 0,
    resetTs,
    restoreTs,
    attempts,
    unlockedHeroes: [...new Set([...merged.unlockedHeroes, ...extraHeroes])],
  };
}

export type ImportPreview = {
  /** Granica odcięcia po zwykłym scaleniu (0 = brak). */
  cutoffTs: number;
  /** Sesje z pliku starsze niż ta granica — zwykłe scalenie je pominie. */
  olderInFile: number;
  /** Sesje z tego urządzenia, które zwykłe scalenie usunie (plik niesie nowszy reset). */
  removedLocal: number;
  /** Granica odcięcia na tym urządzeniu przed wczytaniem (0 = brak). */
  localCutoffTs: number;
  /**
   * Sesje z pliku starsze niż LOKALNA granica, które wejdą, bo plik niesie
   * przywrócenie późniejsze niż wyczyszczenie postępu na tym urządzeniu —
   * zwykłe scalenie zniosłoby tu reset bez pytania. Wczytanie pliku po
   * withoutMarkers zostawia lokalną granicę.
   */
  revivedByFile: number;
};

/**
 * Co zrobi wczytanie pliku, zanim je zrobimy — panel pyta rodzica, gdy plik
 * ma sesje sprzed wyczyszczenia postępu (można je przywrócić), gdy niesie
 * nowszy reset, który skasuje sesje z tego urządzenia, albo gdy niesie
 * przywrócenie, które zniosłoby reset zrobiony tutaj.
 */
export function previewImport(local: ProgressState, incoming: ProgressState): ImportPreview {
  const cutoff = cutoffTs({
    resetTs: Math.max(local.resetTs ?? 0, incoming.resetTs ?? 0),
    restoreTs: Math.max(local.restoreTs ?? 0, incoming.restoreTs ?? 0),
  });
  const localCutoff = cutoffTs(local);
  const here = new Set(local.sessions.map((session) => session.id));
  const fromFile = uniqueById(incoming.sessions).filter((session) => !here.has(session.id));
  return {
    cutoffTs: cutoff,
    olderInFile: fromFile.filter((session) => session.endedTs < cutoff).length,
    removedLocal: local.sessions.filter((session) => session.endedTs < cutoff).length,
    localCutoffTs: localCutoff,
    revivedByFile:
      localCutoff > cutoff
        ? fromFile.filter((session) => session.endedTs < localCutoff).length
        : 0,
  };
}

/**
 * Plik bez znaczników resetu i przywrócenia — gdy rodzic nie chce, żeby
 * przywrócenie zapisane w kopii znosiło reset zrobiony na tym urządzeniu.
 * Wchodzą wtedy tylko sesje z czasu po lokalnym resecie.
 */
export function withoutMarkers(incoming: ProgressState): ProgressState {
  return { ...incoming, resetTs: 0, restoreTs: 0 };
}

/** Ile sesji scalenie dodało i ile usunęło — do komunikatu po imporcie. */
export function sessionDiff(
  before: ProgressState,
  after: ProgressState,
): { added: number; removed: number } {
  const beforeIds = new Set(before.sessions.map((session) => session.id));
  const afterIds = new Set(after.sessions.map((session) => session.id));
  return {
    added: [...afterIds].filter((id) => !beforeIds.has(id)).length,
    removed: [...beforeIds].filter((id) => !afterIds.has(id)).length,
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
    // `topics` celowo NIE jest wymagane: pliki zapisane przed torem 2 go nie
    // mają i są w pełni poprawne. Uzupełniamy zamiast odrzucać.
    return normalizeProgress(data);
  } catch {
    return null;
  }
}
