# Audio — stan i jak dodać brakujące nagrania

## Stan na 3 sierpnia 2026

| Co | Stan | Czym zrobione |
| --- | --- | --- |
| **Słowa** (395 plików) | ✅ gotowe | synteza, brytyjski głos neuronowy `en-GB-SoniaNeural`, tempo −15% |
| **Czyste głoski** (62 pliki) | ✅ gotowe, do odsłuchania | wycięte z nagrań słów (`npm run audio:phonemes`) |

Nagrania słów leżą w `public/audio/words/`. Aplikacja używa ich automatycznie
zamiast głosu z urządzenia.

**Nikt tych plików jeszcze nie odsłuchał** — powstały maszynowo. Zanim usiądziesz
z dzieckiem, przejdź przez listę w **Tryb rodzica → Audio** i kliknij ▶ przy
każdym słowie. Plik, który brzmi źle, po prostu skasuj: aplikacja wróci wtedy do
głosu z urządzenia, bez żadnej konfiguracji.

## Skąd wzięły się głoski

Nie z syntezatora — z **wycięcia fragmentów prawdziwych nagrań słów**. Głoska
/ʃ/ jest fizycznie obecna na początku nagrania słowa „ship", więc zamiast prosić
syntezator o coś, czego nie umie, bierzemy ją stamtąd. To ten sam brytyjski
głos i autentyczna wymowa.

Granice wyznacza analiza sygnału (`scripts/extract-phonemes.mjs`), bez ręcznego
zaznaczania: dla każdej ramki ~10 ms liczona jest energia w paśmie niskim i
wysokim, a z nich „samogłoskowość". Spółgłoska nagłosowa to odcinek od początku
mowy do granicy o największej zmianie cech; samogłoska to otoczenie
najsilniejszego wierzchołka. Skrypt sam kontroluje wynik (długość, pasmo) i
oznacza podejrzane wycinki.

Wyniki dla obecnego zestawu — wyraźny rozdział między szczelinowymi (energia w
wysokich) a samogłoskami (energia w niskich), czyli cięcia trafiły tam, gdzie
powinny:

| głoska | źródło | długość | niskie/całość |
| --- | --- | --- | --- |
| sh | ship | 160 ms | 0.10 |
| ch | chip | 120 ms | 0.16 |
| f | fish | 80 ms | 0.25 |
| t | top | 90 ms | 0.27 |
| p | pen | 70 ms | 0.39 |
| d | dish | 40 ms | 0.53 |
| m / w / r | much / wish / rich | 50-60 ms | 0.70-0.72 |
| a / e / i / o / u | cat / bed / dish / top / sun | 80-200 ms | 0.54-0.70 |

**Czego ta kontrola nie zastąpi:** liczby mówią, że wycięto właściwy *rodzaj*
dźwięku, ale nie że brzmi on dobrze. Przesłuchaj głoski w trybie rodzica przed
pierwszą sesją. Zła głoska = nagraj ją swoim głosem (nagranie własne ma
pierwszeństwo) albo skasuj plik — wtedy aplikacja wraca do „wymawia rodzic".

Ponowne wycięcie (np. po dodaniu nowych słów):

```bash
npm run audio:phonemes
```

## Dlaczego nie da się ich zsyntezować wprost

Żeby syntezator wymówił *dźwięk* `p`, a nie *nazwę litery* („pi”), trzeba podać
mu zapis fonetyczny:

```xml
<phoneme alphabet="ipa" ph="p">p</phoneme>
```

Usługa mowy Microsoft Edge (ta, która robi słowa i nie wymaga żadnego klucza)
**nie obsługuje tego tagu** — zrywa połączenie. Sprawdzone na wariantach IPA i
SAPI. Zostaje więc wybór: albo nagrania z prawdziwym zapisem fonetycznym, albo
zgadywanie. Zgadywania nie robimy — wzorzec „py” zamiast `p` utrwala dokładnie
ten błąd, którego uczy się unikać w phonics.

Dlatego głoski powstają przez wycinanie (wyżej), a nie przez syntezę. Gdyby
kiedyś zabrakło pliku dla jakiejś głoski, aplikacja zachowa się uczciwie:
kawałek słowa przy sklejaniu **zamilknie** i pokaże „🎤 wypowiada rodzic”, a
ekran wprowadzenia odtworzy brytyjskie nagranie przykładowego słowa, mówiąc
wprost, że to namiastka.

## Jak dorobić głoski

### Droga 0: wczytaj gotowe pliki na urządzenie (z Dysku, offline)

**Tryb rodzica → Studio głosek → „Wczytaj pliki głosek".** Wskazujesz pliki
`sh.wav`, `ch.wav`… (można wszystkie naraz) — z Dysku Google, z pamięci
tabletu, skądkolwiek. Lądują w pamięci urządzenia i działają natychmiast, także
bez internetu.

Po co, skoro pliki i tak jadą przez GitHub: to jedyna droga dostarczenia
dźwięków, gdy publikacja nie działa (np. awaria GitHuba) albo gdy nie chcesz
czekać. Dopasowanie idzie po nazwie pliku, więc nazw nie wolno zmieniać. Pliki
o innych nazwach są pomijane, więc zaznaczenie całego folderu niczego nie
zepsuje.

