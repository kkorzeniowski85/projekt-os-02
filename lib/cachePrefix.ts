/**
 * Przedrostek pamięci podręcznej (CacheStorage) tej instalacji.
 *
 * CacheStorage jest wspólny dla całej domeny kkorzeniowski85.github.io, więc
 * „Pobierz najnowszą wersję" kasuje wyłącznie cache z tym przedrostkiem —
 * nigdy cudze (Akademia Ligi, wersja testowa, inne projekty).
 *
 * MUSI zgadzać się z cachePrefixFor w public/sw.js: pod /projekt-os-02/ i
 * lokalnie „liga-dzwiekow-" (nagrania zapisane przez dawną Ligę Dźwięków
 * zostają ważne), pod każdym innym adresem własny, np. /projekt-os-05/ →
 * „liga-test-os05-".
 */
export function cachePrefixFor(base: string): string {
  if (base === "" || base === "/projekt-os-02") return "liga-dzwiekow-";
  const slug = base.replace(/^\/projekt-/, "").replace(/[^A-Za-z0-9]/g, "").toLowerCase();
  return `liga-test-${slug || "x"}-`;
}

export const CACHE_PREFIX = cachePrefixFor(process.env.NEXT_PUBLIC_BASE_PATH ?? "");
