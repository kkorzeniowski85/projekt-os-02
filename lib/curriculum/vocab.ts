/**
 * Tor 2: słownictwo, zwroty i kolokacje.
 *
 * Osobny tor od phonics (tor 1). Tam dziecko uczy się DEKODOWAĆ zapis; tutaj
 * uczy się ROZUMIEĆ i MÓWIĆ. Dlatego w tym module czytanie nigdy nie jest
 * warunkiem odpowiedzi: każde pytanie da się rozwiązać ze słuchu i z obrazka,
 * a angielski tekst jest tylko podparciem dla tych, którzy już go czytają.
 *
 * KOLEJNOŚĆ TEMATÓW = KOLEJNOŚĆ PILNOŚCI, nie trudności. Pierwsze cztery
 * tematy to „przetrwanie w szkole”: zwroty ratunkowe, polecenia nauczyciela,
 * wejście do grupy rówieśniczej i grzeczność. Dziecko może przez pierwsze
 * tygodnie prawie nie mówić i to normalne — ważniejsze, żeby rozumiało, co ma
 * zrobić, i miało kilka zdań na wypadek kłopotu.
 *
 * CZTERY RODZAJE MATERIAŁU, bo uczą się inaczej:
 *  - `words`        — słowo + obrazek (rozpoznawanie ze słuchu),
 *  - `phrases`      — zwroty, które dziecko MÓWI (sytuacja po polsku → zwrot),
 *  - `commands`     — zwroty, które dziecko tylko ROZUMIE (polecenie → reakcja),
 *  - `collocations` — które słowa chodzą razem („brush your teeth”, nie „wash”),
 *  - `situations`   — (opcjonalnie) „What do you do when…? Show me!” — dziecko
 *                     POKAZUJE swoją reakcję; zastępują polecenia w „Pokaż
 *                     ruchem!” tam, gdzie polecenia to pytania nauczycielki.
 *
 * Rozdział `phrases` / `commands` jest celowy i jest najważniejszą decyzją w
 * tym pliku. Polecenia nauczyciela („line up”, „tidy up”) dziecko ma rozumieć,
 * a nie wypowiadać — więc pytanie idzie w drugą stronę niż przy zwrotach
 * własnych. Ćwiczenie, które kazałoby je powtarzać, uczyłoby czegoś, czego
 * dziecko nigdy nie powie.
 *
 * Kolokacje są osobnym ćwiczeniem, a nie ozdobnikiem: dziecko szybciej
 * przyswaja gotowy klocek („put your coat on”) niż trzy słowa do złożenia, a
 * większość błędów polskiego ucha to kalki właśnie na tym poziomie. Dlatego
 * dystraktory nie są losowe — to są konkretne kalki z polskiego.
 *
 * WARIANT JĘZYKA: brytyjski. Tam, gdzie amerykański różni się na tyle, że
 * dziecko usłyszy w szkole co innego niż w bajkach, jest uwaga dla rodzica
 * (`notePl`).
 *
 * EMOJI: wyłącznie sprzed Unicode 12 (2019) — nowsze na starszych tabletach
 * pokazują się jako puste prostokąty. Ta sama zasada co w lessons.ts.
 */

/** Słowo z obrazkiem — podstawa ćwiczenia „które słowo słyszysz”. */
export type VocabWord = {
  en: string;
  pl: string;
  emoji: string;
  /** Uwaga dla rodzica: pułapka wymowy, różnica BrE/AmE, fałszywy przyjaciel. */
  notePl?: string;
};

/**
 * Zwrot, który dziecko MÓWI. Pytaniem jest sytuacja po polsku — dziecko
 * wybiera, co powiedzieć. Tak działa realne użycie: najpierw jest kłopot,
 * potem zdanie.
 */
export type Phrase = {
  en: string;
  pl: string;
  /** Sytuacja po polsku — to ona jest pytaniem. */
  situationPl: string;
  emoji: string;
};

/**
 * Zwrot, który dziecko tylko ROZUMIE (polecenie nauczyciela). Pytaniem jest
 * nagranie angielskie — dziecko wybiera, co ma zrobić.
 */
export type Command = {
  en: string;
  pl: string;
  /** Co dziecko ma zrobić — krótko, językiem dziecka. */
  actionPl: string;
  emoji: string;
};

/**
 * Sytuacja do POKAZANIA („Pokaż ruchem!”): pytanie „What do you do when…?
 * Show me!” — dziecko odgrywa, co wtedy robi. Osobno od `commands`, bo
 * polecenie da się wykonać („line up”), a pytania nauczycielki („Are you
 * OK?”) nie — a właśnie one są materiałem tematów o ratunku, uczuciach czy
 * grzeczności. Kierunek jest odwrotny niż w poleceniu: nie „zrób, co mówię”,
 * lecz „pokaż, co robisz”. Aplikacja niczego nie mierzy — ocenia rodzic.
 */
export type Situation = {
  en: string;
  pl: string;
  /**
   * Co dziecko ma pokazać — krótko, językiem dziecka. Może łączyć gest ze
   * zwrotem („podnosisz rękę i mówisz…”); gest wystarczy, zwrot to bonus.
   */
  actionPl: string;
  emoji: string;
};

/**
 * Kolokacja z luką. `gap` zawiera dokładnie jedno „___”, a `answer` jest
 * zawsze POJEDYNCZYM słowem (dzięki temu ma własne nagranie w /audio/words).
 * `distractors` to kalki, które polskie ucho podpowiada jako pierwsze — one są
 * tu materiałem dydaktycznym, nie wypełniaczem.
 */
export type Collocation = {
  /** Pełne wyrażenie, np. "brush your teeth". */
  en: string;
  pl: string;
  /** Wyrażenie z luką — dokładnie jedno „___”. */
  gap: string;
  answer: string;
  distractors: string[];
  emoji: string;
  /** Dlaczego kalka nie działa — dla rodzica, nie dla dziecka. */
  whyPl?: string;
};

export type Topic = {
  /** Identyfikator w URL i w danych postępu. Stabilny — nie zmieniać. */
  id: string;
  titlePl: string;
  /** Po co ten temat — jednym zdaniem, językiem dziecka. */
  goalPl: string;
  emoji: string;
  /** Postać prowadząca temat (lib/heroes.ts). */
  heroId: string;
  /** Co rodzic ma wiedzieć, zanim usiądą razem. */
  parentIntroPl: string;
  words: VocabWord[];
  phrases: Phrase[];
  commands: Command[];
  /**
   * Gdy są, „Pokaż ruchem!” bierze je ZAMIAST poleceń, a „Teraz ty rządzisz”
   * odpada (pytania-sytuacji dziecko nie wydaje). Polecenia zostają w
   * „Nauczyciel mówi… co robisz?” — tam pytania działają dobrze.
   */
  situations?: Situation[];
  collocations: Collocation[];
};

