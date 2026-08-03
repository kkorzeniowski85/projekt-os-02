# Następne kroki i pytania otwarte

Stan na 3 sierpnia 2026, po zbudowaniu szkieletu i dwóch sesji (`sh`, `ch`).

## Najbliższy krok: test z dzieckiem

Zanim dojdzie cokolwiek nowego, warto sprawdzić rzeczy, których nie da się
rozstrzygnąć przy klawiaturze:

- Czy dziecko rozumie polecenia bez tłumaczenia za każdym razem?
- Czy sesja (~15 ekranów na tablecie) to za dużo, w sam raz, czy za mało?
- Czy stukanie w kawałki słowa jest zrozumiałe jako „sklejanie dźwięków”?
- Czy chce wrócić następnego dnia? (najważniejsze pytanie)
- Czy postacie w ogóle go interesują — i jakie imiona chciałby im dać?

Wyniki tego testu powinny zdecydować o kolejności dalszych prac. Poniższa lista
jest propozycją, nie planem do odhaczenia.

## Pytania otwarte z briefu — stan

| # | Pytanie | Stan |
| --- | --- | --- |
| 1 | Lista dźwięków na start | **Rozstrzygnięte** — sekwencja RWI Set 1/2/3 zakodowana w `lib/curriculum/sounds.ts`, start od „special friends” (sh, ch), bo CVC dziecko już zna |
| 2 | Źródło nagrań | **Słowa zrobione** (32 pliki, brytyjski głos neuronowy en-GB, `npm run audio`). **Głoski: rodzic nagrywa sam** w studiu głosek (tryb rodzica), po odsłuchaniu wzorca; alternatywnie klucz Azure. Patrz [audio.md](audio.md) |
| 3 | Zakres słownictwa | **Częściowo** — słowa dobrane tak, by dały się przeczytać poznanymi dźwiękami (zasada RWI), tematy bliskie dziecku. Do potwierdzenia, czy trzymamy się tej zasady, czy dokładamy słownictwo tematyczne niezależnie od dźwięków |
| 4 | Ile czasu dziennie | **Otwarte** — wpływa na progi w `rules.ts` i długość sesji. Można odpowiedzieć po tygodniu realnego używania (widać w raporcie) |
| 5 | Tryb offline | **Zrobione w minimalnym zakresie** — service worker cache'uje powłokę aplikacji i nagrania; postęp i tak jest lokalny |
| 6 | Postacie i moce | **Imiona po angielsku** (BUZZ, SHOCK, CHOMP, THUNDER) — każde zawiera dźwięk, który postać odblokowuje. Nadal robocze, do zmiany z dzieckiem (`codename` w `lib/heroes.ts`) |
| 7 | Wspólny backend z fiszkami | **Rozstrzygnięte: osobno** — aplikacje pozostają niezależne, ale trzymają wspólny format ([KONWENCJE.md](../../KONWENCJE.md)), żeby połączenie było możliwe później |
| 8 | Zakres raportu | **Wstępnie zrobione** — raport zawiera: statusy dźwięków, liczbę i tryb sesji, czas nauki, powtarzające się błędy, mediany czasów reakcji, użyte progi. Do skorygowania po pierwszej realnej analizie |

## Backend i synchronizacja (pytanie 7 — rozstrzygnięte)

**Aplikacje zostają osobne.** Bez wspólnego kodu, konta i backendu. Wspólny jest
tylko format: stack, układ katalogów, sposób trzymania danych — spisany w
[KONWENCJE.md](../../KONWENCJE.md). Dzięki temu połączenie ich w przyszłości
(gdyby miało sens jedno konto rodzinne) zostaje możliwe, ale nic dziś na nie nie
czeka.

Aplikacja jest już pod to przygotowana: sesja zapisuje się jako zamknięta
paczka z własnym `id` i znacznikami czasu, a cały dostęp do danych idzie przez
`lib/progress/store.tsx` — to jedyny plik do przepisania, gdy dojdzie API.

Skala jest mała (jedno dziecko, 2-3 urządzenia), więc wystarczy rozstrzyganie
konfliktów „wygrywa nowszy zapis” na poziomie sesji — sesje są niepodzielne i
nie nakładają się na siebie.

## Kolejka funkcji (propozycja)

1. **Nagrania głosek** — 14 sztuk, kilkanaście minut w studiu głosek. Odblokowuje
   ćwiczenie sklejania, które dziś w części milczy.
2. **Kolejne dźwięki** — `th`, `qu`, `ng`, `nk`, potem Set 2 (`ay`, `ee`,
   `igh`…). Dopisanie lekcji to jeden wpis w `lessons.ts`.
3. **Red words jako osobne ćwiczenie** — teraz tylko pokazują się na końcu
   sesji. Zasługują na własny, krótki tryb („rozpoznaj w 5 sekund”).
4. **Tor 2: słuchanie i słownictwo** — osobny typ sesji, bez czytania.
5. **Backend + synchronizacja** — dopiero gdy dziecko realnie używa aplikacji na
   więcej niż jednym urządzeniu. Wcześniej to praca bez zwrotu.
6. **Alien words** (nonsense words z Phonics Screening Check) — ćwiczenie czystego
   dekodowania. Przydatne bliżej wyjazdu, nie teraz.

## Czego świadomie nie robimy

- Nagrywania i oceny wymowy dziecka (decyzja z briefu).
- Kar, timerów, znikających serc i innych mechanik pod presją.
- Postaci wzorowanych na chronionych prawem autorskim bohaterach.
