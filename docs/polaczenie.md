# Połączenie Ligi Dźwięków i Akademii Ligi — etap 1

Jedna aplikacja „Liga” pod dotychczasowym adresem Ligi
(**https://kkorzeniowski85.github.io/projekt-os-02/**), w środku dwa działy:
**Dźwięki** (dawna Liga Dźwięków) i **Akademia** (dawna Akademia Ligi,
projekt-os-04). Zasada etapu 1: **jedna aplikacja, dwa silniki**. Zmieniła się
tylko rama (trasy, układ, strona główna, panel rodzica, service worker,
manifest, tryb testowy). Silniki sesji i warstwy danych obu działów działają
dokładnie tak jak w osobnych aplikacjach — te same klucze, te same formaty,
ta sama synchronizacja — więc przełączenie nie wymaga migracji, a cofnięcie
niczego nie gubi.

Decyzje rodzica, na których to stoi:

1. Adres zostaje projekt-os-02. Akademia (os-04) później będzie przekierowywać
   (przygotowuje to lider — patrz „Przełączenie”).
2. Nazwa „Liga”, działy „Dźwięki” i „Akademia”.
3. Misja dnia: 2 kroki + 1 dla chętnych (niżej).

## Co gdzie leży

| Część | Pliki | Uwagi |
| --- | --- | --- |
| **Silnik Dźwięków** | `lib/progress/*`, `lib/curriculum/*`, `lib/audio.ts`, `lib/recordings.ts`, `components/session/*`, `components/PhonemeRecorder.tsx`, `app/sesja`, `app/slownictwo`, `app/rymowanki` | bez zmian; jedyny dodatek: strażnicy trybu testowego (`TEST_MODE`) w `lib/progress/sync.ts` i wybór bazy nagrań w `lib/recordings.ts` |
| **Silnik Akademii** | `lib/akademia/**` (dawne `szkola/lib/**`), `components/akademia/**` (dawne `szkola/components/session/*`, `ClockFace`, `FactGrid`, `NumberPad`, `UnitList`, `ui.tsx`), `app/tabliczka`, `app/matematyka`, `app/czytanie`, `app/polecenia` | skopiowane z `szkola/` (HEAD 3f4c11a) z przepisanymi importami; zmiany: baza ścieżek nagrań `/audio/akademia/` w `lib/akademia/audio.ts`, strażnicy `TEST_MODE` w `lib/akademia/progress/sync.ts`, link „otwórz Ligę” w `app/polecenia/page.tsx` prowadzi wewnątrz aplikacji |
| **Wspólne komponenty** | `components/HeroAvatar.tsx`, `Celebration.tsx`, `QrCode.tsx`, `ParentGate.tsx`, `ServiceWorkerRegistrar.tsx`, `lib/sessionBusy.ts`, `lib/useDeviceRole.ts` | były identyczne w obu (albo różniły się trywialnie) — jedna wersja, Ligi. `sessionBusy` jest jeden, bo rejestrator SW sprawdza „w toku” dla obu silników. `ui.tsx` Akademii różni się (Speaker, PageHeader, ParentTip z tytułem) — został jako `components/akademia/ui.tsx` |
| **Rama** | `app/layout.tsx` (oba ProgressProvidery, pasek testowy), `app/page.tsx`, `lib/dailyMission.ts`, `app/rodzic/page.tsx` + `components/rodzic/*`, `lib/familySync.ts`, `components/SyncBridge.tsx`, `public/sw.js`, `lib/cachePrefix.ts`, `app/manifest.ts`, `lib/testMode.ts`, `lib/testModeScript.ts` | nowe albo przebudowane |
| **Nagrania** | `public/audio/{words,phrases,phonemes,rhymes}` (Dźwięki), `public/audio/akademia/{facts,numbers,phrases}` (Akademia) | osobny katalog Akademii, bo 7 nazw w `phrases/` powtarza się w Lidze z inną treścią nagrania |
| **Skrypty** | `scripts/*` (Dźwięki), `scripts/akademia/*` | `npm run audio`, `npm run audit` / `npm run audio:akademia`, `npm run audit:akademia`; `scripts/deploy-manifest.mjs` obejmuje całe `public/audio` |
| **Dokumentacja Akademii** | `docs/akademia/README.md`, `docs/akademia/decyzje.md` | kopia z `szkola/` |

`globals.css` to suma obu (tokeny kolorów były identyczne; z Akademii doszła
animacja `shake` i `touch-action: manipulation`). Viewport został jak w Lidze
(blokada zoomu — dziecko dużo stuka); Akademia miała zoom szczypaniem dla
rodzica, ale na iOS blokada i tak nie działa, a `touch-action` zatrzymuje
przypadkowy zoom dwuklikiem wszędzie.

## Dane — dwa silniki obok siebie

Obie aplikacje stały na tej samej domenie (`kkorzeniowski85.github.io`), więc
dzielą localStorage, IndexedDB i CacheStorage. Połączona aplikacja pod
`/projekt-os-02/` od razu widzi dane obu — **bez migracji, bez zmiany nazw**.

| Magazyn | Dźwięki (Liga) | Akademia |
| --- | --- | --- |
| postęp (localStorage) | `phonics.progress.v1` (+ `phonics.progress.v1.backup.vN` przy obcej wersji) | `school.progress.v1` (+ `….backup.vN`) |
| synchronizacja | `phonics.sync.v2` (kod rodziny), `phonics.sync.markers.v1`, `phonics.sync.joining.v1` (`phonics.sync.v1` — stary, sprzątany) | `school.sync.v1` (kod, `fromLiga`, `optOut`, `codeChangedTs`), `school.sync.markers.v1`, `school.sync.joining.v1` |
| inne | `phonics.recordings.deleted.v1` (ślady usuniętych nagrań) | `school.session-draft.v1.<id>` (szkice trwających sesji) |
| IndexedDB | `liga-dzwiekow` (magazyn `phoneme-recordings` — nagrania rodzica) | — |
| sessionStorage | `phonics.parent-gate.v1` (bramka panelu — teraz jedna dla obu działów), `phonics.parent-tab.v1` (ostatnia zakładka panelu, nowe) | `school.parent-gate.v1` (nieużywany w połączonej aplikacji) |
| skrzynki textdb.dev | `liga-dzwiekow-<kod>` (+ nagrania, krótkie kody `liga-dzwiekow-para-…`) | `akademia-ligi-<kod>` (krótkie kody `akademia-ligi-para-…`) |
| CacheStorage | `liga-dzwiekow-v1` | `akademia-ligi-v1` (należy do os-04 — nie ruszamy) |

Wspólna domena = kasujemy **wyłącznie własne** rzeczy po przedrostku. Nic w
połączonej aplikacji nie kasuje kluczy ani cache innej aplikacji.

## Misja na dziś (lib/dailyMission.ts)

Kroki biorą się z rekomendacji obu silników — moduł tylko je wybiera:

1. **Dźwięki** — ta sama logika co „Misja na dziś” na dawnej stronie głównej
   Ligi: dźwięk z `recommendNext`, a obok link „albo słowa: …” z
   `recommendNextTopic`. Gdy wszystkie dźwięki są opanowane (`all-done`),
   krokiem są od razu słowa. Krok zalicza dzisiejsza sesja dźwięku **albo**
   słów, która naprawdę coś zrobiła (co najmniej `RULES.minScoredForStatus`
   zadań — ten sam próg co w misji Akademii; liczą się też zadania mówione bez
   oceny w trybie z rodzicem). Zrobiony krok zostaje z ✅ i nazwą tego, co
   zrobiono. Pod krokiem — tekst rekomendacji dla rodzica, jak dotąd.
2. **Tabliczka** — pierwszy krok misji Akademii (`lib/akademia/mission.ts`,
   bez zmian): lekcja „Liczymy co N”, gdy mission.ts ją stawia (zasada „lekcja
   przed nowymi faktami”, łącznie z `heldNewTable` i „jedna lekcja dziennie”),
   a w pozostałe dni trening. Stan „zrobione” liczy mission.ts. W dzień lekcji
   krokiem jest sama lekcja (trening nie jest wtedy obowiązkowy, zostaje w
   hubie Tabliczki) — misja ma dwa kroki, nie trzy.
3. **Dla chętnych** — więcej czytania: druga sesja dźwięków tego dnia
   (przed krokiem 1 powtórka najdawniej widzianego dźwięku, po nim to, co
   poleca Liga — zwykle następny dźwięk), wyraźnie oznaczona „⭐ Dla chętnych
   — nieobowiązkowe”. Misja jest wykonana po krokach 1 i 2. Do 24.09.2026 był
   tu dział Akademii; rodzic zmienił to po sprawdzianie czytania (dziecko dużo
   rozumie ze słuchu, a składanie liter w słowa dopiero się zaczyna). Działy
   Akademii są dalej pod ręką w sekcji Akademia.

Na ekranach dziecka nie ma dat, odliczania ani wzmianek o szkole w Anglii,
Year 4 czy czerwcu — plan z datami jest tylko w panelu rodzica (zakładka
Akademia).

## Panel rodzica (/rodzic)

Jedna bramka (przytrzymanie 3 s, klucz Ligi) i zakładki:

- **Dźwięki** — `components/rodzic/LigaPanel.tsx`: co dalej, postęp tematów i
  dźwięków, ostatnie sesje, ściąga szkolna, audio (audyt nagrań), studio
  głosek, imię i „Wyczyść postęp Dźwięków”.
- **Akademia** — `components/rodzic/AkademiaPanel.tsx`: plan MTC z datami,
  mapa tabliczki, próbne testy, tematy, nagrania (audyt), imię i „Wyczyść
  postęp Akademii”.
- **Synchronizacja i kopie** — `components/rodzic/SyncPanel.tsx`.
- **Raport dla Claude** — `components/rodzic/ReportPanel.tsx`: jeden tekst
  (raport Dźwięków + raport Akademii, każdy z własnego modułu), jeden przycisk
  „Kopiuj”, CSV obu działów.

Panele obu działów są wydzielone z paneli dawnych aplikacji bez zmian logiki;
zmieniły się tylko teksty odsyłające do innych zakładek. Imię dziecka jest
osobno w każdym dziale (każdy silnik ma własne `childName`, jak dotąd).

### Synchronizacja — jeden kod rodziny, dwa moduły

Każdy dział synchronizuje się **własnym, niezmienionym modułem** do własnej
skrzynki. Łączy je tylko kod rodziny: prowadzi Liga, Akademia idzie za nią
(tak było już w osobnych aplikacjach — `adoptFromLiga`). Karta w panelu
(`lib/familySync.ts`) woła publiczne funkcje obu modułów:

- **Włącz** → `liga.enableSync()` + `akademia.enableSync()` (Akademia bierze
  kod Ligi, `fromLiga`).
- **Wyłącz** → `liga.disableSync()` + `akademia.disableSync()` — żaden dział
  nie zostaje wysyłający do skrzynki.
- **Krótki kod** (wpisany) → szuflada Ligi; gdy tam nic nie ma — szuflada
  osobnej Akademii Ligi (kod pokazany jeszcze w dawnej Akademii też zadziała,
  a Dźwięki przejmą ten sam kod rodziny). Po sukcesie Akademia przechodzi na
  kod Ligi (`switchToLigaCode`).
- **Link parowania / QR** (`#sync=…`) → `components/SyncBridge.tsx` przekazuje
  kod obu działom przy pierwszym renderze, zanim magazyny same zajrzą do
  adresu (inaczej kod przejąłby tylko dział, który zdążyłby pierwszy).
- **Rozjechane stany** z czasów osobnych aplikacji (Akademia wyłączona
  ręcznie, Akademia na innym kodzie, Akademia sparowana bez Dźwięków) karta
  pokazuje wprost, z przyciskiem do wyrównania. Nic nie włącza się po cichu —
  wysłanie danych Akademii do skrzynki zawsze wymaga decyzji rodzica.

Kopie zapasowe: dwa pliki, jak dotąd — `liga-dzwiekow-postep-….json` i
`akademia-ligi-postep-….json`, każdy wczytywany przez własny magazyn z
własnymi pytaniami o reset i przywrócenie. Plik z niewłaściwego działu jest
rozpoznawany i odsyłany do właściwego przycisku.

„Pobierz najnowszą wersję” wyrejestrowuje tylko service worker o własnym
zakresie i kasuje tylko cache z własnym przedrostkiem (`lib/cachePrefix.ts`).

## Service worker (public/sw.js)

Jeden, oparty na sw.js Ligi (sw.js Akademii był jego kopią z innym
przedrostkiem i powłoką). Powłoka offline = strony Ligi (`/`, `/rodzic/`,
`/slownictwo/`, `/rymowanki/`) + huby Akademii (`/tabliczka/`,
`/tabliczka/trening/`, `/tabliczka/test/`, `/matematyka/`, `/czytanie/`,
`/polecenia/`). Manifest wdrożenia `deploy.json` obejmuje wszystkie nagrania,
także `audio/akademia/`.

Przedrostek cache wynika z zakresu SW (`cachePrefixFor`, ta sama funkcja w
`lib/cachePrefix.ts`):

| Zakres | Przedrostek |
| --- | --- |
| `/projekt-os-02` i lokalnie (pusty) | `liga-dzwiekow-` — nagrania zapisane na tabletach przez dawną Ligę zostają ważne |
| każdy inny, np. `/projekt-os-05` | `liga-test-<litery i cyfry adresu>-`, np. `liga-test-os05-` |

SW kasuje wyłącznie cache z własnym przedrostkiem — nigdy cudze
(`akademia-ligi-*`, wersji testowej, innych projektów).

Manifest: nazwa i `short_name` „Liga”, opis obu działów, ikony Ligi, **bez
pola `id`** — tożsamość instalacji liczy się ze `start_url`, więc Liga
zainstalowana na tablecie zostaje tą samą aplikacją, tylko z nową nazwą.

## Tryb testowy (NEXT_PUBLIC_TEST_MODE=1)

Ten sam kod wdrożony do repozytorium **projekt-os-05** buduje się jako wersja
testowa (`.github/workflows/deploy.yml` ustawia `NEXT_PUBLIC_TEST_MODE=1`,
gdy repozytorium nazywa się projekt-os-05). Stoi na tej samej domenie co
prawdziwa Liga, więc zasady są twarde — **wersja testowa nie może zmienić
prawdziwych danych dziecka ani skrzynki rodziny**:

- **localStorage** — skrypt w `<head>` (`lib/testModeScript.ts`, wykonuje się
  przed hydratacją i przed jakimkolwiek kodem aplikacji) podmienia metody
  `Storage.prototype` tak, że klucze `phonics.*` i `school.*` trafiają pod
  `beta.<klucz>`. Przy pierwszym uruchomieniu raz kopiuje prawdziwe wartości do
  kluczy beta (znacznik `beta.copied.v1`) — **bez kluczy `*.sync.*`**, żeby
  kopia nie niosła kodu rodziny. `key()`/`length` pokazują aplikacji tylko
  kopię, `clear()` czyści tylko kopię, zdarzenia `storage` są przemapowane
  (zmiany prawdziwych kluczy z innej karty są dla wersji testowej niewidoczne).
  Prawdziwe klucze nie są w trybie testowym ani zapisywane, ani kasowane.
- **IndexedDB** — nagrania rodzica w bazie `beta.liga-dzwiekow` z jednorazową
  kopią prawdziwej `liga-dzwiekow` (znacznik `beta.recordings-copied.v1`);
  `lib/recordings.ts` czeka na kopię przed pierwszym otwarciem bazy. Prawdziwą
  bazę tylko czytamy — i otwieramy wyłącznie, gdy `indexedDB.databases()`
  potwierdzi, że istnieje (otwarcie nieistniejącej bazy by ją utworzyło).
- **Synchronizacja wyłączona w obu działach** — strażnicy `TEST_MODE` w obu
  modułach sync: brak kodu rodziny, `adoptFromHash`, `adoptFromLiga`,
  `switchToLigaCode`, krótkie kody i zapytania wyłączone. Dodatkowo skrypt z
  `<head>` odrzuca każde zapytanie do `textdb.dev` (fetch, XHR, sendBeacon).
  W panelu zamiast karty synchronizacji jest wyjaśnienie i przycisk „Zacznij
  od świeżej kopii” (kasuje wyłącznie `beta.*` i bazę beta; po przeładowaniu
  kopia robi się od nowa).
- **Widać, że to test** — pasek „Wersja testowa — działa na kopii danych;
  zmiany nie trafiają do prawdziwej Ligi ani Akademii” na każdej stronie,
  nazwa „Liga (test)” w tytule i manifeście, kopie zapasowe z przedrostkiem
  `TEST-` (żeby nie wczytać ich do prawdziwej Ligi).
- **Service worker** wersji testowej ma własny zakres (`/projekt-os-05/`) i
  własny przedrostek cache (`liga-test-os05-`).

Ograniczenia: sessionStorage (bramka panelu, ostatnia zakładka) jest wspólny
dla kart tej samej domeny — to tylko wygoda interfejsu, nie dane. Kopia
danych robi się przy pierwszym uruchomieniu wersji testowej na danym
urządzeniu; późniejsze zmiany w prawdziwej Lidze do niej nie trafiają, dopóki
rodzic nie kliknie „Zacznij od świeżej kopii”.

Lokalnie: `MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/projekt-os-05 NEXT_PUBLIC_TEST_MODE=1 npm run build`.

## Przełączenie

1. Przegląd gałęzi `polaczenie`, potem merge `polaczenie` → `main` w
   repozytorium angielski (projekt-os-02) i push. GitHub Actions buduje i
   publikuje os-02.
2. Urządzenia same pobierają nową wersję (service worker): nazwa zmienia się
   na „Liga”, dane obu działów są od razu widoczne (te same klucze na tej
   samej domenie). Nic nie trzeba przeinstalowywać ani przenosić.
3. Synchronizacja działa dalej: Dźwięki do skrzynek `liga-dzwiekow-…`,
   Akademia do `akademia-ligi-…`, tym samym kodem rodziny. Urządzenia jeszcze
   z osobną Akademią (os-04) synchronizują się z połączoną Ligą przez te same
   skrzynki.
4. Później (przygotowuje lider): os-04 dostaje stronę przekierowującą na
   os-02 i service worker, który usuwa **tylko** swoje cache `akademia-ligi-*`
   i się wyrejestrowuje. Danych Akademii nie trzeba nigdzie przenosić — są w
   localStorage tej samej domeny.
5. Wersja testowa: ten sam kod do repozytorium projekt-os-05 (z włączonymi
   Pages) — zbuduje się w trybie testowym.

## Cofnięcie

Dane są zgodne w obie strony, bo połączona aplikacja zapisuje dokładnie to, co
zapisywały osobne aplikacje (te same klucze i formaty; niczego nie migruje).

1. W repozytorium angielski: `git revert -m 1 <commit scalający>` na `main`
   (albo przywrócenie `main` do stanu sprzed scalenia) i push — Actions
   wdrożą dawną Ligę Dźwięków pod os-02.
2. Jeśli os-04 zdążyła dostać przekierowanie: cofnąć tamten commit w
   repozytorium szkola i wdrożyć — wraca dawna Akademia Ligi.
3. Na urządzeniach nic nie ginie: dawna Liga czyta `phonics.*` i
   `liga-dzwiekow`, dawna Akademia czyta `school.*` — w tym sesje zrobione w
   połączonej aplikacji. Cache `liga-dzwiekow-v1` przejmuje z powrotem SW
   dawnej Ligi (nagrania Akademii z niego usunie jej manifest wdrożenia —
   to tylko pamięć podręczna).
4. Po połączonej aplikacji zostają nieszkodliwe drobiazgi: `phonics.parent-tab.v1`
   w sessionStorage (znika z zamknięciem karty) oraz — tylko tam, gdzie
   używano wersji testowej — klucze `beta.*` i baza `beta.liga-dzwiekow`
   (żadna aplikacja ich nie czyta).

## Sprawdzenie

- `npx tsc --noEmit -p .`
- `MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/projekt-os-02 npm run build` oraz
  wersja testowa jak wyżej.
- `npm run audit` (Dźwięki — 4 znane ostrzeżenia) i `npm run audit:akademia`
  („✓ Treść spójna.”).
