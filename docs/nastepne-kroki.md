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

**Przenoszenie postępu między urządzeniami działa już ręcznie** (tryb rodzica →
„Postęp między urządzeniami"): zapis pliku JSON → Dysk Google → wczytanie na
drugim urządzeniu. Scalanie to unia sesji po `id` z odtworzeniem stanu
pochodnego (`lib/progress/merge.ts`) — idempotentne, nic nie nadpisuje,
kolejność wczytań bez znaczenia. Ta sama funkcja scalająca posłuży przyszłej
synchronizacji automatycznej.

Wyjątki od „samej unii” (podstawa — `resetTs`, `restoreTs`, okna przy wczytaniu
kopii, imię po `childNameTs` — jest wspólna z Akademią Ligi; różnice niżej):

- **Wyczyść postęp** zapisuje znacznik `resetTs` zamiast samego pustego stanu.
  Sesje i próby starsze niż najnowszy reset odpadają przy każdym scaleniu
  (skrzynka, inne urządzenia, stary plik), a stan dźwięków, tematów i postaci
  odtwarza się z tego, co zostało — inaczej wyczyszczony postęp wracał z
  chmury.
- **Przywrócenie kopii sprzed resetu** jest jawne: przy wczytaniu pliku z
  sesjami sprzed wyczyszczenia panel pyta rodzica. Zgoda zapisuje `restoreTs`.
  Oba znaczniki scalają się jako maksimum, a granica odcięcia to `resetTs`,
  gdy reset był później niż przywrócenie, w przeciwnym razie brak granicy.
  Plik z nowszym resetem niż urządzenie wymaga potwierdzenia z liczbą sesji,
  które znikną. Plik z przywróceniem późniejszym niż reset zrobiony na tym
  urządzeniu też pyta; „Anuluj” wczytuje go bez znaczników (lokalny reset
  zostaje w mocy). Podgląd liczy się na najnowszym stanie, bo w trakcie
  odczytu pliku synchronizacja mogła przynieść reset.
- **Reset należy do rodziny, w której go zrobiono.** Kod rodziny z chwili
  resetu/przywrócenia leży osobno (`phonics.sync.markers.v1`, nie w pliku
  kopii — kod to klucz do skrzynki). Gdy urządzenie trafia do innej rodziny
  (link z QR, krótki kod, włączenie synchronizacji po resecie bez niej),
  przed pierwszym scaleniem zdejmuje swoje znaczniki. Inaczej wyczyszczenie
  próbnych sesji na nowym tablecie kasowało po sparowaniu historię całej
  rodziny.
- **Reset nie obejmuje urządzeń dołączonych później.** W chwili zmiany kodu
  (QR, krótki kod, włączenie) urządzenie zapisuje, że dołącza
  (`phonics.sync.joining.v1`) — chyba że wraca do rodziny, w której już
  było. Przy pierwszym scaleniu ze skrzynką, gdy reset rodziny odciąłby
  sesje z tego urządzenia, zachowujemy je przywróceniem (`restoreTs`), a
  panel mówi rodzicowi, ile sesji zostało i że trafią na pozostałe
  urządzenia. Bez tego telefon z historią, podłączony do tabletu, na którym
  wyczyszczono próbne sesje, po cichu tracił cały postęp. Koszt: wrócą też
  sesje sprzed tamtego resetu z urządzeń rodziny, które od resetu nie były
  w sieci (odzyskiwalne kolejnym „Wyczyść postęp”, w przeciwieństwie do
  skasowanej historii). Dołączenia nie wnioskujemy z braku znacznika
  rodziny, bo urządzenie tuż po aktualizacji aplikacji też go nie ma, a
  reset jego rodziny ma je objąć.
- **Obieg zaczęty dla innej rodziny** (np. „Podłącz” w trakcie wolnego
  pobierania) jest odrzucany, a obieg nowej rodziny rusza od razu — inaczej
  spóźniona odpowiedź starej skrzynki przywracała zdjęty reset i czyściła
  nową rodzinę.
- **Imię** wybiera się po czasie ostatniej zmiany imienia (`childNameTs`), a
  nie po stanie z późniejszą sesją.
- **Zegary.** Nowy znacznik (reset, przywrócenie, imię) jest zawsze późniejszy
  od znanego już znacznika tego rodzaju (i reset — od najnowszego rekordu, z
  limitem doby naprzód), a sesja kończona na urządzeniu, które zna już reset
  „z przyszłości”, przesuwa się tuż za niego i za ostatnią zapisaną sesję
  (żeby kolejność sesji, a z nią ostatni wynik dźwięku, się nie odwracała). Nie da się naprawić przypadku, w którym
  urządzenie jeszcze NIE zna zdarzenia z urządzenia ze spieszącym się zegarem:
  sesja zrobiona offline po resecie z „przyszłości” odpadnie, a reset zrobiony
  offline tuż po przywróceniu z „przyszłości” przegra z tym przywróceniem.
  Wymaga to zgodnych zegarów (automatyczny czas w ustawieniach urządzeń).
- **Różnice względem Akademii Ligi** (stan na wrzesień 2026): Akademia ma
  `resetTs`/`restoreTs`, okna (a) i (b) przy wczytaniu kopii i imię po
  `childNameTs`, ale nie ma: rodziny znaczników (`phonics.sync.markers.v1`),
  zachowania historii przy dołączeniu, odrzucania obiegu starej rodziny,
  okna dla kopii z przywróceniem późniejszym niż lokalny reset
  (`withoutMarkers`), przesuwania sesji za reset „z przyszłości” ani resetu
  liczonego od najnowszego rekordu. Przeniesienie ich do Akademii to osobne
  zadanie — do tego czasu te przypadki zachowują się w obu aplikacjach
  inaczej.

Droga do pełnej automatyzacji bez własnego serwera: **Google Drive API**
(zapis pliku postępu w appDataFolder konta rodzinnego, odczyt i scalenie przy
starcie aplikacji). Wymaga jednorazowo od rodzica: projekt w Google Cloud
Console → OAuth Client ID (typ: Web application) → identyfikator wkleja się do
konfiguracji aplikacji. Bez tego kroku automatyczna synchronizacja nie ruszy —
Claude nie może go wykonać, bo wymaga zalogowania na konto Google rodzica.

## Kolejka funkcji (propozycja)

1. ~~**Nagrania głosek**~~ — **zrobione inaczej**: 73 głoski wycięte
   automatycznie z nagrań słów (`npm run audio:phonemes`); studio głosek
   zostało jako nadpisanie własnym głosem.
2. ~~**Kolejne dźwięki**~~ — **zrobione**: komplet 60 lekcji (cała sekwencja
   RWI, łącznie z pojedynczymi literami Set 1).
3. **Red words jako osobne ćwiczenie** — teraz tylko pokazują się na końcu
   sesji. Zasługują na własny, krótki tryb („rozpoznaj w 5 sekund”).
4. ~~**Tor 2: słuchanie i słownictwo**~~ — **zrobione**: 11 tematów
   (słowa, zwroty, polecenia nauczyciela, kolokacje), osobny typ sesji, bez
   czytania. Patrz [slownictwo.md](slownictwo.md).
5. **Backend + synchronizacja** — dopiero gdy dziecko realnie używa aplikacji na
   więcej niż jednym urządzeniu. Wcześniej to praca bez zwrotu.
6. **Alien words** (nonsense words z Phonics Screening Check) — ćwiczenie czystego
   dekodowania. Przydatne bliżej wyjazdu, nie teraz.

## Czego świadomie nie robimy

- Nagrywania i oceny wymowy dziecka (decyzja z briefu).
- Kar, timerów, znikających serc i innych mechanik pod presją.
- Postaci wzorowanych na chronionych prawem autorskim bohaterach.