export const TOPICS: Topic[] = [
  // --- 1. Ratunek ---------------------------------------------------------
  // Absolutny priorytet. Te zdania mają być odruchem, nie wynikiem myślenia —
  // dziecko sięga po nie dokładnie wtedy, gdy jest zestresowane i niczego nie
  // rozumie. Dlatego temat jest pierwszy w kolejności.
  {
    id: "rescue",
    titlePl: "Ratunek!",
    goalPl: "Zdania, które ratują, kiedy nic nie rozumiesz.",
    emoji: "🆘",
    heroId: "buzz",
    parentIntroPl:
      "To jedyny temat, który warto przećwiczyć do automatyzmu PRZED pierwszym dniem w szkole. Trzy zdania są ważniejsze od reszty: „I don't understand”, „Can you help me, please?” i „Can I go to the toilet, please?”. Ćwiczcie je krótko, ale codziennie — dziecko ma je wypowiedzieć bez zastanowienia wtedy, gdy jest zestresowane. Reszta tematu może poczekać.",
    words: [
      { en: "help", pl: "pomoc", emoji: "✋" },
      { en: "teacher", pl: "nauczyciel, nauczycielka", emoji: "👩‍🏫" },
      { en: "toilet", pl: "toaleta", emoji: "🚻" },
      { en: "water", pl: "woda", emoji: "💧" },
      { en: "name", pl: "imię", emoji: "📛" },
      { en: "friend", pl: "kolega, koleżanka", emoji: "👫" },
      {
        en: "English",
        pl: "angielski",
        emoji: "📚",
        notePl:
          "Nazwy języków piszą się po angielsku wielką literą — inaczej niż po polsku.",
      },
      { en: "Polish", pl: "polski", emoji: "🇵🇱" },
    ],
    phrases: [
      {
        en: "I don't understand.",
        pl: "Nie rozumiem.",
        situationPl: "Nauczycielka coś powiedziała, a Ty nie wiesz co.",
        emoji: "😕",
      },
      {
        en: "Can you help me, please?",
        pl: "Możesz mi pomóc?",
        situationPl: "Nie umiesz czegoś zrobić i potrzebujesz kogoś dorosłego.",
        emoji: "✋",
      },
      {
        en: "Can I go to the toilet, please?",
        pl: "Czy mogę iść do toalety?",
        situationPl: "Musisz do toalety w czasie lekcji.",
        emoji: "🚻",
      },
      {
        en: "Sorry?",
        pl: "Słucham?",
        situationPl: "Ktoś coś do Ciebie powiedział, ale nie dosłyszałeś.",
        emoji: "👂",
      },
      {
        en: "Slowly, please.",
        pl: "Wolniej, proszę.",
        situationPl: "Ktoś mówi tak szybko, że nic nie łapiesz.",
        emoji: "🐢",
      },
      {
        en: "I'm learning English.",
        pl: "Uczę się angielskiego.",
        situationPl: "Ktoś się dziwi, że nie odpowiadasz.",
        emoji: "📚",
      },
      {
        en: "I don't know.",
        pl: "Nie wiem.",
        situationPl: "Ktoś o coś pyta, a Ty nie znasz odpowiedzi.",
        emoji: "🤷",
      },
      {
        en: "I want my mum.",
        pl: "Chcę do mamy.",
        situationPl: "Jest Ci bardzo smutno i chcesz do domu.",
        emoji: "😢",
      },
      // Dopiski po przeglądzie "okiem nauczyciela": cztery zwroty, których
      // dziecko EAL uczy się w pierwszej kolejności.
      {
        en: "I'm stuck.",
        pl: "Utknąłem.",
        situationPl: "Zadanie nie wychodzi i nie wiesz, co dalej.",
        emoji: "🧱",
      },
      {
        en: "How do you say it in English?",
        pl: "Jak to jest po angielsku?",
        situationPl: "Chcesz coś powiedzieć, ale nie znasz angielskiego słowa.",
        emoji: "🔤",
      },
      {
        en: "What does it mean?",
        pl: "Co to znaczy?",
        situationPl: "Słyszysz słowo, którego nie rozumiesz.",
        emoji: "❓",
      },
      {
        en: "Can you say that again, please?",
        pl: "Możesz powtórzyć?",
        situationPl: "Chcesz, żeby ktoś powtórzył całe zdanie.",
        emoji: "🔁",
      },
    ],
    // Pytania nauczycielki — do ROZUMIENIA („Nauczyciel mówi… co robisz?”).
    // Ruchem nie da się ich wykonać, więc do „Pokaż ruchem!” idą `situations`.
    commands: [
      {
        en: "Are you OK?",
        pl: "Wszystko w porządku?",
        actionPl: "Odpowiadasz „yes” albo pokazujesz, co Cię boli.",
        emoji: "🙂",
      },
      {
        en: "Do you need help?",
        pl: "Potrzebujesz pomocy?",
        actionPl: "Kiwasz głową albo mówisz „yes, please”.",
        emoji: "✋",
      },
    ],
    // Sytuacje do pokazania ruchem (patrz typ Situation). Polecenia wyżej to
    // pytania nauczycielki — ciałem nie da się ich wykonać; pokazać da się za
    // to własną reakcję na kłopot. Akcje celowo łączą gest ze zwrotem z
    // `phrases`: gest wystarczy, zwrot to bonus, a ocena należy do rodzica.
    situations: [
      {
        en: "What do you do when you need help? Show me!",
        pl: "Co robisz, gdy potrzebujesz pomocy? Pokaż!",
        actionPl: "Podnosisz rękę i mówisz „Can you help me, please?”.",
        emoji: "🙋",
      },
      {
        en: "What do you do when you don't understand? Show me!",
        pl: "Co robisz, gdy nie rozumiesz? Pokaż!",
        actionPl: "Robisz zdziwioną minę i mówisz „I don't understand”.",
        emoji: "😕",
      },
      {
        en: "What do you do when you need the toilet? Show me!",
        pl: "Co robisz, gdy musisz do toalety? Pokaż!",
        actionPl: "Podnosisz rękę i mówisz „Can I go to the toilet, please?”.",
        emoji: "🚻",
      },
      {
        en: "What do you do when you can't hear? Show me!",
        pl: "Co robisz, gdy nie słyszysz? Pokaż!",
        actionPl: "Przykładasz rękę do ucha i mówisz „Sorry?”.",
        emoji: "👂",
      },
      {
        en: "What do you do when your tummy hurts? Show me!",
        pl: "Co robisz, gdy boli Cię brzuch? Pokaż!",
        actionPl: "Trzymasz się za brzuch i mówisz „My tummy hurts”.",
        emoji: "🤢",
      },
    ],
    collocations: [
      {
        en: "ask for help",
        pl: "poprosić o pomoc",
        gap: "___ for help",
        answer: "ask",
        distractors: ["say", "call"],
        emoji: "✋",
        whyPl:
          "Po polsku „prosić o pomoc”; po angielsku ask for — bez „for” zdanie się rozpada.",
      },
      {
        en: "look for my bag",
        pl: "szukać torby",
        gap: "___ for my bag",
        answer: "look",
        distractors: ["find", "watch"],
        emoji: "🎒",
        whyPl:
          "Najczęstsza pomyłka: „find” znaczy ZNALEŹĆ, nie szukać. Szukanie to look for — czynność, która może się nie udać.",
      },
      {
        en: "say sorry",
        pl: "przeprosić",
        gap: "___ sorry",
        answer: "say",
        distractors: ["tell", "speak"],
        emoji: "🙏",
        whyPl:
          "Polskie „powiedzieć” to po angielsku trzy słowa. „tell” wymaga osoby (tell me), „speak” dotyczy języka (speak Polish), a samo zdanie mówi się przez say.",
      },
      {
        en: "put your hand up",
        pl: "podnieść rękę",
        gap: "___ your hand up",
        answer: "put",
        distractors: ["lift", "give"],
        emoji: "🙋",
        whyPl:
          "Dosłowne „podnieś” to lift, ale w brytyjskiej klasie mówi się wyłącznie put your hand up.",
      },
    ],
  },

  // --- 2. Co mówi nauczyciel ----------------------------------------------
  // Temat wyłącznie do ROZUMIENIA. Dziecko nie ma tych zdań wypowiadać — ma na
  // nie reagować, i to jest cały cel. Stąd przewaga `commands` nad `phrases`.
  {
    id: "teacher-says",
    titlePl: "Co mówi nauczyciel",
    goalPl: "Tych zdań nie musisz mówić. Masz wiedzieć, co zrobić.",
    emoji: "👩‍🏫",
    heroId: "thunder",
    parentIntroPl:
      "Najważniejszy temat pierwszych tygodni. Dziecko może długo prawie nic nie mówić i to normalny etap — ale musi wiedzieć, co zrobić, gdy usłyszy „line up” albo „tidy up”. Ćwiczenie celowo NIE prosi o powtarzanie tych zdań: sprawdza wyłącznie, czy dziecko wie, co się dzieje. W domu da się to ćwiczyć bez aplikacji — wydawaj te polecenia po angielsku przy zwykłych czynnościach.",
    words: [
      { en: "line", pl: "rząd, kolejka", emoji: "🚶" },
      { en: "hand", pl: "ręka (dłoń)", emoji: "✋" },
      { en: "book", pl: "książka", emoji: "📖" },
      { en: "pencil", pl: "ołówek", emoji: "✏️" },
      {
        en: "bin",
        pl: "kosz na śmieci",
        emoji: "🗑️",
        notePl:
          "Brytyjskie „bin”. Amerykanie mówią trash can — w szkole dziecko usłyszy bin.",
      },
      { en: "coat", pl: "kurtka", emoji: "🧥" },
      {
        en: "peg",
        pl: "haczyk na kurtkę",
        emoji: "🧷",
        notePl:
          "Bardzo brytyjskie i bardzo codzienne: każde dziecko ma w szatni swój peg i codziennie słyszy „hang your coat on your peg”.",
      },
      {
        en: "playtime",
        pl: "przerwa",
        emoji: "⏰",
        notePl:
          "Brytyjskie playtime albo break time. Amerykańskie recess dziecko usłyszy raczej w bajkach niż w szkole.",
      },
    ],
    phrases: [
      {
        en: "Here!",
        pl: "Jestem!",
        situationPl: "Nauczycielka sprawdza obecność i czyta Twoje imię.",
        emoji: "🙋",
      },
      {
        en: "I've finished.",
        pl: "Skończyłem.",
        situationPl: "Zrobiłeś zadanie wcześniej niż reszta klasy.",
        emoji: "✅",
      },
    ],
    commands: [
      { en: "Sit down.", pl: "Usiądź.", actionPl: "Siadasz na swoim miejscu.", emoji: "💺" },
      {
        en: "Line up, please.",
        pl: "Ustawcie się w rzędzie.",
        actionPl: "Stajesz w rzędzie za innymi dziećmi.",
        emoji: "🚶",
      },
      {
        en: "Put your hand up.",
        pl: "Podnieś rękę.",
        actionPl: "Podnosisz rękę i czekasz, aż nauczycielka Cię wywoła.",
        emoji: "🙋",
      },
      {
        en: "Listen carefully.",
        pl: "Słuchaj uważnie.",
        actionPl: "Cichniesz i słuchasz.",
        emoji: "👂",
      },
      {
        en: "Open your book.",
        pl: "Otwórz książkę.",
        actionPl: "Otwierasz książkę na ławce.",
        emoji: "📖",
      },
      {
        en: "Tidy up.",
        pl: "Sprzątamy.",
        actionPl: "Odkładasz rzeczy na miejsce.",
        emoji: "🧹",
      },
      {
        en: "Put it in the bin.",
        pl: "Wyrzuć to do kosza.",
        actionPl: "Wyrzucasz to do kosza.",
        emoji: "🗑️",
      },
      {
        en: "Wash your hands.",
        pl: "Umyj ręce.",
        actionPl: "Idziesz umyć ręce.",
        emoji: "🧼",
      },
      {
        en: "Get your coat.",
        pl: "Weź kurtkę.",
        actionPl: "Idziesz po kurtkę na swój haczyk.",
        emoji: "🧥",
      },
      {
        en: "Get changed for PE.",
        pl: "Przebierz się na WF.",
        actionPl: "Przebierasz się w strój sportowy.",
        emoji: "👟",
      },
    ],
    collocations: [
      {
        en: "line up",
        pl: "ustawić się w rzędzie",
        gap: "___ up",
        answer: "line",
        distractors: ["stand", "make"],
        emoji: "🚶",
        whyPl: "Po polsku trzy słowa, po angielsku jeden gotowy klocek: line up.",
      },
      {
        en: "tidy up",
        pl: "posprzątać",
        gap: "___ up",
        answer: "tidy",
        distractors: ["clean", "order"],
        emoji: "🧹",
        whyPl:
          "„clean” to czyścić z brudu; sprzątanie zabawek i odkładanie rzeczy na miejsce to tidy up.",
      },
      {
        en: "hang up your coat",
        pl: "powiesić kurtkę",
        gap: "___ up your coat",
        answer: "hang",
        distractors: ["put", "take"],
        emoji: "🧥",
      },
      {
        en: "put it away",
        pl: "odłożyć na miejsce",
        gap: "___ it away",
        answer: "put",
        distractors: ["give", "throw"],
        emoji: "📦",
        whyPl:
          "„throw it away” znaczy WYRZUCIĆ — pomyłka kosztowna, gdy chodzi o cudzą rzecz.",
      },
    ],
  },

  // --- Dzień w szkole (po przeglądzie "okiem nauczyciela") ------------------
  // Wstawiony zaraz po poleceniach nauczyciela, bo lęk nowego dziecka to
  // głównie NIEWIEDZA, CO ZARAZ NASTĄPI — a brytyjski dzień szkolny ma
  // rytuały bez polskich odpowiedników (assembly, carpet time, wet play).
  {
    id: "school-day",
    titlePl: "Dzień w szkole",
    goalPl: "Wiesz, co będzie za chwilę — i nic Cię nie zaskakuje.",
    emoji: "🏫",
    heroId: "shock",
    parentIntroPl:
      "Brytyjski dzień szkolny ma rytuały, których polska szkoła nie zna: assembly (codzienny apel całej szkoły na sali — siedzi się i słucha, nikt nie odpytuje), carpet time (młodsze klasy siadają na dywanie), wet play (gdy pada, przerwa jest w klasie) i home time (nauczycielka puszcza dzieci z placu pojedynczo, gdy widzi rodzica). Warto przegadać plan dnia PRZED pierwszym dniem — dziecko, które wie, co zaraz nastąpi, ma o połowę mniej stresu.",
    words: [
      {
        en: "assembly",
        pl: "apel (cała szkoła na sali)",
        emoji: "🏫",
        notePl:
          "Codzienny rytuał bez polskiego odpowiednika: cała szkoła siada na sali, śpiewa, słucha ogłoszeń. Nikt nie odpytuje — siedzi się i słucha.",
      },
      {
        en: "carpet",
        pl: "dywan",
        emoji: "🧘",
        notePl:
          "Carpet time: młodsze klasy siadają po turecku na dywanie przed tablicą. W Year 3 wciąż częste.",
      },
      {
        en: "water bottle",
        pl: "bidon",
        emoji: "🥤",
        notePl:
          "Każde dziecko ma w klasie swój bidon z wodą. Podpisz go imieniem — tak jak wszystko inne.",
      },
      {
        en: "whiteboard",
        pl: "tabliczka suchościeralna",
        emoji: "📝",
        notePl:
          "Dzieci piszą odpowiedzi na małych tabliczkach i podnoszą je do góry — codzienne narzędzie, nie gadżet.",
      },
      { en: "playground", pl: "plac zabaw, boisko", emoji: "🤸" },
      {
        en: "home time",
        pl: "koniec lekcji",
        emoji: "🏠",
        notePl:
          "Nauczycielka wypuszcza dzieci z placu pojedynczo, gdy widzi opiekuna. Spóźnienie rodzica = dziecko czeka w szkole, nic się nie dzieje.",
      },
      {
        en: "wet play",
        pl: "mokra przerwa (w klasie)",
        emoji: "🌧️",
        notePl:
          "Gdy pada, przerwa jest w klasie: gry, rysowanie, klocki. W wielu klasach jest osobne pudło zabawek tylko na wet play.",
      },
      { en: "snack", pl: "przekąska", emoji: "🍏" },
    ],
    phrases: [
      {
        en: "Is it home time?",
        pl: "Czy to już koniec lekcji?",
        situationPl: "Nie wiesz, czy dzień już się kończy.",
        emoji: "🏠",
      },
      {
        en: "When is lunch?",
        pl: "Kiedy jest obiad?",
        situationPl: "Jesteś głodny i nie znasz planu dnia.",
        emoji: "🍽️",
      },
      {
        en: "Where do we go now?",
        pl: "Dokąd teraz idziemy?",
        situationPl: "Klasa gdzieś idzie, a Ty nie wiesz dokąd.",
        emoji: "🚶",
      },
    ],
    commands: [
      {
        en: "Sit on the carpet.",
        pl: "Usiądź na dywanie.",
        actionPl: "Siadasz po turecku na dywanie z innymi dziećmi.",
        emoji: "🧘",
      },
      {
        en: "Tuck your chair in.",
        pl: "Dosuń krzesło.",
        actionPl: "Dosuwasz krzesło do ławki.",
        emoji: "💺",
      },
      {
        en: "Line up for assembly.",
        pl: "Ustawcie się na apel.",
        actionPl: "Stajesz w rzędzie — cała klasa idzie na salę.",
        emoji: "🏫",
      },
      {
        en: "Get your water bottle.",
        pl: "Weź swój bidon.",
        actionPl: "Bierzesz swój bidon z półki.",
        emoji: "🥤",
      },
      {
        en: "It's wet play today.",
        pl: "Dziś przerwa w klasie.",
        actionPl: "Zostajesz w klasie i bawisz się na miejscu.",
        emoji: "🌧️",
      },
    ],
    // „It's wet play today” to informacja, nie polecenie — ruchem nie da się
    // jej wykonać. Stąd sytuacje: te same ruchy co w poleceniach wyżej (dywan,
    // rząd, kurtka), ale wywołane pytaniem „co robisz, gdy…”.
    situations: [
      {
        en: "What do you do when it's carpet time? Show me!",
        pl: "Co robisz, gdy czas na dywan? Pokaż!",
        actionPl: "Siadasz po turecku na dywanie i patrzysz na nauczycielkę.",
        emoji: "🧘",
      },
      {
        en: "What do you do when the bell goes? Show me!",
        pl: "Co robisz, gdy dzwoni dzwonek? Pokaż!",
        actionPl: "Stajesz w rzędzie za innymi dziećmi.",
        emoji: "🔔",
      },
      {
        en: "What do you do when it's wet play? Show me!",
        pl: "Co robisz, gdy przerwa jest w klasie, bo pada? Pokaż!",
        actionPl: "Zostajesz w klasie — siadasz do zabawy przy stoliku.",
        emoji: "☔",
      },
      {
        en: "What do you do when it's home time? Show me!",
        pl: "Co robisz, gdy to już koniec lekcji? Pokaż!",
        actionPl: "Bierzesz kurtkę i torbę, stajesz w rzędzie do wyjścia.",
        emoji: "🎒",
      },
    ],
    collocations: [
      {
        en: "wait your turn",
        pl: "poczekać na swoją kolej",
        gap: "___ your turn",
        answer: "wait",
        distractors: ["stay", "stand"],
        emoji: "⏳",
        whyPl:
          "W szkolnym zwrocie „wait your turn” nie ma „for” — gotowy klocek, nie zdanie do złożenia.",
      },
      {
        en: "have a snack",
        pl: "zjeść przekąskę",
        gap: "___ a snack",
        answer: "have",
        distractors: ["eat", "take"],
        emoji: "🍏",
        whyPl:
          "Jak posiłki: have breakfast, have lunch, have a snack. „eat a snack” zrozumieją, ale tak się nie mówi.",
      },
      {
        en: "go to assembly",
        pl: "iść na apel",
        gap: "___ to assembly",
        answer: "go",
        distractors: ["walk", "come"],
        emoji: "🏫",
        whyPl: "Bez „the”: go to assembly, jak go to school — rytuały dnia idą bez przedimka.",
      },
      {
        en: "get changed",
        pl: "przebrać się",
        gap: "___ changed",
        answer: "get",
        distractors: ["put", "make"],
        emoji: "👟",
        whyPl:
          "Para do „get dressed” z Poranka: przebieranie (na WF i po nim) to zawsze get changed.",
      },
    ],
  },

  // --- 3. Zagadać do dzieci -----------------------------------------------
  // Ten temat ma wartość społeczną, nie tylko językową: wejście do grupy
  // rówieśniczej zwykle decyduje o tempie całej reszty nauki.
  {
    id: "friends",
    titlePl: "Zagadać do dzieci",
    goalPl: "Kilka zdań, które otwierają zabawę.",
    emoji: "👫",
    heroId: "chomp",
    parentIntroPl:
      "Ten temat robi więcej dla nauki niż niejedna lekcja: dziecko wpuszczone do zabawy uczy się języka przez resztę dnia samo. Warto przećwiczyć „Can I play with you?” tak, żeby dało się je powiedzieć na jednym oddechu, podchodząc do grupy. „That's not fair” i „Stop it, please” są równie ważne — dziecko bez języka nie umie się inaczej postawić.",
    words: [
      { en: "friend", pl: "kolega, koleżanka", emoji: "👫" },
      { en: "game", pl: "gra, zabawa", emoji: "🎲" },
      { en: "ball", pl: "piłka", emoji: "⚽" },
      { en: "turn", pl: "kolej (czyja teraz)", emoji: "🔄" },
      { en: "team", pl: "drużyna", emoji: "👬" },
      { en: "bike", pl: "rower", emoji: "🚲" },
      { en: "sand", pl: "piasek", emoji: "🏖️" },
      { en: "winner", pl: "zwycięzca", emoji: "🏆" },
    ],
    phrases: [
      {
        en: "What's your name?",
        pl: "Jak masz na imię?",
        situationPl: "Podchodzisz do nowego dziecka.",
        emoji: "👋",
      },
      {
        en: "Can I play with you?",
        pl: "Mogę się z wami pobawić?",
        situationPl: "Inne dzieci grają w piłkę, a Ty stoisz obok.",
        emoji: "⚽",
      },
      {
        en: "Do you want to play?",
        pl: "Chcesz się pobawić?",
        situationPl: "Widzisz, że ktoś stoi sam.",
        emoji: "🙂",
      },
      {
        en: "It's my turn.",
        pl: "Teraz moja kolej.",
        situationPl: "Ktoś nie oddaje Ci kolejki.",
        emoji: "🔄",
      },
      {
        en: "That's not fair.",
        pl: "To nie fair.",
        situationPl: "Ktoś oszukuje w grze.",
        emoji: "😠",
      },
      {
        en: "Stop it, please.",
        pl: "Przestań, proszę.",
        situationPl: "Ktoś Ci dokucza.",
        emoji: "✋",
      },
      {
        en: "See you tomorrow.",
        pl: "Do jutra.",
        situationPl: "Koniec lekcji, rozchodzicie się do domów.",
        emoji: "🚪",
      },
    ],
    commands: [
      {
        en: "You're it!",
        pl: "Ty gonisz!",
        actionPl: "Zaczynasz gonić innych — to berek.",
        emoji: "🏃",
      },
      {
        en: "Come on!",
        pl: "Chodź! No dalej!",
        actionPl: "Idziesz z nimi — ktoś Cię woła do zabawy.",
        emoji: "🙌",
      },
    ],
    collocations: [
      {
        en: "take turns",
        pl: "robić na zmianę",
        gap: "___ turns",
        answer: "take",
        distractors: ["do", "give"],
        emoji: "🔄",
        whyPl: "Po polsku „zmieniać się”; angielski ma gotowy klocek take turns.",
      },
      {
        en: "play football",
        pl: "grać w piłkę",
        gap: "___ football",
        answer: "play",
        distractors: ["do", "go"],
        emoji: "⚽",
        whyPl:
          "Sporty z piłką biorą play, pływanie i bieganie biorą go (go swimming), a gimnastyka do. Tego się nie wyprowadza regułą — trzeba zapamiętać parami.",
      },
      {
        en: "have fun",
        pl: "dobrze się bawić",
        gap: "___ fun",
        answer: "have",
        distractors: ["make", "do"],
        emoji: "🎉",
      },
      {
        en: "Can I join in?",
        pl: "Mogę się przyłączyć?",
        gap: "Can I ___ in?",
        answer: "join",
        distractors: ["come", "go"],
        emoji: "👫",
      },
    ],
  },

  // --- 4. Grzeczność -------------------------------------------------------
  // W brytyjskiej szkole „please” i „thank you” niosą więcej niż uprzejmość —
  // ich brak jest odbierany jako zachowanie, nie jako braki językowe.
  {
    id: "manners",
    titlePl: "Grzeczność",
    goalPl: "„Please” i „thank you” słychać tu częściej niż u nas.",
    emoji: "🙏",
    heroId: "gleam",
    parentIntroPl:
      "Warto wiedzieć, że w Anglii brak „please” i „thank you” bywa odbierany jako zachowanie dziecka, a nie jako braki językowe — i to samo dotyczy „sorry”, którego używa się dużo częściej niż polskiego „przepraszam”. To najtańsza inwestycja w tym module: kilka słów, a robią bardzo dobre pierwsze wrażenie. Uwaga na różnicę: „Sorry” to przeprosiny, „Excuse me” mówi się, ZANIM się kogoś zaczepi albo przeciśnie.",
    words: [
      { en: "morning", pl: "poranek", emoji: "🌅" },
      { en: "afternoon", pl: "popołudnie", emoji: "☀️" },
      { en: "night", pl: "noc", emoji: "🌙" },
      { en: "sorry", pl: "przepraszam", emoji: "😔" },
      { en: "hello", pl: "cześć", emoji: "👋" },
      { en: "goodbye", pl: "do widzenia", emoji: "🚪" },
    ],
    phrases: [
      {
        en: "Yes, please.",
        pl: "Tak, poproszę.",
        situationPl: "Ktoś pyta, czy chcesz dokładkę.",
        emoji: "🍽️",
      },
      {
        en: "No, thank you.",
        pl: "Nie, dziękuję.",
        situationPl: "Nie chcesz tego, co Ci proponują.",
        emoji: "🙅",
      },
      {
        en: "Thank you.",
        pl: "Dziękuję.",
        situationPl: "Ktoś Ci coś dał albo pomógł.",
        emoji: "😊",
      },
      {
        en: "You're welcome.",
        pl: "Proszę bardzo.",
        situationPl: "Ktoś Ci właśnie podziękował.",
        emoji: "🙂",
      },
      {
        en: "Excuse me.",
        pl: "Przepraszam (żeby zagadać albo przejść).",
        situationPl: "Chcesz o coś zapytać albo przecisnąć się obok kogoś.",
        emoji: "✋",
      },
      {
        en: "Here you are.",
        pl: "Proszę (podając coś).",
        situationPl: "Podajesz komuś rzecz, o którą prosił.",
        emoji: "🤲",
      },
      {
        en: "Nice to meet you.",
        pl: "Miło cię poznać.",
        situationPl: "Ktoś Ci właśnie powiedział, jak ma na imię.",
        emoji: "🤝",
      },
      {
        en: "Bless you!",
        pl: "Na zdrowie!",
        situationPl: "Ktoś obok Ciebie kichnął.",
        emoji: "🤧",
      },
    ],
    commands: [
      {
        en: "How are you?",
        pl: "Jak się masz?",
        actionPl: "Odpowiadasz „I'm fine, thank you”.",
        emoji: "🙂",
      },
      {
        en: "Have a nice day.",
        pl: "Miłego dnia.",
        actionPl: "Odpowiadasz „Thank you, you too”.",
        emoji: "👋",
      },
      {
        en: "Share, please.",
        pl: "Podziel się, proszę.",
        actionPl: "Dajesz drugiemu dziecku pobawić się tym, co masz.",
        emoji: "🧸",
      },
    ],
    // „How are you?” i „Have a nice day” to pytanie i życzenie — reakcją jest
    // słowo, nie ruch. Sytuacje zamieniają je na scenki do odegrania: gest
    // plus zwrot z `phrases` (dziękuję, przepraszam, na zdrowie).
    situations: [
      {
        en: "What do you do when someone gives you something? Show me!",
        pl: "Co robisz, gdy ktoś Ci coś daje? Pokaż!",
        actionPl: "Bierzesz to i mówisz „Thank you”.",
        emoji: "🎁",
      },
      {
        en: "What do you do when someone asks how you are? Show me!",
        pl: "Co robisz, gdy ktoś pyta, jak się masz? Pokaż!",
        actionPl: "Uśmiechasz się i mówisz „I'm fine, thank you”.",
        emoji: "🙂",
      },
      {
        en: "What do you do when someone sneezes? Show me!",
        pl: "Co robisz, gdy ktoś kicha? Pokaż!",
        actionPl: "Mówisz „Bless you!”.",
        emoji: "🤧",
      },
      {
        en: "What do you do when you want to get past? Show me!",
        pl: "Co robisz, gdy chcesz przejść? Pokaż!",
        actionPl: "Mówisz „Excuse me” i czekasz, aż zrobią Ci miejsce.",
        emoji: "🚶",
      },
      {
        en: "What do you do when you meet someone new? Show me!",
        pl: "Co robisz, gdy poznajesz kogoś nowego? Pokaż!",
        actionPl: "Machasz albo podajesz rękę i mówisz „Nice to meet you”.",
        emoji: "🤝",
      },
    ],
    collocations: [
      {
        en: "say thank you",
        pl: "podziękować",
        gap: "___ thank you",
        answer: "say",
        distractors: ["tell", "speak"],
        emoji: "😊",
      },
      {
        en: "be kind",
        pl: "być miłym",
        gap: "___ kind",
        answer: "be",
        distractors: ["have", "do"],
        emoji: "💛",
        whyPl:
          "Po polsku „bądź miły” brzmi tak samo jak „miej cierpliwość”, więc kusi „have”. Cechy charakteru idą po angielsku zawsze z be.",
      },
      {
        en: "share your toys",
        pl: "dzielić się zabawkami",
        gap: "___ your toys",
        answer: "share",
        distractors: ["give", "divide"],
        emoji: "🧸",
        whyPl:
          "„divide” to dzielić w matematyce; dzielenie się rzeczą to share. „give” oddaje na własność.",
      },
      {
        en: "take care",
        pl: "uważaj na siebie",
        gap: "___ care",
        answer: "take",
        distractors: ["have", "do"],
        emoji: "🤝",
      },
    ],
  },

  // --- 5. Poranek ----------------------------------------------------------
  // Temat gęsty od kolokacji, bo cała poranna rutyna to gotowe klocki. Można go
  // ćwiczyć bez aplikacji: te same zdania padają w domu codziennie o tej samej
  // porze, więc kontekst robi połowę roboty.
  {
    id: "morning",
    titlePl: "Poranek",
    goalPl: "Od budzika do wyjścia z domu.",
    emoji: "⏰",
    heroId: "speed",
    parentIntroPl:
      "Najłatwiejszy temat do przeniesienia poza aplikację: te zdania padają w domu codziennie o tej samej porze, więc sytuacja tłumaczy je sama. Wystarczy zacząć mówić po angielsku „brush your teeth” zamiast „umyj zęby”. Uwaga na jedną pułapkę: po polsku zęby się MYJE, więc dziecko powie „wash your teeth” — po angielsku zawsze brush.",
    words: [
      { en: "bed", pl: "łóżko", emoji: "🛏️" },
      { en: "teeth", pl: "zęby", emoji: "🦷" },
      { en: "breakfast", pl: "śniadanie", emoji: "🥣" },
      { en: "shoes", pl: "buty", emoji: "👟" },
      { en: "clock", pl: "zegar", emoji: "⏰" },
      { en: "soap", pl: "mydło", emoji: "🧼" },
      { en: "shower", pl: "prysznic", emoji: "🚿" },
      { en: "bag", pl: "torba, plecak", emoji: "🎒" },
    ],
    phrases: [
      {
        en: "I'm ready.",
        pl: "Jestem gotowy.",
        situationPl: "Ubrałeś się i możecie wychodzić.",
        emoji: "👍",
      },
      {
        en: "Where are my shoes?",
        pl: "Gdzie są moje buty?",
        situationPl: "Nie możesz znaleźć butów.",
        emoji: "👟",
      },
      {
        en: "I can do it myself.",
        pl: "Sam to zrobię.",
        situationPl: "Ktoś chce Cię ubrać, a Ty umiesz sam.",
        emoji: "💪",
      },
      {
        en: "Just a minute.",
        pl: "Chwileczkę.",
        situationPl: "Ktoś Cię pogania, a Ty jeszcze nie skończyłeś.",
        emoji: "⏰",
      },
      {
        en: "I forgot.",
        pl: "Zapomniałem.",
        situationPl: "Zostawiłeś coś w domu.",
        emoji: "🤦",
      },
    ],
    commands: [
      { en: "Wake up!", pl: "Wstawaj!", actionPl: "Otwierasz oczy i wstajesz.", emoji: "⏰" },
      {
        en: "Get dressed.",
        pl: "Ubierz się.",
        actionPl: "Zakładasz ubranie.",
        emoji: "👕",
      },
      {
        en: "Brush your teeth.",
        pl: "Umyj zęby.",
        actionPl: "Idziesz umyć zęby.",
        emoji: "🦷",
      },
      {
        en: "Hurry up!",
        pl: "Pospiesz się!",
        actionPl: "Robisz to szybciej — zaraz wychodzicie.",
        emoji: "🏃",
      },
    ],
    collocations: [
      {
        en: "brush your teeth",
        pl: "myć zęby",
        gap: "___ your teeth",
        answer: "brush",
        distractors: ["wash", "clean"],
        emoji: "🦷",
        whyPl:
          "Najczęstsza kalka w tym temacie: po polsku zęby MYJEMY, więc dziecko powie „wash”. Po angielsku zawsze brush your teeth.",
      },
      {
        en: "get dressed",
        pl: "ubrać się",
        gap: "___ dressed",
        answer: "get",
        distractors: ["put", "make"],
        emoji: "👕",
      },
      {
        en: "get up",
        pl: "wstać z łóżka",
        gap: "___ up",
        answer: "get",
        distractors: ["stand", "wake"],
        emoji: "🛏️",
        whyPl:
          "„wake up” to obudzić się (otworzyć oczy), „get up” to wstać z łóżka. Po polsku często jedno „wstawać” — po angielsku dwie różne rzeczy.",
      },
      {
        en: "make your bed",
        pl: "pościelić łóżko",
        gap: "___ your bed",
        answer: "make",
        distractors: ["do", "clean"],
        emoji: "🛏️",
      },
      {
        en: "have breakfast",
        pl: "zjeść śniadanie",
        gap: "___ breakfast",
        answer: "have",
        distractors: ["make", "take"],
        emoji: "🥣",
        whyPl:
          "Posiłki idą z have: have breakfast, have lunch, have dinner. „make breakfast” znaczy PRZYGOTOWAĆ śniadanie, nie zjeść.",
      },
    ],
  },

  // --- 6. Obiad w szkole ---------------------------------------------------
  // Dużo słów czysto brytyjskich i szkolnych (school dinner, packed lunch),
  // których dziecko nie usłyszy w bajkach, a usłyszy pierwszego dnia.
  {
    id: "lunch",
    titlePl: "Obiad w szkole",
    goalPl: "Stołówka, jedzenie i „poproszę”.",
    emoji: "🍽️",
    heroId: "moon",
    parentIntroPl:
      "Sporo tu słów, które istnieją tylko w brytyjskiej szkole: school dinner to obiad w stołówce, packed lunch to jedzenie z domu, a dinner lady to pani, która je wydaje. Warto też wiedzieć, że chips to frytki, a chipsy to crisps — dziecko oglądające amerykańskie bajki będzie miało to odwrotnie.",
    words: [
      { en: "sandwich", pl: "kanapka", emoji: "🥪" },
      { en: "apple", pl: "jabłko", emoji: "🍎" },
      { en: "milk", pl: "mleko", emoji: "🥛" },
      { en: "water", pl: "woda", emoji: "💧" },
      { en: "spoon", pl: "łyżka", emoji: "🥄" },
      { en: "fork", pl: "widelec", emoji: "🍴" },
      {
        en: "chips",
        pl: "frytki",
        emoji: "🍟",
        notePl:
          "Uwaga na odwrotność: brytyjskie chips to FRYTKI, a chipsy to crisps. W amerykańskich bajkach chips znaczy chipsy — to najczęstsze nieporozumienie przy stole.",
      },
      {
        en: "biscuit",
        pl: "ciastko, herbatnik",
        emoji: "🍪",
        notePl: "Brytyjskie biscuit. Amerykańskie cookie dziecko zna z bajek.",
      },
    ],
    phrases: [
      { en: "I'm hungry.", pl: "Jestem głodny.", situationPl: "Chce Ci się jeść.", emoji: "😋" },
      {
        en: "I'm thirsty.",
        pl: "Chce mi się pić.",
        situationPl: "Chce Ci się pić.",
        emoji: "💧",
      },
      {
        en: "Can I have some water, please?",
        pl: "Czy mogę prosić o wodę?",
        situationPl: "Chcesz się napić, a butelka jest pusta.",
        emoji: "🥛",
      },
      {
        en: "I don't like it.",
        pl: "Nie lubię tego.",
        situationPl: "Dostałeś coś, czego nie chcesz jeść.",
        emoji: "😕",
      },
      {
        en: "It's yummy!",
        pl: "Pyszne!",
        situationPl: "Bardzo Ci smakuje.",
        emoji: "🤤",
      },
    ],
    commands: [
      {
        en: "It's lunchtime.",
        pl: "Czas na obiad.",
        actionPl: "Idziesz z klasą do stołówki.",
        emoji: "🍽️",
      },
      {
        en: "Sit at the table.",
        pl: "Usiądź przy stole.",
        actionPl: "Siadasz przy stole.",
        emoji: "💺",
      },
      {
        en: "Finish your food.",
        pl: "Dokończ jedzenie.",
        actionPl: "Zjadasz to, co masz na talerzu.",
        emoji: "🍲",
      },
    ],
    // „It's lunchtime” to zapowiedź, nie polecenie. Sytuacje: reakcje przy
    // stole, które da się odegrać — ze zwrotami z `phrases`.
    situations: [
      {
        en: "What do you do when it's lunchtime? Show me!",
        pl: "Co robisz, gdy czas na obiad? Pokaż!",
        actionPl: "Wstajesz i stajesz w rzędzie do stołówki.",
        emoji: "🍴",
      },
      {
        en: "What do you do when you're thirsty? Show me!",
        pl: "Co robisz, gdy chce Ci się pić? Pokaż!",
        actionPl: "Mówisz „Can I have some water, please?”.",
        emoji: "🥤",
      },
      {
        en: "What do you do when you don't like the food? Show me!",
        pl: "Co robisz, gdy nie lubisz tego, co jest na talerzu? Pokaż!",
        actionPl: "Kręcisz głową i mówisz grzecznie „I don't like it”.",
        emoji: "😖",
      },
      {
        en: "What do you do when the food is yummy? Show me!",
        pl: "Co robisz, gdy jedzenie jest pyszne? Pokaż!",
        actionPl: "Kciuk w górę i „It's yummy!”.",
        emoji: "😋",
      },
    ],
    collocations: [
      {
        en: "have lunch",
        pl: "zjeść obiad",
        gap: "___ lunch",
        answer: "have",
        distractors: ["make", "take"],
        emoji: "🍽️",
      },
      {
        en: "make a sandwich",
        pl: "zrobić kanapkę",
        gap: "___ a sandwich",
        answer: "make",
        distractors: ["do", "cook"],
        emoji: "🥪",
        whyPl: "„cook” wymaga gotowania albo pieczenia — kanapki się nie gotuje.",
      },
      {
        en: "wash your hands",
        pl: "umyć ręce",
        gap: "___ your hands",
        answer: "wash",
        distractors: ["clean", "brush"],
        emoji: "🧼",
      },
      {
        en: "finish your food",
        pl: "dokończyć jedzenie",
        gap: "___ your food",
        answer: "finish",
        distractors: ["end", "stop"],
        emoji: "🍲",
        whyPl:
          "Polskie „skończyć” to end albo finish, ale o jedzeniu i zadaniach mówi się zawsze finish.",
      },
    ],
  },

  // --- 7. Kiedy coś boli ---------------------------------------------------
  // Temat bezpieczeństwa, nie konwersacji. Dziecko musi umieć powiedzieć, że
  // coś jest nie tak, ZANIM nauczy się o tym rozmawiać.
  {
    id: "hurt",
    titlePl: "Kiedy coś boli",
    goalPl: "Powiedzieć dorosłemu, że coś jest nie tak.",
    emoji: "🤕",
    heroId: "burn",
    parentIntroPl:
      "To temat bezpieczeństwa, nie konwersacji — dlatego warto go zrobić wcześnie, nawet jeśli reszta modułu poczeka. Wystarczą dwa zdania: „It hurts” i „I feel sick”. Dobrze też przećwiczyć samo pokazanie palcem — dziecko, które nie zna słowa, wciąż może wskazać miejsce, a dorosły to zrozumie.",
    words: [
      { en: "head", pl: "głowa", emoji: "🤕" },
      {
        en: "tummy",
        pl: "brzuch",
        emoji: "😣",
        notePl:
          "Brytyjskie dziecięce słowo na brzuch. Dorośli mówią stomach, ale w szkole podstawowej usłyszysz tummy.",
      },
      { en: "hand", pl: "dłoń", emoji: "✋" },
      { en: "leg", pl: "noga", emoji: "🦵" },
      { en: "knee", pl: "kolano", emoji: "🦵" },
      { en: "tooth", pl: "ząb", emoji: "🦷" },
      { en: "doctor", pl: "lekarz", emoji: "👨‍⚕️" },
      { en: "medicine", pl: "lekarstwo", emoji: "💊" },
    ],
    phrases: [
      {
        en: "It hurts.",
        pl: "Boli.",
        situationPl: "Coś Cię boli i trzeba to powiedzieć od razu.",
        emoji: "😖",
      },
      {
        en: "My tummy hurts.",
        pl: "Boli mnie brzuch.",
        situationPl: "Boli Cię brzuch.",
        emoji: "😣",
      },
      {
        en: "I feel sick.",
        pl: "Niedobrze mi.",
        situationPl: "Zbiera Ci się na wymioty.",
        emoji: "🤢",
      },
      {
        en: "I've hurt my knee.",
        pl: "Uderzyłem się w kolano.",
        situationPl: "Przewróciłeś się na przerwie.",
        emoji: "🤕",
      },
      {
        en: "I need help.",
        pl: "Potrzebuję pomocy.",
        situationPl: "Coś się stało i sam sobie nie poradzisz.",
        emoji: "🆘",
      },
    ],
    commands: [
      {
        en: "Where does it hurt?",
        pl: "Gdzie cię boli?",
        actionPl: "Pokazujesz palcem miejsce, które boli.",
        emoji: "👉",
      },
      {
        en: "Show me.",
        pl: "Pokaż mi.",
        actionPl: "Pokazujesz, co się stało.",
        emoji: "👀",
      },
      {
        en: "Are you all right?",
        pl: "Wszystko w porządku?",
        actionPl: "Mówisz „yes” albo „no, it hurts”.",
        emoji: "🙂",
      },
    ],
    // „Are you all right?” to pytanie — odpowiada się słowem. Sytuacje
    // odwracają kierunek: dziecko pokazuje, co robi, gdy coś się stało — gest
    // plus zwrot z `phrases`; ostatnia uczy zadać to pytanie koledze.
    situations: [
      {
        en: "What do you do when you fall over? Show me!",
        pl: "Co robisz, gdy się przewrócisz? Pokaż!",
        actionPl: "Wstajesz, idziesz do nauczycielki i mówisz „It hurts”.",
        emoji: "🤕",
      },
      {
        en: "What do you do when you hurt your knee? Show me!",
        pl: "Co robisz, gdy uderzysz się w kolano? Pokaż!",
        actionPl: "Pokazujesz kolano i mówisz „I've hurt my knee”.",
        emoji: "🦵",
      },
      {
        en: "What do you do when you feel sick? Show me!",
        pl: "Co robisz, gdy jest Ci niedobrze? Pokaż!",
        actionPl: "Podnosisz rękę i mówisz „I feel sick”.",
        emoji: "🤒",
      },
      {
        en: "What do you do when a friend is hurt? Show me!",
        pl: "Co robisz, gdy kolega się skaleczy? Pokaż!",
        actionPl: "Pytasz „Are you all right?” i wołasz nauczycielkę.",
        emoji: "👩‍🏫",
      },
    ],
    collocations: [
      {
        en: "tell the teacher",
        pl: "powiedzieć nauczycielce",
        gap: "___ the teacher",
        answer: "tell",
        distractors: ["say", "speak"],
        emoji: "👩‍🏫",
        whyPl:
          "Odwrotnie niż przy „say sorry”: gdy mówimy KOMUŚ, angielski wymaga tell. „say the teacher” jest błędem.",
      },
      {
        en: "take medicine",
        pl: "wziąć lekarstwo",
        gap: "___ medicine",
        answer: "take",
        distractors: ["drink", "eat"],
        emoji: "💊",
        whyPl: "Po polsku lekarstwo się pije albo bierze; po angielsku zawsze take.",
      },
      {
        en: "have a headache",
        pl: "mieć ból głowy",
        gap: "___ a headache",
        answer: "have",
        distractors: ["be", "make"],
        emoji: "🤕",
        whyPl:
          "Po polsku „boli mnie głowa” (czasownik), po angielsku „mam ból głowy” (rzeczownik z have).",
      },
      {
        en: "get better",
        pl: "wyzdrowieć",
        gap: "___ better",
        answer: "get",
        distractors: ["make", "do"],
        emoji: "🙂",
      },
    ],
  },

  // --- 8. Ubranie i pogoda -------------------------------------------------
  // Najbardziej „brytyjski” temat słownikowo: jumper, trainers, wellies, PE kit
  // to słowa, których amerykańskie bajki dziecku nie dadzą.
  {
    id: "clothes-weather",
    titlePl: "Ubranie i pogoda",
    goalPl: "Co założyć, kiedy pada.",
    emoji: "🧥",
    heroId: "float",
    parentIntroPl:
      "Tu różnice brytyjsko-amerykańskie są największe i najbardziej codzienne: jumper (sweter), trainers (buty sportowe), wellies (kalosze), PE kit (strój na WF). Dziecko usłyszy te słowa w szkole każdego dnia, a w bajkach — nigdy. Jedna pułapka warta uwagi: brytyjskie pants to majtki, nie spodnie (spodnie to trousers).",
    words: [
      {
        en: "jumper",
        pl: "sweter, bluza",
        emoji: "👕",
        notePl: "Brytyjskie jumper. Amerykańskie sweater dziecko zna z bajek.",
      },
      { en: "coat", pl: "kurtka", emoji: "🧥" },
      {
        en: "trainers",
        pl: "buty sportowe",
        emoji: "👟",
        notePl: "Brytyjskie trainers, amerykańskie sneakers.",
      },
      {
        en: "wellies",
        pl: "kalosze",
        emoji: "👢",
        notePl:
          "Bardzo brytyjskie i bardzo przydatne — w brytyjskiej szkole kalosze to sprzęt codzienny, nie awaryjny.",
      },
      { en: "hat", pl: "czapka", emoji: "🧢" },
      { en: "gloves", pl: "rękawiczki", emoji: "🧤" },
      { en: "umbrella", pl: "parasol", emoji: "☂️" },
      { en: "rain", pl: "deszcz", emoji: "🌧️" },
    ],
    phrases: [
      { en: "I'm cold.", pl: "Zimno mi.", situationPl: "Marzniesz.", emoji: "🥶" },
      { en: "I'm hot.", pl: "Gorąco mi.", situationPl: "Jest Ci za gorąco.", emoji: "🥵" },
      {
        en: "It's raining.",
        pl: "Pada deszcz.",
        situationPl: "Patrzysz w okno i widzisz deszcz.",
        emoji: "🌧️",
      },
      {
        en: "I've lost my jumper.",
        pl: "Zgubiłem sweter.",
        situationPl: "Nie ma Twojego swetra na haczyku.",
        emoji: "😟",
      },
      {
        en: "Can I go outside?",
        pl: "Mogę wyjść na dwór?",
        situationPl: "Chcesz wyjść na plac zabaw.",
        emoji: "🚪",
      },
    ],
    commands: [
      {
        en: "Put your coat on.",
        pl: "Załóż kurtkę.",
        actionPl: "Zakładasz kurtkę.",
        emoji: "🧥",
      },
      {
        en: "Take your coat off.",
        pl: "Zdejmij kurtkę.",
        actionPl: "Zdejmujesz kurtkę i wieszasz ją na haczyku.",
        emoji: "🧷",
      },
      {
        en: "Get your PE kit.",
        pl: "Weź strój na WF.",
        actionPl: "Bierzesz worek ze strojem sportowym.",
        emoji: "👟",
      },
    ],
    collocations: [
      {
        en: "put on your coat",
        pl: "założyć kurtkę",
        gap: "___ on your coat",
        answer: "put",
        distractors: ["wear", "dress"],
        emoji: "🧥",
        whyPl:
          "„wear” znaczy MIEĆ NA SOBIE (stan), „put on” to czynność zakładania. Po polsku oba bywają „nosić / założyć”.",
      },
      {
        en: "take off your shoes",
        pl: "zdjąć buty",
        gap: "___ off your shoes",
        answer: "take",
        distractors: ["put", "get"],
        emoji: "👟",
      },
      {
        en: "get wet",
        pl: "zmoknąć",
        gap: "___ wet",
        answer: "get",
        distractors: ["be", "make"],
        emoji: "💧",
        whyPl:
          "„be wet” to być mokrym (stan), „get wet” to zmoknąć (zmiana). Polskie „zmoknąć” zawiera tę zmianę w sobie.",
      },
      {
        en: "zip up your coat",
        pl: "zapiąć kurtkę",
        gap: "___ up your coat",
        answer: "zip",
        distractors: ["close", "shut"],
        emoji: "🧣",
        whyPl: "Po polsku kurtkę się „zamyka”, więc kusi close — po angielsku zamek się zip up.",
      },
    ],
  },

  // --- 9. Jak się czuję ----------------------------------------------------
  // Dziecko bez języka nie umie powiedzieć, że jest mu źle — i wtedy pokazuje
  // to zachowaniem, które dorośli czytają opacznie. Dlatego ten temat jest tu.
  {
    id: "feelings",
    titlePl: "Jak się czuję",
    goalPl: "Nazwać to, co w środku.",
    emoji: "😊",
    heroId: "spark",
    parentIntroPl:
      "Dziecko, które nie umie powiedzieć „I'm scared” albo „I miss my mum”, pokaże to zachowaniem — a dorosły w szkole odczyta zachowanie, nie powód. Kilka słów tutaj oszczędza sporo nieporozumień. „I don't want to” i „Leave me alone” są w tym module świadomie: dziecko bez języka nie umie się postawić inaczej niż płaczem albo szarpaniną.",
    words: [
      { en: "happy", pl: "szczęśliwy", emoji: "😊" },
      { en: "sad", pl: "smutny", emoji: "😢" },
      { en: "tired", pl: "zmęczony", emoji: "😴" },
      { en: "scared", pl: "przestraszony", emoji: "😨" },
      { en: "angry", pl: "zły", emoji: "😠" },
      { en: "shy", pl: "nieśmiały", emoji: "😳" },
      { en: "excited", pl: "podekscytowany", emoji: "🤩" },
      { en: "bored", pl: "znudzony", emoji: "😑" },
    ],
    phrases: [
      { en: "I'm tired.", pl: "Jestem zmęczony.", situationPl: "Nie masz już siły.", emoji: "😴" },
      {
        en: "I miss my mum.",
        pl: "Tęsknię za mamą.",
        situationPl: "Chce Ci się płakać, bo mamy nie ma obok.",
        emoji: "😢",
      },
      { en: "I'm scared.", pl: "Boję się.", situationPl: "Coś Cię przestraszyło.", emoji: "😨" },
      {
        en: "I don't want to.",
        pl: "Nie chcę.",
        situationPl: "Ktoś każe Ci zrobić coś, na co nie masz ochoty.",
        emoji: "🙅",
      },
      {
        en: "Leave me alone.",
        pl: "Zostaw mnie w spokoju.",
        situationPl: "Ktoś nie przestaje Ci dokuczać.",
        emoji: "😠",
      },
      { en: "I'm happy!", pl: "Cieszę się!", situationPl: "Jest Ci bardzo dobrze.", emoji: "😊" },
    ],
    commands: [
      {
        en: "Don't worry.",
        pl: "Nie martw się.",
        actionPl: "Wiesz, że nic złego się nie dzieje.",
        emoji: "🙂",
      },
      {
        en: "Cheer up!",
        pl: "Głowa do góry!",
        actionPl: "Ktoś chce Cię pocieszyć.",
        emoji: "😊",
      },
      {
        en: "Never mind.",
        pl: "Nic nie szkodzi.",
        actionPl: "Wiesz, że to, co się stało, nie było niczym złym.",
        emoji: "👌",
      },
    ],
    // „Don't worry”, „Cheer up”, „Never mind” to pocieszenia — nie ma tu ruchu
    // do wykonania. Sytuacje: dziecko pokazuje, co robi z własnym uczuciem
    // (słowa z `words`, zwroty z `phrases`) i jak samo pociesza innych.
    situations: [
      {
        en: "What do you do when you miss your mum? Show me!",
        pl: "Co robisz, gdy tęsknisz za mamą? Pokaż!",
        actionPl: "Idziesz do nauczycielki i mówisz „I miss my mum”.",
        emoji: "😢",
      },
      {
        en: "What do you do when you don't want to do something? Show me!",
        pl: "Co robisz, gdy czegoś nie chcesz? Pokaż!",
        actionPl: "Kręcisz głową i mówisz „I don't want to”.",
        emoji: "🙅",
      },
      {
        en: "What do you do when you're happy? Show me!",
        pl: "Co robisz, gdy jesteś szczęśliwy? Pokaż!",
        actionPl: "Uśmiechasz się od ucha do ucha i mówisz „I'm happy”.",
        emoji: "😊",
      },
      {
        en: "What do you do when a friend is sad? Show me!",
        pl: "Co robisz, gdy kolega jest smutny? Pokaż!",
        actionPl: "Siadasz obok i mówisz „Don't worry” albo „Cheer up!”.",
        emoji: "🤗",
      },
    ],
    collocations: [
      {
        en: "feel better",
        pl: "czuć się lepiej",
        gap: "___ better",
        answer: "feel",
        distractors: ["make", "have"],
        emoji: "🙂",
      },
      {
        en: "have a rest",
        pl: "odpocząć",
        gap: "___ a rest",
        answer: "have",
        distractors: ["do", "make"],
        emoji: "😴",
      },
      {
        en: "calm down",
        pl: "uspokoić się",
        gap: "___ down",
        answer: "calm",
        distractors: ["quiet", "still"],
        emoji: "😌",
      },
      {
        en: "cheer up",
        pl: "rozchmurzyć się",
        gap: "___ up",
        answer: "cheer",
        distractors: ["happy", "smile"],
        emoji: "😊",
      },
    ],
  },

  // --- 10. Rzeczy w szkole -------------------------------------------------
  // Przybory i polecenia okołozadaniowe. Zamyka moduł, bo bez pierwszych
  // dziewięciu tematów sama nazwa temperówki na nic dziecku się nie przyda.
  {
    id: "school-things",
    titlePl: "Rzeczy w szkole",
    goalPl: "Piórnik, klej i „mogę pożyczyć?”.",
    emoji: "✏️",
    heroId: "cure",
    parentIntroPl:
      "Najbardziej „słownikowy” temat modułu i dlatego ostatni: bez wcześniejszych zdań sama nazwa temperówki niewiele daje. Jedna rzecz jest tu jednak warta uwagi od pierwszego dnia — brytyjskie rubber znaczy gumka do mazania. Dziecko, które zna to słowo z amerykańskich bajek, może się zdziwić, ale w szkole usłyszy wyłącznie rubber.",
    words: [
      {
        en: "rubber",
        pl: "gumka do mazania",
        emoji: "🧽",
        notePl:
          "Brytyjskie rubber = gumka do mazania (amerykańskie eraser). To najczęściej pożyczana rzecz w klasie, więc słowo przydaje się od pierwszego dnia.",
      },
      { en: "ruler", pl: "linijka", emoji: "📏" },
      { en: "scissors", pl: "nożyczki", emoji: "✂️" },
      { en: "glue", pl: "klej", emoji: "🧴" },
      { en: "crayon", pl: "kredka woskowa", emoji: "🖍️" },
      { en: "pencil case", pl: "piórnik", emoji: "👝" },
      { en: "exercise book", pl: "zeszyt", emoji: "📒" },
      {
        en: "book bag",
        pl: "torba na książki",
        emoji: "🎒",
        notePl:
          "Brytyjskie book bag — płócienna torba, w której dziecko nosi książeczkę do czytania i dzienniczek.",
      },
    ],
    phrases: [
      {
        en: "Can I borrow your rubber, please?",
        pl: "Mogę pożyczyć gumkę?",
        situationPl: "Zrobiłeś błąd, a nie masz gumki.",
        emoji: "🧽",
      },
      {
        en: "I can't find my bag.",
        pl: "Nie mogę znaleźć torby.",
        situationPl: "Twojej torby nie ma tam, gdzie ją zostawiłeś.",
        emoji: "🎒",
      },
      {
        en: "What's this?",
        pl: "Co to jest?",
        situationPl: "Widzisz rzecz, której nazwy nie znasz.",
        emoji: "❓",
      },
      {
        en: "I've lost my pencil.",
        pl: "Zgubiłem ołówek.",
        situationPl: "Nie masz czym pisać.",
        emoji: "✏️",
      },
    ],
    commands: [
      {
        en: "Get your pencil case.",
        pl: "Weź piórnik.",
        actionPl: "Wyjmujesz piórnik z torby.",
        emoji: "👝",
      },
      {
        en: "Write your name.",
        pl: "Napisz swoje imię.",
        actionPl: "Podpisujesz kartkę swoim imieniem.",
        emoji: "✏️",
      },
      {
        en: "Colour it in.",
        pl: "Pokoloruj to.",
        actionPl: "Kolorujesz obrazek kredkami.",
        emoji: "🖍️",
      },
      {
        en: "Cut it out.",
        pl: "Wytnij to.",
        actionPl: "Wycinasz to nożyczkami.",
        emoji: "✂️",
      },
      {
        en: "Stick it in your book.",
        pl: "Wklej to do zeszytu.",
        actionPl: "Wklejasz to do zeszytu.",
        emoji: "📒",
      },
      {
        en: "Turn the page.",
        pl: "Przewróć stronę.",
        actionPl: "Przewracasz stronę w książce.",
        emoji: "📖",
      },
    ],
    collocations: [
      {
        en: "do your homework",
        pl: "odrobić lekcje",
        gap: "___ your homework",
        answer: "do",
        distractors: ["make", "write"],
        emoji: "📒",
        whyPl:
          "Polskie „robić” to po angielsku make ALBO do i nie ma na to reguły — trzeba uczyć się parami. Zadanie domowe zawsze się do.",
      },
      {
        en: "do your best",
        pl: "dać z siebie wszystko",
        gap: "___ your best",
        answer: "do",
        distractors: ["make", "give"],
        emoji: "💪",
      },
      {
        en: "make a mistake",
        pl: "pomylić się",
        gap: "___ a mistake",
        answer: "make",
        distractors: ["do", "have"],
        emoji: "❌",
      },
      {
        en: "make friends",
        pl: "zaprzyjaźnić się",
        gap: "___ friends",
        answer: "make",
        distractors: ["do", "have"],
        emoji: "👫",
        whyPl:
          "„have friends” znaczy MIEĆ przyjaciół (stan); zaprzyjaźnianie się to make friends (czynność).",
      },
    ],
  },
  // --- 12. Dom i rodzina (2026-09-30) ---
  {
    "id": "home-family",
    "titlePl": "Dom i rodzina",
    "goalPl": "Jak zaprosić kolegę do domu i pokazać mu swoją rodzinę.",
    "emoji": "🏠",
    "heroId": "flame",
    "parentIntroPl": "W Anglii mówi się mum (nie amerykańskie mom), a na babcię dzieci mówią zwykle nan albo nana — grandma też jest poprawne. Uwaga na tea: po południu i wieczorem to często kolacja, a „Tea's ready!” znaczy „chodź jeść”. W domu kolegi dziecko zapyta o toilet (potocznie loo) — bathroom to raczej łazienka z wanną. Ćwiczcie przy okazji: oprowadźcie się nawzajem po domu po angielsku i przedstawiajcie rodzinę na zdjęciach („This is my dad”).",
    "words": [
      {
        "en": "mum",
        "pl": "mama",
        "emoji": "👩",
        "notePl": "Brytyjskie mum. Amerykańskie mom dziecko zna z bajek."
      },
      {
        "en": "dad",
        "pl": "tata",
        "emoji": "👨"
      },
      {
        "en": "brother",
        "pl": "brat",
        "emoji": "👦"
      },
      {
        "en": "sister",
        "pl": "siostra",
        "emoji": "👧"
      },
      {
        "en": "nan",
        "pl": "babcia",
        "emoji": "👵",
        "notePl": "Potocznie nan albo nana; grandma też jest poprawne, ale od dzieci częściej usłyszysz nan."
      },
      {
        "en": "grandad",
        "pl": "dziadek",
        "emoji": "👴"
      },
      {
        "en": "kitchen",
        "pl": "kuchnia",
        "emoji": "🍳"
      },
      {
        "en": "bathroom",
        "pl": "łazienka",
        "emoji": "🛁"
      },
      {
        "en": "bedroom",
        "pl": "pokój, sypialnia",
        "emoji": "🛏️",
        "notePl": "Pokój dziecka to też bedroom: my bedroom = mój pokój."
      },
      {
        "en": "sofa",
        "pl": "kanapa",
        "emoji": "🛋️"
      },
      {
        "en": "stairs",
        "pl": "schody",
        "emoji": "⬆️",
        "notePl": "Zawsze w liczbie mnogiej: the stairs. Upstairs = na górze, downstairs = na dole."
      }
    ],
    "phrases": [
      {
        "en": "This is my mum.",
        "pl": "To jest moja mama.",
        "situationPl": "Kolega przyszedł do Ciebie i widzi Twoją mamę.",
        "emoji": "👩"
      },
      {
        "en": "Have you got any brothers or sisters?",
        "pl": "Masz rodzeństwo?",
        "situationPl": "Chcesz się dowiedzieć, czy kolega ma brata albo siostrę.",
        "emoji": "👫"
      },
      {
        "en": "Do you want to come to my house?",
        "pl": "Chcesz przyjść do mnie?",
        "situationPl": "Chcesz zaprosić kolegę do siebie do domu.",
        "emoji": "🏠"
      },
      {
        "en": "Come and see my room!",
        "pl": "Chodź, zobacz mój pokój!",
        "situationPl": "Kolega jest u Ciebie, a Ty chcesz mu pokazać swoje zabawki.",
        "emoji": "🛏️"
      },
      {
        "en": "Where's the toilet?",
        "pl": "Gdzie jest toaleta?",
        "situationPl": "Jesteś u kolegi w domu i musisz iść do toalety.",
        "emoji": "🚽"
      },
      {
        "en": "Let's play in the garden.",
        "pl": "Chodźmy pobawić się w ogrodzie.",
        "situationPl": "Nudzi Ci się w domu, a na dworze jest ładnie.",
        "emoji": "🌳"
      }
    ],
    "commands": [
      {
        "en": "Tidy your room.",
        "pl": "Posprzątaj pokój.",
        "actionPl": "Sprzątasz zabawki w swoim pokoju.",
        "emoji": "🧹"
      },
      {
        "en": "Come downstairs, please.",
        "pl": "Zejdź na dół, proszę.",
        "actionPl": "Schodzisz po schodach na dół.",
        "emoji": "⬇️"
      },
      {
        "en": "Wipe your feet.",
        "pl": "Wytrzyj buty.",
        "actionPl": "Wycierasz buty o wycieraczkę przy drzwiach.",
        "emoji": "👞"
      }
    ],
    "situations": [
      {
        "en": "What do you do when a friend comes to your house? Show me!",
        "pl": "Co robisz, kiedy kolega przychodzi do Ciebie? Pokaż!",
        "actionPl": "Otwierasz drzwi, mówisz „Hi! Come in!” i prowadzisz go do swojego pokoju.",
        "emoji": "🚪"
      }
    ],
    "collocations": [
      {
        "en": "at home",
        "pl": "w domu",
        "gap": "___ home",
        "answer": "at",
        "distractors": [
          "in",
          "on"
        ],
        "emoji": "🏠",
        "whyPl": "Po polsku „w domu”, więc kusi „in home”. Po angielsku mówi się at home."
      },
      {
        "en": "watch TV",
        "pl": "oglądać telewizję",
        "gap": "___ TV",
        "answer": "watch",
        "distractors": [
          "look",
          "see"
        ],
        "emoji": "📺",
        "whyPl": "Polskie „oglądać” i „patrzeć” podsuwają look albo see, ale telewizję się watch."
      },
      {
        "en": "play in the garden",
        "pl": "bawić się w ogrodzie, na podwórku",
        "gap": "play ___ the garden",
        "answer": "in",
        "distractors": [
          "on",
          "at"
        ],
        "emoji": "🌳",
        "whyPl": "Polskie „na podwórku” podsuwa on albo at, a po angielsku bawimy się in the garden."
      }
    ]
  },

  // --- 13. Plac zabaw i zabawy (2026-09-30) ---
  {
    "id": "playground",
    "titlePl": "Plac zabaw i zabawy",
    "goalPl": "Jak dołączyć do zabawy i bawić się z dziećmi na przerwie.",
    "emoji": "🤸",
    "heroId": "buzz",
    "parentIntroPl": "Brytyjski plac zabaw ma swoje słowa: roundabout (karuzela, a nie rondo), sandpit (piaskownica, w USA sandbox), climbing frame (drabinki, w USA jungle gym). Berek to tag, ale w wielu szkołach mówią tig albo it — kto goni, ten „is it”. „Can I have a go?” to bardzo brytyjskie „Mogę spróbować?”. Najlepiej ćwiczyć w ruchu: w parku bawcie się w berka i chowanego, mówiąc tylko po angielsku „I'm it!”, „Catch me!”, „Wait for me!”.",
    "words": [
      {
        "en": "swing",
        "pl": "huśtawka",
        "emoji": "🌳",
        "notePl": "Na placu zwykle w liczbie mnogiej: „Let's go on the swings!”."
      },
      {
        "en": "slide",
        "pl": "zjeżdżalnia",
        "emoji": "🎢"
      },
      {
        "en": "climbing frame",
        "pl": "drabinki (do wspinania)",
        "emoji": "🧗",
        "notePl": "Brytyjskie climbing frame, amerykańskie jungle gym."
      },
      {
        "en": "monkey bars",
        "pl": "drążki (przechodzi się po nich na rękach)",
        "emoji": "🐒",
        "notePl": "Stoją prawie na każdym brytyjskim placu zabaw i szkolnym boisku."
      },
      {
        "en": "seesaw",
        "pl": "huśtawka-ważka",
        "emoji": "⚖️"
      },
      {
        "en": "roundabout",
        "pl": "karuzela (na placu zabaw)",
        "emoji": "🎠",
        "notePl": "Fałszywy przyjaciel: na ulicy roundabout to rondo, na placu zabaw — kręcąca się karuzela."
      },
      {
        "en": "sandpit",
        "pl": "piaskownica",
        "emoji": "🏖️",
        "notePl": "Brytyjskie sandpit, amerykańskie sandbox."
      },
      {
        "en": "tag",
        "pl": "berek",
        "emoji": "🏃",
        "notePl": "W wielu szkołach mówią też tig albo it. Ten, kto goni, „is it”."
      },
      {
        "en": "hide and seek",
        "pl": "chowany",
        "emoji": "🙈"
      },
      {
        "en": "skipping rope",
        "pl": "skakanka",
        "emoji": "➰",
        "notePl": "Brytyjskie skipping rope, amerykańskie jump rope."
      },
      {
        "en": "hopscotch",
        "pl": "klasy (gra)",
        "emoji": "🔢"
      },
      {
        "en": "bench",
        "pl": "ławka",
        "emoji": "💺",
        "notePl": "W wielu szkołach jest „buddy bench” — kto na niej usiądzie, ten szuka kolegi do zabawy."
      }
    ],
    "phrases": [
      {
        "en": "Can I play?",
        "pl": "Mogę się z wami bawić?",
        "situationPl": "Dzieci się bawią, a Ty chcesz dołączyć.",
        "emoji": "🙋"
      },
      {
        "en": "Let's play hide and seek!",
        "pl": "Zagrajmy w chowanego!",
        "situationPl": "Kolega pyta, w co się bawicie. Ty masz pomysł.",
        "emoji": "🙈"
      },
      {
        "en": "I'm it!",
        "pl": "Ja gonię!",
        "situationPl": "Bawicie się w berka i teraz Ty gonisz.",
        "emoji": "🏃"
      },
      {
        "en": "Catch me!",
        "pl": "Złap mnie!",
        "situationPl": "Kolega goni, a Ty uciekasz.",
        "emoji": "😄"
      },
      {
        "en": "Wait for me!",
        "pl": "Zaczekaj na mnie!",
        "situationPl": "Dzieci biegną, a Ty zostajesz z tyłu.",
        "emoji": "✋"
      },
      {
        "en": "Can I have a go?",
        "pl": "Mogę spróbować?",
        "situationPl": "Kolega skacze na skakance, a Ty też chcesz.",
        "emoji": "🙏"
      }
    ],
    "commands": [
      {
        "en": "Line up when you hear the whistle.",
        "pl": "Ustawcie się w rzędzie, gdy usłyszycie gwizdek.",
        "actionPl": "Słyszysz gwizdek, przestajesz się bawić i stajesz w rzędzie.",
        "emoji": "🚶"
      },
      {
        "en": "Stand still!",
        "pl": "Stój w miejscu!",
        "actionPl": "Zatrzymujesz się i nie ruszasz.",
        "emoji": "🛑"
      },
      {
        "en": "One at a time on the slide.",
        "pl": "Na zjeżdżalnię po jednym.",
        "actionPl": "Czekasz, aż kolega zjedzie, i dopiero wtedy zjeżdżasz Ty.",
        "emoji": "☝️"
      },
      {
        "en": "Come down from there, please.",
        "pl": "Zejdź stamtąd, proszę.",
        "actionPl": "Schodzisz na dół z drabinek.",
        "emoji": "⬇️"
      }
    ],
    "situations": [
      {
        "en": "What do you do when you hear the whistle? Show me!",
        "pl": "Co robisz, gdy słyszysz gwizdek? Pokaż!",
        "actionPl": "Przestajesz się bawić i idziesz ustawić się w rzędzie.",
        "emoji": "🚶"
      },
      {
        "en": "What do you do when you want to play? Show me!",
        "pl": "Co robisz, gdy chcesz się pobawić z dziećmi? Pokaż!",
        "actionPl": "Podchodzisz i pytasz: „Can I play?”.",
        "emoji": "🙋"
      }
    ],
    "collocations": [
      {
        "en": "go down the slide",
        "pl": "zjechać ze zjeżdżalni",
        "gap": "___ down the slide",
        "answer": "go",
        "distractors": [
          "ride",
          "drive"
        ],
        "emoji": "🎢",
        "whyPl": "Po polsku „zjeżdżamy”, więc kusi ride albo drive („jechać”), a po angielsku po prostu go down — „iść w dół”."
      },
      {
        "en": "join in the game",
        "pl": "dołączyć do gry",
        "gap": "join ___ the game",
        "answer": "in",
        "distractors": [
          "to",
          "with"
        ],
        "emoji": "🤝",
        "whyPl": "Polskie „dołączyć DO” podsuwa „join to”, a po angielsku mówi się join in albo samo join the game."
      },
      {
        "en": "score a goal",
        "pl": "strzelić gola",
        "gap": "___ a goal",
        "answer": "score",
        "distractors": [
          "shoot",
          "hit"
        ],
        "emoji": "⚽",
        "whyPl": "Po polsku „strzelamy” gola, więc kusi shoot. Ale shoot to tylko strzał na bramkę — gola się „score”."
      },
      {
        "en": "play tag",
        "pl": "bawić się w berka",
        "gap": "___ tag",
        "answer": "play",
        "distractors": [
          "do",
          "make"
        ],
        "emoji": "🏃",
        "whyPl": "Po polsku mówimy też „zróbmy berka”, więc kusi do albo make. Po angielsku w każdą grę po prostu play, bez „w”: play tag, play hide and seek."
      }
    ]
  },

  // --- 14. Zwierzęta i ogród (2026-09-30) ---
  {
    "id": "animals",
    "titlePl": "Zwierzęta i ogród",
    "goalPl": "Żeby zapytać o cudzego psa i pokazać, co widzisz w parku i w ogródku.",
    "emoji": "🦔",
    "heroId": "chomp",
    "parentIntroPl": "W Anglii zwierzęta to najłatwiejszy temat do rozmowy: ludzie na spacerze chętnie mówią o swoim psie, a lisy, wiewiórki, jeże i rudziki (robin, symbol brytyjskich świąt) widać w zwykłym ogródku i parku. Pułapka: głaskać to stroke, a pet w tym znaczeniu jest amerykańskie; o zwierzaku mówi się he/she, nie it. Ćwiczcie na spacerze: kto pierwszy zawoła „Look, a squirrel!”, ten ma punkt.",
    "words": [
      {
        "en": "dog",
        "pl": "pies",
        "emoji": "🐶"
      },
      {
        "en": "cat",
        "pl": "kot",
        "emoji": "🐱"
      },
      {
        "en": "fox",
        "pl": "lis",
        "emoji": "🦊",
        "notePl": "W Anglii lisy chodzą nocą nawet po miejskich ogródkach — to normalny widok."
      },
      {
        "en": "squirrel",
        "pl": "wiewiórka",
        "emoji": "🐿️",
        "notePl": "Brytyjskie wiewiórki są zwykle szare, nie rude."
      },
      {
        "en": "hedgehog",
        "pl": "jeż",
        "emoji": "🦔"
      },
      {
        "en": "bird",
        "pl": "ptak",
        "emoji": "🐦",
        "notePl": "Najczęstszy ptak w ogródku to robin (rudzik) — mały, z czerwonym brzuszkiem, jest na kartkach świątecznych."
      },
      {
        "en": "duck",
        "pl": "kaczka",
        "emoji": "🦆"
      },
      {
        "en": "spider",
        "pl": "pająk",
        "emoji": "🕷️",
        "notePl": "Jesienią w angielskich domach pełno pająków — dzieci wołają wtedy „There's a spider!”."
      },
      {
        "en": "garden",
        "pl": "ogród, ogródek",
        "emoji": "🏡",
        "notePl": "Brytyjskie garden to też mały ogródek za domem. Amerykanie mówią yard."
      },
      {
        "en": "grass",
        "pl": "trawa",
        "emoji": "🌱"
      },
      {
        "en": "tree",
        "pl": "drzewo",
        "emoji": "🌳"
      },
      {
        "en": "flower",
        "pl": "kwiat",
        "emoji": "🌷"
      }
    ],
    "phrases": [
      {
        "en": "What's your dog called?",
        "pl": "Jak się nazywa twój pies?",
        "situationPl": "Spotykasz kolegę z psem i chcesz wiedzieć, jak pies ma na imię.",
        "emoji": "🐶"
      },
      {
        "en": "Can I stroke him?",
        "pl": "Mogę go pogłaskać?",
        "situationPl": "Chcesz pogłaskać cudzego psa.",
        "emoji": "🤚"
      },
      {
        "en": "Is he friendly?",
        "pl": "Czy on jest łagodny?",
        "situationPl": "Nie wiesz, czy pies nie ugryzie.",
        "emoji": "🐕"
      },
      {
        "en": "Have you got a pet?",
        "pl": "Masz jakieś zwierzątko?",
        "situationPl": "Chcesz zapytać kolegę, czy ma w domu zwierzę.",
        "emoji": "🐱"
      },
      {
        "en": "Look, a squirrel!",
        "pl": "Patrz, wiewiórka!",
        "situationPl": "Widzisz wiewiórkę i chcesz ją pokazać.",
        "emoji": "🐿️"
      },
      {
        "en": "There's a fox in the garden!",
        "pl": "W ogrodzie jest lis!",
        "situationPl": "Patrzysz przez okno i widzisz lisa.",
        "emoji": "🦊"
      }
    ],
    "commands": [
      {
        "en": "Be gentle.",
        "pl": "Delikatnie.",
        "actionPl": "Głaszczesz zwierzę powoli i delikatnie.",
        "emoji": "🤲"
      },
      {
        "en": "Leave it alone.",
        "pl": "Zostaw go w spokoju.",
        "actionPl": "Odsuwasz się i nie dotykasz zwierzęcia.",
        "emoji": "✋"
      },
      {
        "en": "Don't pick the flowers.",
        "pl": "Nie zrywaj kwiatów.",
        "actionPl": "Patrzysz na kwiaty, ale ich nie zrywasz.",
        "emoji": "🌷"
      },
      {
        "en": "Keep off the grass.",
        "pl": "Nie wchodź na trawnik.",
        "actionPl": "Idziesz ścieżką, nie po trawie.",
        "emoji": "🚫"
      }
    ],
    "situations": [
      {
        "en": "What do you do when you meet a new dog? Show me!",
        "pl": "Co robisz, kiedy spotykasz nowego psa? Pokaż!",
        "actionPl": "Najpierw pytasz właściciela, potem powoli wyciągasz rękę, żeby pies ją powąchał.",
        "emoji": "🐕"
      }
    ],
    "collocations": [
      {
        "en": "walk the dog",
        "pl": "wyprowadzić psa",
        "gap": "___ the dog",
        "answer": "walk",
        "distractors": [
          "go",
          "bring"
        ],
        "emoji": "🐕",
        "whyPl": "Polskie „iść z psem” podsuwa go, a „wyprowadzić” — bring. Po angielsku psa się po prostu „spaceruje”: walk the dog."
      },
      {
        "en": "feed the ducks",
        "pl": "karmić kaczki",
        "gap": "___ the ducks",
        "answer": "feed",
        "distractors": [
          "give",
          "eat"
        ],
        "emoji": "🦆",
        "whyPl": "„Karmić” to jedno słowo: feed. Polskie „dać kaczkom jeść” podsuwa give albo eat, ale give wymaga jeszcze jedzenia (give the ducks some bread), a eat to jeść samemu."
      },
      {
        "en": "pick flowers",
        "pl": "zrywać kwiaty",
        "gap": "___ flowers",
        "answer": "pick",
        "distractors": [
          "tear",
          "break"
        ],
        "emoji": "🌷",
        "whyPl": "Polskie „rwać / zerwać kwiatek” podsuwa tear albo break, ale tear to drzeć (papier), a break to łamać. Kwiaty się pick."
      },
      {
        "en": "climb a tree",
        "pl": "wejść na drzewo",
        "gap": "___ a tree",
        "answer": "climb",
        "distractors": [
          "go",
          "enter"
        ],
        "emoji": "🌳",
        "whyPl": "Na drzewo się nie „wchodzi” (go / enter), tylko wspina: climb."
      }
    ]
  },

  // --- 15. Kolacja w domu (2026-09-30) ---
  {
    "id": "dinner",
    "titlePl": "Kolacja w domu",
    "goalPl": "Jak przy stole poprosić o więcej, podziękować i powiedzieć, że już masz dość.",
    "emoji": "🍝",
    "heroId": "moon",
    "parentIntroPl": "Największa pułapka: w Anglii „tea” to często wieczorny posiłek, czyli kolacja — „What's for tea?” znaczy „Co na kolację?”, a nie pytanie o herbatę. Podobnie „pudding” to po prostu deser, a „beans” to fasolka w sosie pomidorowym z puszki, jedzona np. na tostach. Najłatwiej ćwiczyć przy prawdziwym stole: jeden posiłek w tygodniu po angielsku, z prośbami „Can you pass the…?” i „Can I have more, please?”.",
    "words": [
      {
        "en": "tea",
        "pl": "kolacja (wieczorny posiłek)",
        "emoji": "🥘",
        "notePl": "W Anglii „tea” to często kolacja! „Tea's ready!” = „Kolacja gotowa!”. Herbata to też tea — rozpoznajesz po sytuacji."
      },
      {
        "en": "pasta",
        "pl": "makaron",
        "emoji": "🍝"
      },
      {
        "en": "soup",
        "pl": "zupa",
        "emoji": "🍲"
      },
      {
        "en": "toast",
        "pl": "tost, grzanka",
        "emoji": "🍞"
      },
      {
        "en": "beans",
        "pl": "fasolka (w sosie pomidorowym)",
        "emoji": "🥫",
        "notePl": "Brytyjskie baked beans — słodka fasolka z puszki, bardzo popularna, np. „beans on toast”."
      },
      {
        "en": "fish fingers",
        "pl": "paluszki rybne",
        "emoji": "🐟",
        "notePl": "Brytyjskie fish fingers, amerykańskie fish sticks."
      },
      {
        "en": "chicken",
        "pl": "kurczak",
        "emoji": "🍗"
      },
      {
        "en": "pudding",
        "pl": "deser",
        "emoji": "🍮",
        "notePl": "W Anglii „pudding” to każdy deser po obiedzie, nie tylko budyń. „What's for pudding?” = „Co na deser?”."
      },
      {
        "en": "knife",
        "pl": "nóż",
        "emoji": "🔪",
        "notePl": "Litera k na początku jest niema: „najf”."
      },
      {
        "en": "plate",
        "pl": "talerz",
        "emoji": "🍽️"
      },
      {
        "en": "bowl",
        "pl": "miska",
        "emoji": "🥣"
      },
      {
        "en": "glass",
        "pl": "szklanka",
        "emoji": "🥛"
      }
    ],
    "phrases": [
      {
        "en": "What's for tea?",
        "pl": "Co na kolację?",
        "situationPl": "Wracasz do domu i jesteś ciekawy, co będzie do jedzenia.",
        "emoji": "🤔"
      },
      {
        "en": "Can I have more, please?",
        "pl": "Mogę prosić o dokładkę?",
        "situationPl": "Zjadłeś wszystko i masz ochotę na jeszcze.",
        "emoji": "😋"
      },
      {
        "en": "I'm full.",
        "pl": "Najadłem się.",
        "situationPl": "Dostajesz jeszcze jedzenia, a już nic nie zmieścisz.",
        "emoji": "😌"
      },
      {
        "en": "Can you pass the ketchup, please?",
        "pl": "Podasz mi keczup, proszę?",
        "situationPl": "Chcesz keczupu, ale stoi daleko, po drugiej stronie stołu.",
        "emoji": "🍅"
      },
      {
        "en": "Can I get down, please?",
        "pl": "Mogę już wstać od stołu?",
        "situationPl": "Skończyłeś jeść i chcesz już iść się bawić.",
        "emoji": "🚶"
      },
      {
        "en": "That was lovely!",
        "pl": "To było pyszne!",
        "situationPl": "Kolacja bardzo Ci smakowała i chcesz to powiedzieć.",
        "emoji": "😊"
      }
    ],
    "commands": [
      {
        "en": "Tea's ready!",
        "pl": "Kolacja gotowa!",
        "actionPl": "Przychodzisz do stołu.",
        "emoji": "🔔"
      },
      {
        "en": "Lay the table, please.",
        "pl": "Nakryj do stołu.",
        "actionPl": "Kładziesz talerze, noże i widelce na stole.",
        "emoji": "🍽️"
      },
      {
        "en": "Put your plate in the sink.",
        "pl": "Włóż talerz do zlewu.",
        "actionPl": "Zanosisz swój talerz do zlewu.",
        "emoji": "🚰"
      },
      {
        "en": "Use your knife and fork.",
        "pl": "Jedz nożem i widelcem.",
        "actionPl": "Bierzesz nóż i widelec i kroisz jedzenie.",
        "emoji": "🍴"
      }
    ],
    "situations": [
      {
        "en": "What do you do when you're full? Show me!",
        "pl": "Co robisz, kiedy już się najadłeś? Pokaż!",
        "actionPl": "Klepiesz się po brzuchu i odsuwasz talerz.",
        "emoji": "😌"
      },
      {
        "en": "What do you do when tea is ready? Show me!",
        "pl": "Co robisz, kiedy kolacja jest gotowa? Pokaż!",
        "actionPl": "Myjesz ręce i siadasz do stołu.",
        "emoji": "🔔"
      }
    ],
    "collocations": [
      {
        "en": "lay the table",
        "pl": "nakryć do stołu",
        "gap": "___ the table",
        "answer": "lay",
        "distractors": [
          "cover",
          "prepare"
        ],
        "emoji": "🍽️",
        "whyPl": "Polskie „nakryć” podsuwa „cover”, a „przygotować stół” — „prepare”. Po angielsku stół się „kładzie”: lay the table (Amerykanie mówią set the table)."
      },
      {
        "en": "clear the table",
        "pl": "sprzątnąć ze stołu",
        "gap": "___ the table",
        "answer": "clear",
        "distractors": [
          "clean",
          "tidy"
        ],
        "emoji": "🧽",
        "whyPl": "Zabieranie naczyń po jedzeniu to „clear” — jakby „opróżnić” stół. „Clean the table” to przetrzeć go ściereczką."
      },
      {
        "en": "do the washing-up",
        "pl": "pozmywać naczynia",
        "gap": "___ the washing-up",
        "answer": "do",
        "distractors": [
          "make",
          "wash"
        ],
        "emoji": "🧼",
        "whyPl": "Polskie „zrobić zmywanie” podsuwa „make”, a „zmywać = myć” podsuwa „wash”. Brytyjskie „washing-up” to zmywanie, a obowiązki domowe się „robi” — do."
      },
      {
        "en": "have tea",
        "pl": "zjeść kolację",
        "gap": "___ tea",
        "answer": "have",
        "distractors": [
          "eat",
          "drink"
        ],
        "emoji": "🥘",
        "whyPl": "Polskie „jeść kolację” podsuwa „eat”, a słowo „tea” kusi, żeby je „pić” — drink. Posiłki po angielsku się „ma”: have tea, have breakfast."
      }
    ]
  },

  // --- 16. Dni tygodnia i plan dnia (2026-09-30) ---
  {
    "id": "days-week",
    "titlePl": "Dni tygodnia i plan dnia",
    "goalPl": "Żebyś wiedział, jaki dziś dzień i co będzie jutro.",
    "emoji": "🗓️",
    "heroId": "speed",
    "parentIntroPl": "Dni tygodnia po angielsku zawsze piszemy wielką literą (Monday, nie monday). Brytyjczycy mówią „at the weekend”, a nie amerykańskie „on the weekend” z bajek; „w poniedziałek” to „on Monday”, a nie „in Monday”. Częsty polski błąd: „yesterday night” zamiast „last night” (wczoraj wieczorem). W domu wystarczy rano zapytać „What day is it today?”, a przy kolacji „What did you do today?”.",
    "words": [
      {
        "en": "Monday",
        "pl": "poniedziałek",
        "emoji": "1️⃣",
        "notePl": "Dni tygodnia piszemy wielką literą."
      },
      {
        "en": "Tuesday",
        "pl": "wtorek",
        "emoji": "2️⃣",
        "notePl": "Łatwo pomylić z Thursday — Tuesday zaczyna się od „tju”."
      },
      {
        "en": "Wednesday",
        "pl": "środa",
        "emoji": "3️⃣",
        "notePl": "Czytamy „łenzdej” — pierwsze „d” jest nieme."
      },
      {
        "en": "Thursday",
        "pl": "czwartek",
        "emoji": "4️⃣",
        "notePl": "Zaczyna się od „th” jak w „three”."
      },
      {
        "en": "Friday",
        "pl": "piątek",
        "emoji": "5️⃣"
      },
      {
        "en": "Saturday",
        "pl": "sobota",
        "emoji": "6️⃣"
      },
      {
        "en": "Sunday",
        "pl": "niedziela",
        "emoji": "7️⃣",
        "notePl": "W brytyjskich kalendarzach tydzień bywa zaczynany od niedzieli."
      },
      {
        "en": "weekend",
        "pl": "weekend",
        "emoji": "🎉",
        "notePl": "Brytyjskie „at the weekend”, amerykańskie „on the weekend”."
      },
      {
        "en": "week",
        "pl": "tydzień",
        "emoji": "📆"
      },
      {
        "en": "today",
        "pl": "dzisiaj",
        "emoji": "📍"
      },
      {
        "en": "tomorrow",
        "pl": "jutro",
        "emoji": "➡️"
      },
      {
        "en": "yesterday",
        "pl": "wczoraj",
        "emoji": "⬅️"
      }
    ],
    "phrases": [
      {
        "en": "What day is it today?",
        "pl": "Jaki dziś jest dzień?",
        "situationPl": "Rano nie pamiętasz, jaki jest dzień.",
        "emoji": "🤔"
      },
      {
        "en": "It's Monday.",
        "pl": "Jest poniedziałek.",
        "situationPl": "Ktoś pyta Cię, jaki dziś dzień.",
        "emoji": "📅"
      },
      {
        "en": "See you on Monday!",
        "pl": "Do zobaczenia w poniedziałek!",
        "situationPl": "Jest piątek, żegnasz się z kolegą przed weekendem.",
        "emoji": "👋"
      },
      {
        "en": "Have a nice weekend!",
        "pl": "Miłego weekendu!",
        "situationPl": "Wychodzisz ze szkoły w piątek i żegnasz panią.",
        "emoji": "😊"
      },
      {
        "en": "What did you do at the weekend?",
        "pl": "Co robiłeś w weekend?",
        "situationPl": "Jest poniedziałek, chcesz zapytać kolegę o weekend.",
        "emoji": "💬"
      },
      {
        "en": "I went to the park.",
        "pl": "Byłem w parku.",
        "situationPl": "Ktoś pyta, co robiłeś w weekend.",
        "emoji": "🌳"
      }
    ],
    "commands": [
      {
        "en": "Say the days of the week.",
        "pl": "Powiedz dni tygodnia.",
        "actionPl": "Wymieniasz po kolei dni od poniedziałku.",
        "emoji": "🗣️"
      },
      {
        "en": "Tell me about your weekend.",
        "pl": "Opowiedz mi o swoim weekendzie.",
        "actionPl": "Mówisz jedno zdanie o tym, co robiłeś w weekend.",
        "emoji": "🙋"
      },
      {
        "en": "Bring it in tomorrow.",
        "pl": "Przynieś to jutro.",
        "actionPl": "Pakujesz tę rzecz do plecaka na jutro.",
        "emoji": "🎒"
      }
    ],
    "situations": [],
    "collocations": [
      {
        "en": "on Monday",
        "pl": "w poniedziałek",
        "gap": "___ Monday",
        "answer": "on",
        "distractors": [
          "in",
          "at"
        ],
        "emoji": "📅",
        "whyPl": "Przed dniem tygodnia zawsze „on”. Polskie „w poniedziałek” podsuwa „in”."
      },
      {
        "en": "at the weekend",
        "pl": "w weekend",
        "gap": "___ the weekend",
        "answer": "at",
        "distractors": [
          "in",
          "on"
        ],
        "emoji": "🎉",
        "whyPl": "W Anglii mówi się „at the weekend”. „On the weekend” to wersja amerykańska z bajek, a „in” podsuwa polskie „w weekend”."
      },
      {
        "en": "at night",
        "pl": "w nocy",
        "gap": "___ night",
        "answer": "at",
        "distractors": [
          "in",
          "on"
        ],
        "emoji": "🌙",
        "whyPl": "Mówimy „in the morning”, ale „at night”. Polskie „w nocy” podsuwa „in”, a „on” to kalka z „on Monday”."
      },
      {
        "en": "last night",
        "pl": "wczoraj wieczorem",
        "gap": "___ night",
        "answer": "last",
        "distractors": [
          "yesterday",
          "past"
        ],
        "emoji": "🛌",
        "whyPl": "Polskie „wczoraj wieczorem” podsuwa „yesterday night”, a „zeszła noc” — „past night”. Po angielsku mówi się tylko „last night”."
      }
    ]
  },

  // --- 17. Zakupy i sklep (2026-09-30) ---
  {
    "id": "shopping",
    "titlePl": "Zakupy i sklep",
    "goalPl": "Sam zapytasz, ile coś kosztuje, i sam zapłacisz.",
    "emoji": "🛒",
    "heroId": "spark",
    "parentIntroPl": "W Anglii płaci się funtami i pensami (1 pound = 100 pence), a dzieci mówią „p” zamiast „pence”: „50p” czyta się „fifty p”. Kasa to till (AmE checkout/register), wózek to trolley (AmE cart), kolejka to queue (AmE line) — w kolejce stoi się cierpliwie, wpychanie się jest bardzo źle widziane. Pułapka: „change” przy kasie to reszta, a nie „zmiana”. Najlepiej ćwiczyć w prawdziwym sklepie: niech dziecko samo poda pieniądze przy kasie i powie „Thank you, bye!”.",
    "words": [
      {
        "en": "shop",
        "pl": "sklep",
        "emoji": "🏪",
        "notePl": "Brytyjskie shop; amerykańskie store dziecko zna z bajek."
      },
      {
        "en": "supermarket",
        "pl": "supermarket",
        "emoji": "🏬"
      },
      {
        "en": "trolley",
        "pl": "wózek sklepowy",
        "emoji": "🛒",
        "notePl": "Brytyjskie trolley, amerykańskie cart."
      },
      {
        "en": "basket",
        "pl": "koszyk",
        "emoji": "🧺"
      },
      {
        "en": "money",
        "pl": "pieniądze",
        "emoji": "💰"
      },
      {
        "en": "pound",
        "pl": "funt",
        "emoji": "💷",
        "notePl": "Brytyjska waluta. Znak £ stoi przed liczbą: £2 = „two pounds”."
      },
      {
        "en": "pence",
        "pl": "pensy",
        "emoji": "💸",
        "notePl": "Brytyjskie „grosze”. Potocznie „p”: 20p = „twenty p”. 100 pence to jeden funt."
      },
      {
        "en": "till",
        "pl": "kasa (w sklepie)",
        "emoji": "🧾",
        "notePl": "Brytyjskie till; amerykańskie register albo checkout."
      },
      {
        "en": "change",
        "pl": "reszta",
        "emoji": "🤲",
        "notePl": "Fałszywy przyjaciel: przy kasie change to reszta, nie „zmiana”."
      },
      {
        "en": "queue",
        "pl": "kolejka",
        "emoji": "🚶",
        "notePl": "Brytyjskie queue (czyt. „kju”); amerykańskie line. W Anglii w kolejce stoi się cierpliwie."
      },
      {
        "en": "pocket money",
        "pl": "kieszonkowe",
        "emoji": "👛"
      }
    ],
    "phrases": [
      {
        "en": "How much is it?",
        "pl": "Ile to kosztuje?",
        "situationPl": "Chcesz wiedzieć, ile kosztuje zabawka.",
        "emoji": "🏷️"
      },
      {
        "en": "Can I have this, please?",
        "pl": "Poproszę to.",
        "situationPl": "Podajesz sprzedawcy rzecz, którą chcesz kupić.",
        "emoji": "🙏"
      },
      {
        "en": "Can I pay?",
        "pl": "Mogę zapłacić?",
        "situationPl": "Jesteś przy kasie z mamą i chcesz sam dać pieniądze.",
        "emoji": "💳"
      },
      {
        "en": "Can I push the trolley?",
        "pl": "Mogę pchać wózek?",
        "situationPl": "Wchodzisz z rodzicem do supermarketu i chcesz sam pchać wózek.",
        "emoji": "🛒"
      },
      {
        "en": "Thank you, bye!",
        "pl": "Dziękuję, do widzenia!",
        "situationPl": "Zapłaciłeś i wychodzisz ze sklepu.",
        "emoji": "👋"
      }
    ],
    "commands": [
      {
        "en": "Stay with me.",
        "pl": "Zostań przy mnie.",
        "actionPl": "Idziesz blisko mamy i się nie oddalasz.",
        "emoji": "🤝"
      },
      {
        "en": "Put it back, please.",
        "pl": "Odłóż to, proszę.",
        "actionPl": "Odkładasz rzecz z powrotem na półkę.",
        "emoji": "↩️"
      },
      {
        "en": "Wait in the queue.",
        "pl": "Poczekaj w kolejce.",
        "actionPl": "Stoisz spokojnie w kolejce do kasy.",
        "emoji": "⏳"
      },
      {
        "en": "Put it in the trolley.",
        "pl": "Włóż to do wózka.",
        "actionPl": "Wkładasz rzecz do wózka.",
        "emoji": "📥"
      }
    ],
    "situations": [
      {
        "en": "What do you do when you can't find your mum in the shop? Show me!",
        "pl": "Co robisz, gdy zgubisz mamę w sklepie? Pokaż!",
        "actionPl": "Stajesz w miejscu i prosisz pracownika sklepu o pomoc.",
        "emoji": "🙋"
      }
    ],
    "collocations": [
      {
        "en": "go shopping",
        "pl": "iść na zakupy",
        "gap": "___ shopping",
        "answer": "go",
        "distractors": [
          "make",
          "walk"
        ],
        "emoji": "🛍️",
        "whyPl": "Na zakupy się „idzie” jak na basen: go shopping, go swimming. Polskie „robić zakupy” podsuwa „make”, a „iść” kusi „walk” — ale walk to iść pieszo, a nie wybrać się gdzieś."
      },
      {
        "en": "spend your pocket money",
        "pl": "wydać kieszonkowe",
        "gap": "___ your pocket money",
        "answer": "spend",
        "distractors": [
          "give",
          "pay"
        ],
        "emoji": "👛",
        "whyPl": "Polskie „wydać” kojarzy się z „dać”, więc kusi „give”. Pieniądze na coś się spend; pay to płacić komuś albo za coś."
      },
      {
        "en": "join the queue",
        "pl": "stanąć w kolejce",
        "gap": "___ the queue",
        "answer": "join",
        "distractors": [
          "stand",
          "make"
        ],
        "emoji": "🚶",
        "whyPl": "Po polsku „stajemy w kolejce”, więc kusi „stand”. Po angielsku do kolejki się dołącza: join the queue (albo stand IN the queue — z „in”)."
      },
      {
        "en": "push the trolley",
        "pl": "pchać wózek",
        "gap": "___ the trolley",
        "answer": "push",
        "distractors": [
          "drive",
          "lead"
        ],
        "emoji": "🛒",
        "whyPl": "Po polsku „prowadzimy” wózek, ale po angielsku wózek się pcha: push."
      }
    ]
  },
];

