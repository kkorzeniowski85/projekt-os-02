/**
 * Minimalny service worker: instalowalna PWA + działanie bez internetu.
 *
 * Świadomie prosty. Bez powiadomień push, bez synchronizacji w tle — te rzeczy
 * dochodzą dopiero razem z backendem, jeśli w ogóle będą potrzebne.
 *
 * Przedrostek ścieżek liczymy z własnego adresu, bo na GitHub Pages aplikacja
 * siedzi w podkatalogu (/projekt-os-02/), a lokalnie w korzeniu.
 */

const BASE = self.location.pathname.replace(/\/sw\.js$/, "");
const CACHE = "liga-dzwiekow-v1";
const APP_SHELL = [`${BASE}/`, `${BASE}/rodzic/`, `${BASE}/icon.svg`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
      // skipWaiting: nowa wersja wchodzi od razu, bez zamykania wszystkich kart.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Nagrania i pliki z hashem w nazwie: najpierw cache — w podróży to one
  // decydują, czy sesja w ogóle zadziała.
  const cacheFirst =
    url.pathname.startsWith(`${BASE}/_next/static`) ||
    url.pathname.startsWith(`${BASE}/audio`);

  if (cacheFirst) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // Nawigacja: najpierw sieć (świeża wersja aplikacji), offline — z cache.
  // cache: "no-store" jest kluczowe: GitHub Pages wysyła Cache-Control:
  // max-age=600, więc zwykłe fetch() potrafi po cichu oddać 10-minutową
  // kopię z pamięci przeglądarki, mimo że kod tu wygląda na "sieć najpierw" —
  // no-store wymusza realne zapytanie do serwera przy każdym otwarciu.
  event.respondWith(
    fetch(request, { cache: "no-store" })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached ?? caches.match(`${BASE}/`)),
      ),
  );
});