Uwaga: wczytane pliki są **per urządzenie** (jak nagrania własne) i mają
pierwszeństwo przed plikami z internetu.

### Droga 1: nagraj sam w aplikacji

**Tryb rodzica → Studio głosek.** Przy każdej głosce są trzy rzeczy w tej
kolejności:

1. **🔊 wzorzec** — przykładowe słowo brytyjskim głosem. Posłuchaj kilka razy,
   zanim nagrasz. Nagrywanie „na ślepo" utrwala polski akcent tam, gdzie
   najbardziej przeszkadza.
2. **● nagraj** — mikrofon włącza się na maksymalnie 3 sekundy i od razu się
   wyłącza. Nagranie odtwarza się natychmiast, więc słyszysz, co zapisałeś.
3. **▶ głoska / 🗑** — odsłuchaj albo skasuj i nagraj jeszcze raz.

Przy trudniejszych głoskach studio pokazuje podpowiedź pisaną pod polskie ucho
(`th`, angielskie `r`, `w`, `u`, spółgłoski zwarte).

Nagrania trafiają do sesji dziecka natychmiast — także do kawałków słów przy
sklejaniu, które bez nagrania milczą.

**Ograniczenie:** nagranie siedzi w przeglądarce tego urządzenia (IndexedDB).
Nie przeniesie się samo na tablet i zniknie przy czyszczeniu danych
przeglądarki. Żeby było wszędzie i na stałe: kliknij **⤓** przy nagraniu i
wrzuć pobrany plik do `public/audio/phonemes/`. Aplikacja czyta stamtąd pliki
`.mp3`, `.webm`, `.m4a` i `.wav`, więc nie trzeba nic konwertować.

**Nagrywa dorosły, nie dziecko.** Decyzja z briefu o nienagrywaniu dziecka i o
braku automatycznej oceny wymowy zostaje w mocy — mikrofon uruchamia się tylko
w tym jednym miejscu, po kliknięciu, i nic nie wychodzi poza urządzenie.

### Droga 2: klucz Azure Speech (kilka minut, próg darmowy)

Azure Speech obsługuje `<phoneme>`. Ten sam głos, ten sam skrypt:

```bash
npm run audio
```

wystarczy uruchomić z ustawionymi zmiennymi:

```powershell
$env:AZURE_SPEECH_KEY = "twój-klucz"
$env:AZURE_SPEECH_REGION = "westeurope"
```

Zapisy IPA dla wszystkich dźwięków RWI są już w `lib/curriculum/ipa.ts`.

**Uwaga na spółgłoski zwarte** (`p`, `b`, `t`, `d`, `k`, `g`): głoska w izolacji
jest dla nich z natury sztuczna. Te pliki odsłuchaj najuważniej i skasuj, jeśli
słychać doklejoną samogłoskę.

### Droga 3: nagranie native speakera (najlepsza jakość)

Native speaker albo materiały RWI/Oxford Owl. Pliki MP3, nazwane
identyfikatorem dźwięku, do `public/audio/phonemes/`:

```
public/audio/phonemes/sh.mp3      ← dźwięk, nie nazwa litery
public/audio/phonemes/oo-look.mp3 ← warianty tego samego zapisu mają własne id
```

Identyfikatory są w `lib/curriculum/sounds.ts` (pole `id`). Panel rodzica
pokazuje pełną listę brakujących plików.

Przy materiałach RWI/Oxford Owl sprawdź warunki licencji, zanim wrzucisz pliki
do aplikacji — nawet prywatnej.

## Muzyka zwycięstwa (opcjonalnie)

Na koniec sesji gra krótka fanfara syntezowana w przeglądarce (oryginalna
melodia, bez praw autorskich). Żeby podłożyć własną muzykę, wrzuć plik
`public/audio/celebration.mp3` (albo `.webm`/`.m4a`/`.wav`) — aplikacja użyje
go automatycznie zamiast syntezy. Krótki utwór (2-5 s) sprawdzi się najlepiej,
bo gra przy każdym ukończeniu sesji.

## Generowanie nagrań

```bash
npm run audio
```

- domyślnie tworzy tylko brakujące pliki,
- `npm run audio -- --force` nadpisuje wszystko,
- `npm run audio -- --voice en-GB-RyanNeural` zmienia głos (męski),
- lista słów bierze się wprost z lekcji, więc po dopisaniu nowego dźwięku
  wystarczy uruchomić skrypt ponownie.

## Czego nie robimy

Nagrywania **dziecka** i automatycznej oceny wymowy — świadoma decyzja z briefu.

Mikrofon jest w kodzie używany w dokładnie jednym miejscu:
`components/PhonemeRecorder.tsx` (studio głosek w trybie rodzica). Włącza się po
kliknięciu dorosłego, na maksymalnie 3 sekundy, i jest zwalniany natychmiast po
nagraniu. Nagranie nie opuszcza urządzenia i nic go nie ocenia. API rozpoznawania
mowy nie ma nigdzie i nie powinno się pojawić bez osobnej decyzji.