export const TOPICS_BY_ID: Record<string, Topic> = Object.fromEntries(
  TOPICS.map((topic) => [topic.id, topic]),
);

export function getTopic(id: string): Topic | undefined {
  return TOPICS_BY_ID[id];
}

export function hasTopic(id: string): boolean {
  return id in TOPICS_BY_ID;
}

/** Kolejność w module = kolejność w tablicy TOPICS (od najpilniejszego). */
export function topicIndex(id: string): number {
  return TOPICS.findIndex((topic) => topic.id === id);
}

/** Ile pozycji materiału ma temat — do pokazania na kafelku. */
export function topicSize(topic: Topic): number {
  return (
    topic.words.length +
    topic.phrases.length +
    topic.commands.length +
    (topic.situations?.length ?? 0) +
    topic.collocations.length
  );
}

/**
 * Wszystkie POJEDYNCZE słowa modułu — te trafiają do /audio/words, tam gdzie
 * leżą już nagrania toru 1, więc słowo wspólne dla obu torów ma jeden plik.
 */
export function vocabWords(): string[] {
  const words = new Set<string>();
  for (const topic of TOPICS) {
    topic.words.forEach((word) => words.add(word.en));
    topic.collocations.forEach((collocation) => {
      words.add(collocation.answer);
      collocation.distractors.forEach((distractor) => words.add(distractor));
    });
  }
  return [...words].sort();
}

