# Audio — stan i jak dodać brakujące nagrania

## Stan na 3 sierpnia 2026

| Co | Stan | Czym zrobione |
| --- | --- | --- |
| **Słowa** (32 pliki) | ✅ gotowe | synteza, brytyjski głos neuronowy `en-GB-SoniaNeural`, tempo −15% |
| **Czyste głoski** (14 plików) | ⚪ do nagrania przez rodzica | studio głosek w trybie rodzica (albo klucz Azure) |

Nagrania słów leżą w `public/audio/words/`. Aplikacja używa ich automatycznie
zamiast głosu z urządzenia.

**Nikt tych plików jeszcze nie odsłuchał** — powstały maszynowo. Zanim usiądziesz
z dzieckiem, przejdź przez listę w **Tryb rodzica → Audio** i kliknij ▶ przy
każdym słowie. Plik, który brzmi źle, po prostu skasuj: aplikacja wróci wtedy do
głosu z urządzenia, bez żadnej konfiguracji.

## Dlaczego głosek nie ma

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

Dopóki nagrań nie ma, aplikacja zachowuje się uczciwie: kawałki słowa przy
sklejaniu **milczą** i pokazują „🎤 wypowiada rodzic”. Ekran wprowadzenia
dźwięku odtwarza za to przykładowe słowo (już w dobrej jakości) i wprost mówi,
że to namiastka.

## Jak dorobić głoski

### Droga 1 (najprostsza): nagraj sam w aplikacji

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
