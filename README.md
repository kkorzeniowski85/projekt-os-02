# Liga Dźwięków — angielski przez phonics

Aplikacja (PWA) do nauki czytania po angielsku dla 7-latka, oparta o sekwencję
dźwięków **Read Write Inc.** Działa w przeglądarce na komputerze, tablecie i
telefonie; da się ją zainstalować jako aplikację.

## Instalacja na urządzeniach

Aplikacja jest publikowana na GitHub Pages:
**https://kkorzeniowski85.github.io/projekt-os-02/**

| Urządzenie | Jak zainstalować |
| --- | --- |
| Android (Chrome) | Otwórz adres → menu ⋮ → „Zainstaluj aplikację" |
| iPhone / iPad (Safari) | Otwórz adres → przycisk udostępniania ⤴ → „Do ekranu początkowego" |
| Komputer (Chrome/Edge) | Otwórz adres → ikona instalacji po prawej stronie paska adresu |

Po instalacji działa jak zwykła aplikacja: własna ikona, pełny ekran, bez paska
przeglądarki. Sesja zadziała też bez internetu — powłoka aplikacji i nagrania
siedzą w pamięci urządzenia.

## Aktualizacje

Każdy `git push` na gałąź `main` uruchamia build i publikację
(`.github/workflows/deploy.yml`). Urządzenia pobierają nową wersję same przy
następnym otwarciu aplikacji — nic nie trzeba przeinstalowywać.

**Uwaga:** postęp dziecka i nagrania głosek są zapisane w pamięci konkretnego
urządzenia (localStorage + IndexedDB). Aktualizacja aplikacji ich nie kasuje.
Postęp między urządzeniami przenosi się plikiem przez Dysk Google (tryb
rodzica → „Postęp między urządzeniami") — wczytywanie scala sesje i niczego
nie nadpisuje. Automatyczna synchronizacja: patrz
[docs/nastepne-kroki.md](docs/nastepne-kroki.md).

## Praca lokalna

```bash
npm --prefix angielski run dev
```

Potem `http://localhost:3000`. Na tablecie/telefonie w tej samej sieci:
`http://<ip-komputera>:3000`.

Build produkcyjny (to samo, co robi GitHub Actions):

```bash
npm --prefix angielski run build
```

Wynik ląduje w `angielski/out/` jako czysta statyka.

## Co już działa

### Tor 1 — czytanie (phonics)

- **60 kompletnych sesji** — cała sekwencja RWI: 25 pojedynczych liter Set 1,
  „special friends” (sh, ch, th, qu, ng, nk), cały Set 2 i cały Set 3
  (`/sesja/<dźwięk>`).
  Przebieg: wprowadzenie dźwięku → „słyszysz ten dźwięk?" → sklejanie dźwięków
  w słowo (Fred Talk) → „które słowo słyszysz?" → podsumowanie z nagrodą.
- **Tryb „z rodzicem" i „sam"** — w trybie wspólnym rodzic widzi wskazówki i to
  on ocenia czytanie na głos.
- **Scenka zwycięstwa** na koniec sesji: fajerwerki i confetti, gwiazdki
  wpadające z dzwoneczkami, fanfara (własną muzykę można podłożyć jako
  `public/audio/celebration.mp3` — patrz [docs/audio.md](docs/audio.md)).
- **Śledzenie postępu** (localStorage): status każdego dźwięku, log prób z
  czasami reakcji, historia sesji.
- **Automatyczna adaptacja**: proste progi decydują, czy powtórzyć dźwięk, czy
  iść dalej (`lib/progress/rules.ts`).
- **Tryb rodzica** (`/rodzic`): tabela postępu, eksport raportu (Markdown do
  wklejenia Claude + CSV), sprawdzanie brakujących nagrań, reset postępu.
  Wejście chronione bramką „przytrzymaj 3 sekundy" (pamiętaną do zamknięcia
  przeglądarki), żeby dziecko nie weszło tam przypadkiem.
- **Reorganizacja interfejsu wg urządzenia** — nie skalowanie, tylko inny układ:
  telefon dostaje skróconą „szybką misję", tablet pełną sesję, komputer
  dodatkową kolumnę dla rodzica.
- **PWA**: manifest, ikony, service worker (offline dla powłoki aplikacji).

- **Nagrania 579 słów** brytyjskim głosem neuronowym (`npm run audio`) —
  aplikacja używa ich zamiast głosu z urządzenia. Przed pierwszą sesją
  przesłuchaj je w trybie rodzica: powstały maszynowo i nikt ich jeszcze nie
  sprawdził.

- **Studio głosek** (tryb rodzica): rodzic nagrywa czyste głoski własnym głosem,
  po odsłuchaniu wzorca. Nagrania trafiają do sesji od razu, zostają na
  urządzeniu i można je pobrać, żeby wgrać na stałe.

- **Nagrania 62 czystych głosek** wycięte automatycznie z nagrań słów
  (`npm run audio:phonemes`) — prawdziwy brytyjski głos, nie synteza. Do
  odsłuchania przez rodzica; własne nagranie zawsze ma pierwszeństwo.

### Tor 2 — słownictwo, zwroty i kolokacje