/**
 * Nazwa pliku audio z dowolnego tekstu: małe litery, bez znaków przestankowych,
 * spacje jako myślniki. „Can I go to the toilet, please?" →
 * „can-i-go-to-the-toilet-please", „pencil case" → „pencil-case".
 *
 * Używana dla ZWROTÓW i dla SŁÓW. Dla zwykłego słowa („cat") jest tożsama ze
 * zwykłym zmniejszeniem liter, więc nazwy nagrań toru 1 się nie zmieniają — ale
 * hasła wielowyrazowe („pencil case") dostają poprawną nazwę bez spacji.
 *
 * Mieszka TUTAJ, a nie w lib/audio.ts, z jednego powodu: generator nagrań
 * (scripts/generate-audio.mjs) jest zwykłym skryptem Node i musi używać
 * dokładnie tej samej funkcji, bo inaczej aplikacja szukałaby innych nazw, niż
 * generator zapisał. Ten plik nie importuje niczego, więc da się go wczytać
 * poza przeglądarką; lib/audio.ts ciągnie IndexedDB i Web Audio i nie da się.
 */
export function audioSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Wszystkie CAŁE wypowiedzi modułu — zdania i wyrażenia wielowyrazowe. Idą do
 * osobnego katalogu /audio/phrases, bo nazwa pliku powstaje ze zdania, a nie ze
 * słowa (patrz audioSlug wyżej).
 */
export function vocabPhrases(): string[] {
  const phrases = new Set<string>();
  for (const topic of TOPICS) {
    topic.phrases.forEach((phrase) => phrases.add(phrase.en));
    topic.commands.forEach((command) => phrases.add(command.en));
    topic.situations?.forEach((situation) => phrases.add(situation.en));
    topic.collocations.forEach((collocation) => phrases.add(collocation.en));
  }
  return [...phrases].sort();
}
