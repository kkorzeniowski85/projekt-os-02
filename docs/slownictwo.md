# Tor 2 — słownictwo, zwroty i kolokacje

Drugi tor nauki, niezależny od czytania. Tor 1 (phonics) uczy DEKODOWAĆ zapis;
tor 2 uczy ROZUMIEĆ ze słuchu i MÓWIĆ. Oba można prowadzić równolegle, bo
ćwiczą różne rzeczy i mają osobny postęp.

Wejście: **Baza → „Słowa i zwroty"** albo wprost `/slownictwo`.

## Zasada, na której stoi cały moduł

**Żadne pytanie nie wymaga czytania po angielsku.** Pytaniem jest zawsze
nagranie albo polski tekst, a odpowiedzią obrazek, polski opis albo krótkie
słowo. Angielski zapis pokazuje się obok — dla dziecka, które już czyta — ale
nigdy jako warunek rozwiązania.

Bez tej zasady moduł byłby drugim torem czytania. Dziecko ma tu ćwiczyć ucho,
zanim jeszcze rozłoży słowo na litery.

## Kolejność tematów to kolejność PILNOŚCI, nie trudności

Pierwsze cztery tematy to przetrwanie w szkole. Nic nie jest zablokowane —
jeśli dziecko idzie do szkoły pojutrze, można zrobić same „Ratunek!" i „Kiedy
coś boli", a resztę zostawić na później.

| # | Temat | Po co |
| --- | --- | --- |
| 1 | Ratunek! | Zdania na wypadek, gdy dziecko nic nie rozumie |
| 2 | Co mówi nauczyciel | Polecenia w klasie — wyłącznie do zrozumienia |
| 3 | Dzień w szkole | Rytuały dnia bez polskich odpowiedników: assembly, wet play, home time |
| 4 | Zagadać do dzieci | Wejście do grupy rówieśniczej |
| 5 | Grzeczność | „please" i „thank you" — w UK to sprawa społeczna |
| 6 | Poranek | Rutyna dnia, gęsta od kolokacji |
| 7 | Obiad w szkole | Stołówka i słownictwo czysto brytyjskie |
| 8 | Kiedy coś boli | Bezpieczeństwo — powiedzieć dorosłemu, że coś jest nie tak |
| 9 | Ubranie i pogoda | jumper, wellies, PE kit — słowa z codziennego dnia |
| 10 | Jak się czuję | Nazwać to, co w środku |
| 11 | Rzeczy w szkole | Przybory i polecenia okołozadaniowe |

**Trzy zdania warto przećwiczyć do automatyzmu przed pierwszym dniem:**
„I don't understand", „Can you help me, please?", „Can I go to the toilet,
please?".

## Cztery rodzaje materiału i ich ćwiczenia

Materiał dzieli się na cztery rodzaje, bo uczą się inaczej:

| Rodzaj | Co to | Ćwiczenie |
| --- | --- | --- |
| `words` | słowo + obrazek | „Które słowo słyszysz?" (nagranie → obrazek) |
| `phrases` | zwroty, które dziecko **mówi** | „Kiedy to mówisz?" + scenka + „Powiedz to na głos" |
| `commands` | zwroty, które dziecko tylko **rozumie** | „Nauczyciel mówi… co robisz?" + „Pokaż ruchem!" + „Teraz ty rządzisz" |
| `situations` (opcjonalne) | „What do you do when…? Show me!" — dziecko **pokazuje** swoją reakcję | „Co robisz, gdy…? Pokaż!" zamiast „Pokaż ruchem!" z poleceń |
| `collocations` | które słowa chodzą razem | „Które słowo pasuje?" (luka w wyrażeniu) |

