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
// Pamięć podręczna jest wspólna dla CAŁEJ domeny kkorzeniowski85.github.io —
// stoją tu też Akademia Ligi i inne projekty. Sprzątamy wyłącznie własne
// wersje (ten przedrostek); skasowanie cudzych zabierałoby im tryb offline.
const PREFIX = "liga-dzwiekow-";
const CACHE = `${PREFIX}v1`;
// Mapa tematów toru 2 jest w powłoce, żeby offline działała od pierwszego
// otwarcia; poszczególne sesje (/slownictwo/<id>/) trafiają do cache przy
// pierwszej wizycie, jak każda nawigacja.
const APP_SHELL = [
  `${BASE}/`,
  `${BASE}/rodzic/`,
  `${BASE}/slownictwo/`,
  `${BASE}/rymowanki/`,
  `${BASE}/icon.svg`,
];

/**
 * Brakujące wpisy powłoki — po udanej nawigacji online. Starsze aplikacje na
 * tej samej domenie potrafią skasować CAŁY CacheStorage; bez tego tryb
 * offline wracałby dopiero przy następnej instalacji.
 */
async function ensureShell() {
  const cache = await caches.open(CACHE);
  await Promise.all(
    APP_SHELL.map(async (url) => {
      if (await cache.match(url)) return;
      await cache.add(new Request(url, { cache: "reload" })).catch(() => undefined);
    }),
  );
}

/**
 * Nagranie z pamięci, pobrane raz w całości. Element <audio> pyta o fragmenty
 * pliku (nagłówek Range), GitHub Pages odpowiada wtedy 206, a takiej
 * odpowiedzi Cache API nie przyjmuje — przez to żadne nagranie nie trafiało
 * do pamięci i offline nic nie grało. Fragment dla odtwarzacza wycinamy sami;
 * HEAD (sprawdzenie, czy nagranie istnieje) też obsługujemy z pamięci.
 */
async function audioResponse(request, url) {
  const cache = await caches.open(CACHE);
  const key = url.origin + url.pathname;
  let full = await cache.match(key);
  if (!full) {
    let fresh;
    try {
      fresh = await fetch(key);
    } catch {
      return Response.error();
    }
    if (fresh.status !== 200) return fresh;
    await cache.put(key, fresh.clone()).catch(() => undefined);
    full = fresh;
  }
  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers: full.headers });
  }
  const range = request.headers.get("range");
  if (!range) return full;

  const buffer = await full.arrayBuffer();
  const size = buffer.byteLength;
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  let start = match && match[1] ? Number(match[1]) : 0;
  let end = match && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (match && !match[1] && match[2]) {
    start = Math.max(0, size - Number(match[2]));
    end = size - 1;
  }
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": full.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

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
        Promise.all(
          keys
            .filter((key) => key.startsWith(PREFIX) && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Nagrania: w podróży to one decydują, czy sesja w ogóle zadziała.
  if (url.pathname.startsWith(`${BASE}/audio/`) && (request.method === "GET" || request.method === "HEAD")) {
    event.respondWith(audioResponse(request, url));
    return;
  }

  if (request.method !== "GET") return;

  // Pliki z hashem w nazwie: najpierw cache.
  if (url.pathname.startsWith(`${BASE}/_next/static`)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
            }
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
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          if (request.mode === "navigate") event.waitUntil(ensureShell().catch(() => undefined));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached ?? caches.match(`${BASE}/`)),
      ),
  );
});
