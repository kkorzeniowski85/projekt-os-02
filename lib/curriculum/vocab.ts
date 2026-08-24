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
 *  - `collocations` — które słowa chodzą razem („brush your teeth”, nie „wash”).
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
    topic.collocations.forEach((collocation) => phrases.add(collocation.en));
  }
  return [...phrases].sort();
}