- **10 tematów** (`/slownictwo`), w kolejności PILNOŚCI, nie trudności: pierwsze
  cztery to przetrwanie w szkole (zwroty ratunkowe, polecenia nauczyciela,
  zagadanie do dzieci, grzeczność), dalej rutyna dnia, stołówka, „boli mnie”,
  ubranie i pogoda, uczucia, przybory szkolne.
- **Nic nie trzeba czytać** — pytaniem jest nagranie albo polski tekst,
  odpowiedzią obrazek. Angielski zapis jest obok jako podparcie, nie warunek.
- **Polecenia nauczyciela tylko na rozumienie** („line up”, „tidy up”) — dziecko
  ma wiedzieć, co zrobić, a nie umieć je wypowiedzieć.
- **Kolokacje z prawdziwymi pułapkami** — dystraktory to kalki z polskiego
  (`brush` vs `wash your teeth`, `do` vs `make your homework`, `look for` vs
  `find`), a nie losowe słowa.
- **Wariant brytyjski** z uwagami dla rodzica tam, gdzie amerykański myli
  (rubber, jumper, wellies, chips vs crisps).
- Szczegóły i sposób dopisania tematu: [docs/slownictwo.md](docs/slownictwo.md).

## Czego jeszcze nie ma (świadomie)
- **Nagrań zwrotów toru 2 brytyjskim głosem** — do wygenerowania przez
  `npm run audio`. Do tego czasu zwroty czyta syntezator urządzenia; ćwiczenia
  działają, brzmią tylko gorzej.
- **Nagrywania i oceny wymowy dziecka** — decyzja z briefu, nie brak czasu.
  Mikrofon jest używany wyłącznie w studiu głosek, przez dorosłego, lokalnie.

## Struktura

```
app/
  page.tsx                  ekran główny (baza drużyny), wejście w oba tory
  sesja/[soundId]/          tor 1: jedna sesja czytania
  slownictwo/               tor 2: mapa tematów
  slownictwo/[topicId]/     tor 2: jedna sesja słownictwa
  rodzic/                   tryb rodzica: postęp, raport, audio
  manifest.ts               manifest PWA
components/
  session/SessionRunner.tsx  silnik toru 1 (4 ekrany ćwiczeń)
  session/VocabRunner.tsx    silnik toru 2 (6 ekranów ćwiczeń)
  session/InterruptDialog.tsx  okno „przerwać ćwiczenie?" — wspólne dla torów
  PhonemeRecorder.tsx       studio głosek — jedyne miejsce z mikrofonem
  HeroAvatar.tsx            postać rysowana w SVG
  ui.tsx                    duże przyciski, karty, odtwarzacze dźwięku
lib/
  curriculum/sounds.ts      pełna sekwencja RWI (Set 1/2/3) jako dane
  curriculum/lessons.ts     tor 1: treść ćwiczeń — tu dopisuje się dźwięki
  curriculum/vocab.ts       tor 2: tematy, słowa, zwroty, kolokacje
  curriculum/ipa.ts         zapis fonetyczny + podpowiedzi do nagrywania
  heroes.ts                 postacie i warunki ich odblokowania
  audio.ts                  kolejność źródeł: nagranie rodzica → plik → synteza
  recordings.ts             nagrania rodzica w IndexedDB
  progress/                 model postępu (oba tory), reguły, eksport raportu
  useDeviceRole.ts          rola urządzenia (telefon/tablet/komputer)
scripts/
  generate-audio.mjs        generator nagrań obu torów (npm run audio)
  audit-lessons.mjs         audyt danych obu torów (npm run audit)
public/audio/               words/ i phrases/ i phonemes/ (patrz docs/audio.md)
```

## Jak dodać kolejny dźwięk (tor 1)

1. Sprawdź, czy jest w `lib/curriculum/sounds.ts` (cała sekwencja RWI już tam
   jest — kolejność ma znaczenie, nie zmieniaj jej bez powodu).
2. Dopisz wpis do `LESSONS` w `lib/curriculum/lessons.ts`: słowa do rozpoznawania
   ze słuchu, słowa do sklejania (z podziałem na grafemy), rundy wyboru słowa,
   red words.
3. Uruchom `npm run audio` — generator dociągnie nagrania nowych słów.
4. Gotowe — sesja `/sesja/<id>` pojawi się sama, razem z kafelkiem na mapie
   dźwięków.

Dopisanie tematu do toru 2: [docs/slownictwo.md](docs/slownictwo.md).

## Założenia pedagogiczne (do weryfikacji przez rodzica)

Oznaczone w kodzie komentarzami. Najważniejsze:

- Zaczynamy od „special friends" (sh, ch, th…), bo CVC dziecko już zna.
- Progi 80% / 60% i „dwie sesje pod rząd" to punkt wyjścia, nie prawda
  objawiona — zmiana w jednym miejscu (`lib/progress/rules.ts`).
- Sesja na telefonie jest krótsza od sesji na tablecie. To decyzja projektowa
  („szybka misja" w drodze), nie ograniczenie techniczne.
- W torze 2 kolejność tematów to kolejność PILNOŚCI, nie trudności — dziecko
  jadące do szkoły potrzebuje „I don't understand" wcześniej niż nazw przyborów.
- Polecenia nauczyciela ćwiczymy wyłącznie na rozumienie. Milczenie w pierwszych
  tygodniach jest normalnym etapem; rozumienie poleceń nie jest.
