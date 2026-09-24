/**
 * Odmiana i daty w komunikatach panelu rodzica (dział Dźwięki i
 * synchronizacja). Wydzielone bez zmian z dawnego app/rodzic/page.tsx Ligi.
 */

/** Polska odmiana liczebnika: 1 → one, 2-4 → few (z wyjątkiem 12-14), reszta i 0 → many. */
export function plural(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one;
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return few;
  return many;
}

/** Polska odmiana: 1 sesję, 2-4 sesje, 5+ sesji (z wyjątkiem 12-14). */
export function sessionsWord(count: number): string {
  return plural(count, "sesję", "sesje", "sesji");
}

/** Polska odmiana: 1 głoskę, 2-4 głoski, 5+ głosek. */
export function soundsWord(count: number): string {
  return plural(count, "głoskę", "głoski", "głosek");
}

/** Data resetu w komunikatach dla rodzica, np. „23 września 2026". */
export function resetDate(ts: number): string {
  return new Date(ts).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