`situations` mają tematy, w których „polecenia" to pytania albo informacje
nauczycielki („Are you OK?", „It's wet play today", „Cheer up!") — czegoś takiego
nie da się wykonać ruchem, a własną reakcję („podnoszę rękę i mówię *Can you
help me, please?*") już tak. Gdy temat ma sytuacje, „Pokaż ruchem!" bierze je
zamiast poleceń, wzorcowa reakcja (`actionPl`) jest schowana do „Pokaż
podpowiedź" albo do oceny rodzica, a „Teraz ty rządzisz" w tym temacie odpada
(pytania-sytuacji dziecko nie wydaje). Polecenia-pytania zostają w `commands`,
bo w „Nauczyciel mówi… co robisz?" (wybór reakcji) działają dobrze. Rodzic może
wszystkie ćwiczenia ruchowe wyłączyć w panelu (`lib/settings.ts` → `noMovement`).

### Dlaczego `phrases` i `commands` to osobne rzeczy

To najważniejsza decyzja w tym module. Polecenia nauczyciela („line up", „tidy
up", „get changed for PE") dziecko ma **rozumieć**, a nie wypowiadać — nigdy
nie będzie ich mówić, bo nie jest nauczycielem. Dlatego przy poleceniach nie ma
ćwiczenia mówionego, a pytanie idzie w odwrotną stronę niż przy zwrotach
własnych: słychać angielski, wybiera się czynność.

Dziecko może przez pierwsze tygodnie prawie nic nie mówić i to normalny etap.
Ważniejsze, żeby wiedziało, co ma zrobić.

### Dlaczego kolokacje są osobnym ćwiczeniem

Dziecko szybciej przyswaja gotowy klocek („put your coat on") niż trzy słowa do
złożenia, a większość błędów polskiego ucha to kalki właśnie na tym poziomie.
Dystraktory **nie są losowe** — to konkretne kalki z polskiego:

- `brush your teeth` — po polsku zęby MYJEMY, więc kusi „wash",
- `do your homework` — po polsku „robić", więc kusi „make",
- `look for` — „find" znaczy ZNALEŹĆ, nie szukać,
- `tell the teacher` vs `say sorry` — polskie „powiedzieć" to say / tell / speak.

Pole `whyPl` przy kolokacji tłumaczy pułapkę **rodzicowi** (widoczne w trybie
„z rodzicem" po odpowiedzi), nie dziecku.

Po odpowiedzi — także po błędnej — odtwarza się zawsze **poprawna całość**.
Ostatnie, co dziecko słyszy, ma być wersją prawidłową; odegranie wybranego
błędnie słowa utrwalałoby kalkę.

## Wariant języka: brytyjski

Tam, gdzie amerykański różni się na tyle, że dziecko usłyszy w szkole co innego
niż w bajkach, przy słowie jest `notePl` dla rodzica. Najbardziej codzienne
różnice w materiale: `rubber` (gumka), `jumper` (sweter), `trainers` (buty
sportowe), `wellies` (kalosze), `bin` (kosz), `peg` (haczyk na kurtkę),
`playtime` (przerwa), `biscuit` (ciastko) oraz odwrotność `chips` (frytki) /
`crisps` (chipsy).

## Nagrania

Moduł korzysta z dwóch katalogów:

- **pojedyncze słowa** → `public/audio/words/` — ten sam katalog co tor 1, więc
  słowo wspólne dla obu torów ma jeden plik,
- **całe zwroty i polecenia** → `public/audio/phrases/`, nazwa pliku powstaje
  przez `audioSlug()` z `lib/curriculum/vocab.ts`
  (`"Can I go to the toilet, please?"` → `can-i-go-to-the-toilet-please.mp3`).

```bash
npm run audio
```

Jeden przebieg obsługuje oba tory i dogrywa tylko brakujące pliki.

**Brak nagrania NIE blokuje ćwiczenia.** Bez pliku zwrot czyta syntezator mowy
urządzenia i jest to rozwiązanie uczciwe, a nie namiastka: całe zdania synteza
wymawia sensownie — inaczej niż pojedyncze głoski, gdzie aplikacja świadomie
milczy (patrz [audio.md](audio.md)). Nagranie brytyjskiego głosu jest lepsze i
wygrywa automatycznie, gdy się pojawi.

`audioSlug` mieszka w `vocab.ts`, a nie w `lib/audio.ts`, bo generator nagrań
jest zwykłym skryptem Node i musi używać **dokładnie tej samej** funkcji —
inaczej aplikacja szukałaby innych nazw, niż generator zapisał. `vocab.ts` nie
importuje niczego, więc da się go wczytać poza przeglądarką.

Kilka wypowiedzi celowo dzieli jeden plik: polecenie „Tidy up." i kolokacja
„tidy up" to ta sama wypowiedź, więc ma brzmieć tak samo.

## Postęp

Tor 2 ma własną mapę postępu (`ProgressState.topics`), niezależną od dźwięków,
ale **te same progi** co tor 1 (`lib/progress/rules.ts`): 80% przez dwie sesje
= opanowany, poniżej 60% przez dwie = trudny.

Sesje i próby obu torów leżą w jednym dzienniku i rozróżnia je pole `track`
(`"phonics"` / `"vocab"`). Rekordy zapisane przed powstaniem toru 2 tego pola
nie mają i znaczą `"phonics"` — dlatego numer wersji schematu **nie** został
podniesiony. Podniesienie go kazałoby starszym urządzeniom odrzucać nowe pliki,
zanim same się zaktualizują, czyli zatrzymałoby synchronizację dokładnie wtedy,
gdy jest potrzebna. Wersję podnosimy dopiero przy zmianie, która psuje odczyt.

Nagrodą toru 2 jest **odznaka tematu**, a nie postać: drużyna zostaje nagrodą
za czytanie, żeby dwie waluty motywacji się nie mieszały.

## Jak dodać temat

1. Dopisz wpis do `TOPICS` w `lib/curriculum/vocab.ts` — kolejność w tablicy to
   kolejność pilności, więc nowy temat wstaw tam, gdzie należy, a nie na koniec.
2. Trzymaj się norm: 6–8 słów, 4–6 zwrotów, 3+ poleceń, 4 kolokacje. Przy
   mniejszej liczbie pozycji ćwiczenie dobierze dystraktory z innych tematów —
   zadziała, ale myli mniej sensownie.
3. Kolokacja: `gap` musi mieć **dokładnie jedno** `___`, `answer` musi być
   **jednym słowem**, a `gap` z wstawioną odpowiedzią musi dać dokładnie `en`.
4. Emoji wyłącznie sprzed Unicode 12 (2019) — nowsze na starszych tabletach są
   pustym prostokątem.
5. Uruchom audyt i generator:

```bash
npm run audit
```

```bash
npm run audio
```

Trasa `/slownictwo/<id>` i kafelek na liście pojawią się same.

## Mówienie

Stan wyjściowy dziecka: dużo rozumie ze słuchu, prawie nie mówi, po angielsku
jeszcze nie czyta. Priorytet rodzica: **rozruszać mówienie przy niskiej
stawce**. Stąd cztery ćwiczenia w torze 2 (kod: `components/session/Speaking.tsx`,
`VocabRunner.tsx`), wszystkie zaczynające się od ucha — angielski tekst pojawia
się najpóźniej przy pierwszym odtworzeniu, nigdy jako warunek.

- **Echo („Mów ze mną”, shadowing).** Nagranie → pauza na powtórzenie (trzy
  gasnące kropki, ok. 1,2 × długość nagrania, 1,5–4 s) → nagranie jeszcze raz.
  Powtarzanie tuż za wzorem to najniższy próg wejścia w mówienie: nie trzeba
  niczego układać, wystarczy odbić usłyszany kształt zdania. Drugie odtworzenie
  jest po to, żeby ostatnia wersja, jaką dziecko słyszy, była poprawna.
- **Gotowe zwroty (formulaic chunks).** Z cichego okresu wychodzi się przez
  całe, gotowe kwestie użyte w sytuacji („Can I go to the toilet, please?”),
  nie przez składanie zdań z reguł. Dlatego jednostką mówienia jest zwrot i
  scenka, nie słowo.
- **Scenka jako ćwiczenie dziecka** (wcześniej: ramka dla rodzica). Faza 1:
  cała rozmowa do posłuchania, kwestie podświetlają się po kolei, polski pod
  spodem (domyślnie widoczny — dziecko nie czyta po angielsku), stuknięcie w
  kwestię odtwarza ją. Faza 2 „Twoja kolej”: aplikacja gra kwestie pozostałych
  ról (lektor, nagrania), przy kwestii dziecka staje i czeka. Bohater tematu
  zapowiada scenkę jednym polskim zdaniem. Po kwestii dziecka rodzic ocenia
  („Powiedział sam / Z pomocą”), a w trybie samodzielnym dziecko stuka
  „Powiedziałem” bez oceny. Po „Z pomocą” kwestia gra jeszcze raz w echu
  (recast) — **ostatni ruch dziecka ma być właściwy**. W sesji: 1 scenka
  (Ratunek: 2), zaraz po „Kiedy to mówisz?”, w obu trybach; poza sesją
  wszystkie scenki tematu pod „🎭 Scenki” (bez punktów, bez zapisu).
- **Drabinka podpowiedzi (fading scaffolding).** Poziom zwrotu liczy się z
  historii ocen rodzica (`lib/progress/rules.ts` → `speakingLevel`): start 0
  (echo — wzór gra od razu, tekst widoczny), dwa kolejne „Powiedział sam” →
  poziom wyżej (1: widać sytuację i znaczenie, angielski po „Podpowiedz”;
  2: tylko sytuacja, znaczenie i angielski za przyciskami), każde „Z pomocą” →
  poziom niżej. Próby bez oceny poziomu nie ruszają. Schemat danych się nie
  zmienia — poziom da się zawsze przeliczyć. Dziecko poziomu nie widzi; rodzic
  widzi w panelu i raporcie („Mówienie”).
- **Odwrócone TPR („Teraz ty rządzisz”).** Dziecko MÓWI polecenie z
  `commands`, rodzic je wykonuje. Skutek własnych słów — rodzic naprawdę wstaje
  — jest najsilniejszą nagrodą za odezwanie się. Zamiana ról to klasyczny krok
  TPR; nie uczy „roli nauczyciela”, uczy odwagi mówienia. Tylko z rodzicem.
- **Rozgrzewka „trzy zdania, które ratują”.** Pierwszy ekran każdej sesji:
  „I don't understand.”, „Can you help me, please?”, „Can I go to the toilet,
  please?” w echu, z polskim znaczeniem. Bez oceny, bez zapisu, „Dalej” od razu
  — odruch buduje się liczbą luźnych powtórzeń, nie sprawdzianem.

Zasady dla rodzica (widoczne w panelu): cichy okres jest normalny; po błędzie
powtórz poprawnie od niechcenia zamiast poprawiać (recast); po pytaniu odczekaj
5 s; jedno słowo to też odpowiedź; chwal próbę; te same zdania używajcie w domu;
zamieniajcie się rolami.

Wszystkie próby mówienia zapisują się jako `exercise: "say"` z `item` = tekst
wypowiedzianej kwestii (zwrot, riposta ze scenki, polecenie z „Teraz ty
rządzisz”); `correct` to ocena rodzica albo `null` w trybie samodzielnym.
**Aplikacja nigdy nie nagrywa ani nie ocenia mowy dziecka** — jedynym
„sędzią” jest rodzic dwoma przyciskami. Nowe teksty interfejsu są po polsku;
wszystkie angielskie kwestie mają nagrania z generatora, nic nie wymaga TTS.

## Czego ten moduł świadomie nie robi

- **Nie ocenia wymowy dziecka.** Ćwiczenie „Powiedz to na głos" ocenia rodzic
  (tryb wspólny) albo nikt (tryb samodzielny). Decyzja z briefu zostaje w mocy:
  mikrofon uruchamia się w aplikacji w dokładnie jednym miejscu — w studiu
  głosek, przez dorosłego.
- **Nie uczy wypowiadania poleceń nauczyciela** — patrz wyżej.
- **Nie podaje spolszczonej transkrypcji wymowy.** Zapis typu „ołrindż" utrwala
  błędy, które trudno potem odkręcić. Wymowa idzie ze słuchu.
- **Nie dubluje „red words" z toru 1.** Tor 1 ma własne red words przy lekcjach.
  Warto wiedzieć, że lista *common exception words* z angielskiej podstawy
  programowej (Year 1) i lista Red Words w metodzie Read Write Inc. **nie
  pokrywają się dokładnie**, a szkoły mają własne, etapowe wersje — jedyne pewne
  źródło to lista z konkretnej placówki. Warto o nią poprosić.
