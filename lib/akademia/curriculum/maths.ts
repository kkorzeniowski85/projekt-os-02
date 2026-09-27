/**
 * Matematyka po angielsku — treść działu SPARK.
 *
 * Nie uczymy tu matematyki od zera (dziecko ma ją z polskiej szkoły), tylko
 * JĘZYKA, w którym angielska lekcja ją podaje: liczb ze słuchu, słów działań
 * („the difference between", „share equally"), zadań z treścią, zegara i
 * zapisu, który w Anglii wygląda inaczej niż w Polsce (2.5 zamiast 2,5,
 * ÷ zamiast :, „half past three" = 3:30, a nie 2:30, „3:30 pm" zamiast 15:30).
 *
 * Wszystkie zdania brytyjskie, w rejestrze angielskiej klasy Year 3–4.
 * Każdy tekst, który pada w ćwiczeniu, ma nagranie (generator zbiera je z
 * `mathsPhrases()`), więc dziecko, które jeszcze słabo czyta, może słuchać.
 */

import {
  formatNumber,
  HUNDREDS_POOL,
  numbersWithAudio,
  numberToWords,
  TEEN_TY_PAIRS,
  THOUSANDS_POOL,
} from "./numbers";
import {
  pickSome,
  say,
  sayNumber,
  shuffle,
  type ChoiceOption,
  type Exercise,
  type Visual,
} from "@/lib/akademia/session/exercise";

export type MathsTopic = {
  id: string;
  titlePl: string;
  emoji: string;
  goalPl: string;
  parentIntroPl: string;
  build: () => Exercise[];
};

const AUDIO_NUMBERS = new Set(numbersWithAudio());

// --- Liczby ze słuchu ------------------------------------------------------------

/** Liczby łatwe do pomylenia z `value` — tylko takie, które mają nagranie. */
function confusables(value: number): number[] {
  const out = new Set<number>();
  for (const [teen, ty] of TEEN_TY_PAIRS) {
    if (value === teen) out.add(ty);
    if (value === ty) out.add(teen);
  }
  const digits = String(value);
  if (digits.length >= 2) {
    const swapped = Number(digits.slice(0, -2) + digits.slice(-1) + digits.slice(-2, -1));
    out.add(swapped);
  }
  if (value >= 100 && value < 1000) {
    // 406 ↔ 460 ↔ 46: zero w środku, zero na końcu, zgubiona setka.
    const rest = value % 100;
    const hundreds = Math.floor(value / 100);
    if (rest < 10) out.add(hundreds * 100 + rest * 10);
    if (rest % 10 === 0) out.add(hundreds * 100 + rest / 10);
    out.add(Number(`${hundreds}${rest || ""}`));
  }
  if (value >= 1000) {
    // 1,500 ↔ 1,050 („five hundred" / „and fifty"), 2,500 ↔ 250 (zgubione
    // „thousand"), 1,250 ↔ 1,205 (przestawione cyfry), sąsiedni tysiąc.
    const rest = value % 1000;
    const thousands = Math.floor(value / 1000);
    if (rest >= 100 && rest % 100 === 0) out.add(thousands * 1000 + rest / 10);
    if (rest > 0 && rest < 100 && rest % 10 === 0) out.add(thousands * 1000 + rest * 10);
    if (rest > 0 && rest % 10 === 0) out.add(thousands * 100 + rest / 10);
    out.add(thousands * 1000);
    out.add((thousands + 1) * 1000);
    out.add(thousands * 10000);
  }
  out.add(value + 1);
  out.add(value + 10);
  if (value >= 10) out.add(value - 10);
  out.delete(value);
  return [...out].filter((n) => n >= 0 && AUDIO_NUMBERS.has(n));
}

/**
 * Dwa dystraktory: najpierw pułapki ucha, a gdy ich brak (np. 888), liczby
 * z nagraniem możliwie bliskie tej samej wielkości.
 */
function distractors(value: number, count = 2): number[] {
  const picked = pickSome(confusables(value), count);
  if (picked.length >= count) return picked;
  const pool = (value >= 1000 ? THOUSANDS_POOL : value >= 100 ? HUNDREDS_POOL : [...AUDIO_NUMBERS])
    .filter((n) => n !== value && !picked.includes(n))
    .sort((a, b) => Math.abs(a - value) - Math.abs(b - value));
  return [...picked, ...pool.slice(0, count - picked.length)];
}

function hearNumberChoice(value: number, id: string): Exercise {
  const options: ChoiceOption[] = shuffle([value, ...distractors(value)]).map((n) => ({
    id: String(n),
    label: formatNumber(n),
  }));
  return {
    id,
    kind: "choice",
    exercise: "number-listen",
    item: String(value),
    heading: "Którą liczbę słyszysz?",
    sound: sayNumber(value),
    listenOnly: true,
    options,
    answer: String(value),
    columns: 3,
    explainPl: `${formatNumber(value)} = ${numberToWords(value)}${thousandsHintPl(value)}`,
    explainWhen: "wrong",
  };
}

/** Dopisek do tysięcy: skąd przecinek i gdzie pada „and". */
function thousandsHintPl(value: number): string {
  if (value < 1000) return "";
  const rest = value % 1000;
  if (rest === 0) return " — przecinek oddziela tysiące.";
  return rest < 100
    ? " — po „thousand” od razu „and”, bo nie ma setek."
    : " — przecinek w zapisie i pauza w mowie oddzielają tysiące od setek.";
}

function hearNumberTyped(value: number, id: string): Exercise {
  return {
    id,
    kind: "typed",
    exercise: "number-type",
    item: String(value),
    heading: "Posłuchaj i wpisz liczbę",
    sound: sayNumber(value),
    listenOnly: true,
    answer: value,
    revealText: `${formatNumber(value)} — ${numberToWords(value)}`,
    revealSound: sayNumber(value),
    explainPl:
      value >= 1000
        ? `Wpisz same cyfry: ${value}. W zeszycie zapisuje się z przecinkiem: ${formatNumber(value)}.`
        : value >= 100 && value % 100 !== 0
          ? "W setkach Brytyjczycy mówią „and”: one hundred AND five = 105."
          : undefined,
    explainWhen: "wrong",
  };
}

function readNumberChoice(value: number, id: string): Exercise {
  const others = distractors(value);
  return {
    id,
    kind: "choice",
    exercise: "number-read",
    item: String(value),
    heading: "Jak to się mówi po angielsku?",
    visual: { kind: "big", text: formatNumber(value) },
    options: shuffle([value, ...others]).map((n) => ({
      id: String(n),
      label: numberToWords(n),
      sound: sayNumber(n),
    })),
    answer: String(value),
    columns: 1,
  };
}

function numbersTopic(id: string, range: number[], counts: { hear: number; type: number; read: number }): () => Exercise[] {
  return () => {
    const values = pickSome(range, counts.hear + counts.type + counts.read);
    const screens: Exercise[] = [];
    values.slice(0, counts.hear).forEach((v, i) => screens.push(hearNumberChoice(v, `${id}-hear-${i}`)));
    values
      .slice(counts.hear, counts.hear + counts.read)
      .forEach((v, i) => screens.push(readNumberChoice(v, `${id}-read-${i}`)));
    values
      .slice(counts.hear + counts.read)
      .forEach((v, i) => screens.push(hearNumberTyped(v, `${id}-type-${i}`)));
    return screens;
  };
}

function teensTensSession(): Exercise[] {
  const screens: Exercise[] = [
    {
      id: "teen-ty-learn",
      kind: "learn",
      exercise: "learn",
      item: "teen-ty",
      heading: "-teen czy -ty?",
      promptEn: "thirteen — thirty",
      bodyPl:
        "Najczęstsza pułapka ucha. W „thirTEEN” akcent pada na koniec, a „-teen” jest długie jak „tiin”. W „THIRty” akcent jest na początku, a końcówka krótka i cicha. Posłuchaj par:",
      examples: TEEN_TY_PAIRS.slice(0, 4).map(([teen, ty]) => ({
        en: `${numberToWords(teen)}, ${numberToWords(ty)}`,
        pl: `${teen}, ${ty}`,
      })),
      parentPl:
        "Pomaga przesadzenie akcentu: rodzic mówi „thir-TEEN!” z naciskiem na koniec i „THIR-ty” z naciskiem na początek, dziecko pokazuje liczbę na palcach (13 = dziesięć i trzy, 30 = trzy dziesiątki).",
    },
  ];
  const pairs = shuffle([...TEEN_TY_PAIRS, ...TEEN_TY_PAIRS]).slice(0, 8);
  pairs.forEach(([teen, ty], i) => {
    const value = Math.random() < 0.5 ? teen : ty;
    screens.push({
      id: `teen-ty-${i}`,
      kind: "choice",
      exercise: "teen-ty",
      item: String(value),
      heading: "Którą liczbę słyszysz?",
      sound: sayNumber(value),
      listenOnly: true,
      options: [teen, ty].map((n) => ({ id: String(n), label: String(n), sound: sayNumber(n) })),
      answer: String(value),
      columns: 2,
      explainPl:
        value === teen
          ? `${numberToWords(teen)} — akcent na końcu, długie „-teen”.`
          : `${numberToWords(ty)} — akcent na początku, krótkie „-ty”.`,
      explainWhen: "wrong",
    });
  });
  return screens;
}

// --- Słowa działań ------------------------------------------------------------------

export type OperationItem = {
  id: string;
  en: string;
  answer: number;
  /** Co oznacza słowo-klucz. */
  keyPl: string;
  /** Rozpisanie działania. */
  workingPl: string;
};

export const OPERATIONS: OperationItem[] = [
  { id: "add", en: "What is 8 add 5?", answer: 13, keyPl: "add = dodać", workingPl: "8 + 5 = 13" },
  { id: "plus", en: "What is 7 plus 6?", answer: 13, keyPl: "plus = plus", workingPl: "7 + 6 = 13" },
  { id: "total", en: "What is the total of 9 and 6?", answer: 15, keyPl: "the total of = suma, razem", workingPl: "9 + 6 = 15" },
  { id: "sum", en: "What is the sum of 12 and 8?", answer: 20, keyPl: "the sum of = suma, czyli dodawanie (potoczne „do your sums” to po prostu „policz działania”)", workingPl: "12 + 8 = 20" },
  { id: "more-than", en: "What is 10 more than 47?", answer: 57, keyPl: "10 more than = o 10 więcej niż", workingPl: "47 + 10 = 57" },
  { id: "take-away", en: "What is 15 take away 7?", answer: 8, keyPl: "take away = zabierz, odejmij", workingPl: "15 − 7 = 8" },
  { id: "subtract-from", en: "Subtract 6 from 20.", answer: 14, keyPl: "subtract 6 from 20 = odejmij 6 OD 20 (kolejność odwrotna niż w zdaniu!)", workingPl: "20 − 6 = 14" },
  { id: "minus", en: "What is 18 minus 9?", answer: 9, keyPl: "minus = minus", workingPl: "18 − 9 = 9" },
  { id: "difference", en: "What is the difference between 15 and 9?", answer: 6, keyPl: "the difference between = różnica: od większej odejmij mniejszą", workingPl: "15 − 9 = 6" },
  { id: "less-than", en: "What is 100 less than 350?", answer: 250, keyPl: "100 less than = o 100 mniej niż", workingPl: "350 − 100 = 250" },
  { id: "lots-of", en: "What is 4 lots of 6?", answer: 24, keyPl: "lots of = razy (4 grupy po 6)", workingPl: "4 × 6 = 24" },
  { id: "groups-of", en: "What is 3 groups of 7?", answer: 21, keyPl: "groups of = grupy po… (razy)", workingPl: "3 × 7 = 21" },
  { id: "multiply", en: "Multiply 8 by 3.", answer: 24, keyPl: "multiply by = pomnóż przez", workingPl: "8 × 3 = 24" },
  { id: "times", en: "What is 9 times 4?", answer: 36, keyPl: "times = razy", workingPl: "9 × 4 = 36" },
  { id: "product", en: "What is the product of 6 and 5?", answer: 30, keyPl: "the product of = iloczyn (wynik mnożenia)", workingPl: "6 × 5 = 30" },
  { id: "share", en: "Share 12 equally between 3. How many does each get?", answer: 4, keyPl: "share equally = podziel po równo", workingPl: "12 ÷ 3 = 4" },
  { id: "divide", en: "Divide 20 by 4.", answer: 5, keyPl: "divide by = podziel przez", workingPl: "20 ÷ 4 = 5" },
  { id: "how-many-in", en: "How many fives are there in 35?", answer: 7, keyPl: "how many fives in 35 = ile piątek mieści się w 35 (dzielenie)", workingPl: "35 ÷ 5 = 7" },
  { id: "double", en: "Double 14.", answer: 28, keyPl: "double = podwój (razy 2)", workingPl: "14 × 2 = 28" },
  { id: "half", en: "What is half of 18?", answer: 9, keyPl: "half of = połowa", workingPl: "18 ÷ 2 = 9" },
  { id: "halve", en: "Halve 30.", answer: 15, keyPl: "halve = podziel na pół", workingPl: "30 ÷ 2 = 15" },
  { id: "one-more", en: "What is one more than 99?", answer: 100, keyPl: "one more than = o jeden więcej niż", workingPl: "99 + 1 = 100" },
  { id: "multiplied-by", en: "What is 6 multiplied by 4?", answer: 24, keyPl: "multiplied by = pomnożone przez (tak czyta się znak ×)", workingPl: "6 × 4 = 24" },
  { id: "divided-by", en: "What is 24 divided by 6?", answer: 4, keyPl: "divided by = podzielone przez (tak czyta się znak ÷)", workingPl: "24 ÷ 6 = 4" },
  { id: "tens", en: "How many tens are there in 70?", answer: 7, keyPl: "tens = dziesiątki, ones = jedności (tak nazywa się miejsca w liczbie)", workingPl: "70 = 7 dziesiątek, więc odpowiedź = 7" },
  { id: "round", en: "Round 47 to the nearest 10.", answer: 50, keyPl: "round to the nearest 10 = zaokrąglij do najbliższej dziesiątki", workingPl: "47 zaokrąglone do dziesiątek = 50 (bliżej 50 niż 40)" },
];

function operationsSession(): Exercise[] {
  const learn: Exercise = {
    id: "ops-learn",
    kind: "learn",
    exercise: "learn",
    item: "operation-words",
    heading: "Słowa działań",
    promptEn: "add, take away, lots of, share",
    bodyPl:
      "Na lekcji działanie często pada słowami, nie znakiem — a każde ma kilka nazw:",
    examples: [
      { en: "add, plus, the total of, the sum of", pl: "dodawanie (+)" },
      { en: "take away, subtract, minus, the difference between", pl: "odejmowanie (−)" },
      { en: "times, lots of, groups of, multiply by", pl: "mnożenie (×)" },
      { en: "share equally, divide by, how many in", pl: "dzielenie (÷)" },
    ],
  };
  return [
    learn,
    ...pickSome(OPERATIONS, 9).map(
      (item, i): Exercise => ({
        id: `ops-${item.id}-${i}`,
        kind: "typed",
        exercise: "operation",
        item: item.id,
        promptEn: item.en,
        sound: say(item.en),
        answer: item.answer,
        revealText: item.workingPl,
        explainPl: `${item.keyPl}: ${item.workingPl}.`,
      }),
    ),
  ];
}

// --- Zadania z treścią -------------------------------------------------------------

export type WordProblem = {
  id: string;
  en: string;
  answer: number;
  /** Słowo-klucz, po którym poznać działanie. */
  keyword: string;
  keyPl: string;
  workingPl: string;
};

export const WORD_PROBLEMS: WordProblem[] = [
  {
    id: "marbles",
    en: "Tom has 12 marbles. He gives 5 to his friend. How many marbles does Tom have left?",
    answer: 7,
    keyword: "left",
    keyPl: "„left” = zostało → odejmujemy",
    workingPl: "12 − 5 = 7",
  },
  {
    id: "cakes",
    en: "There are 6 boxes. Each box has 4 cakes. How many cakes are there altogether?",
    answer: 24,
    keyword: "each … altogether",
    keyPl: "„each box has 4” + „altogether” = 6 grup po 4 → mnożymy",
    workingPl: "6 × 4 = 24",
  },
  {
    id: "pencils",
    en: "A pencil costs 8p. How much do 3 pencils cost? Answer in pence.",
    answer: 24,
    keyword: "8p",
    keyPl: "„p” = pence (pensy, jak grosze). 3 ołówki po 8p → mnożymy",
    workingPl: "3 × 8p = 24p",
  },
  {
    id: "stickers",
    en: "Sam has 15 stickers. Mia has 9 stickers. How many more stickers does Sam have than Mia?",
    answer: 6,
    keyword: "how many more",
    keyPl: "„how many more … than” = o ile więcej → różnica, odejmujemy",
    workingPl: "15 − 9 = 6",
  },
  {
    id: "groups",
    en: "There are 28 children in the class. They sit in groups of 4. How many groups are there?",
    answer: 7,
    keyword: "groups of",
    keyPl: "„in groups of 4” + „how many groups” = ile czwórek w 28 → dzielimy",
    workingPl: "28 ÷ 4 = 7",
  },
  {
    id: "pages",
    en: "Ella reads 7 pages every day. How many pages does she read in one week?",
    answer: 49,
    keyword: "one week",
    keyPl: "ukryta liczba: „a week” = 7 dni → 7 razy po 7 stron",
    workingPl: "7 × 7 = 49",
  },
  {
    id: "bus",
    en: "A bus has 45 seats. 19 people are on the bus. How many seats are empty?",
    answer: 26,
    keyword: "empty",
    keyPl: "„empty” = puste → z wszystkich miejsc odejmujemy zajęte",
    workingPl: "45 − 19 = 26",
  },
  {
    id: "biscuits",
    en: "Grandma bakes 24 biscuits. She shares them equally between 6 plates. How many biscuits are on each plate?",
    answer: 4,
    keyword: "shares them equally",
    keyPl: "„shares equally between 6” = po równo na 6 → dzielimy",
    workingPl: "24 ÷ 6 = 4",
  },
  {
    id: "change",
    en: "Jack has £10. He buys a book for £6. How much change does he get? Answer in pounds.",
    answer: 4,
    keyword: "change",
    keyPl: "„change” = reszta (w sklepie) → odejmujemy",
    workingPl: "£10 − £6 = £4",
  },
  {
    id: "crayons",
    en: "There are 3 packs of crayons with 12 crayons in each pack. How many crayons are there in total?",
    answer: 36,
    keyword: "in each … in total",
    keyPl: "„12 in each pack” + „in total” = 3 paczki po 12 → mnożymy",
    workingPl: "3 × 12 = 36",
  },
  {
    id: "ruler",
    en: "A ruler is 30 centimetres long. How long are 2 rulers placed end to end? Answer in centimetres.",
    answer: 60,
    keyword: "end to end",
    keyPl: "„end to end” = jedna za drugą → dodajemy długości",
    workingPl: "30 + 30 = 60 cm",
  },
  {
    id: "points",
    en: "Leo scored 18 points. Amy scored double that. How many points did Amy score?",
    answer: 36,
    keyword: "double",
    keyPl: "„double that” = dwa razy tyle",
    workingPl: "18 × 2 = 36",
  },
  {
    id: "sweets",
    en: "There are 50 sweets in a jar. Half of them are red. How many red sweets are there?",
    answer: 25,
    keyword: "half of",
    keyPl: "„half of them” = połowa z nich",
    workingPl: "50 ÷ 2 = 25",
  },
  {
    id: "temperature",
    en: "It is 9 degrees in the morning. By lunchtime it is 5 degrees warmer. What is the temperature at lunchtime?",
    answer: 14,
    keyword: "warmer",
    keyPl: "„5 degrees warmer” = o 5 stopni cieplej → dodajemy",
    workingPl: "9 + 5 = 14",
  },
  {
    id: "boys",
    en: "There are 32 children in the class. 17 of them are girls. How many boys are there?",
    answer: 15,
    keyword: "how many boys",
    keyPl: "wszystkie dzieci minus dziewczynki = chłopcy → odejmujemy",
    workingPl: "32 − 17 = 15",
  },
  {
    id: "legs",
    en: "A dog has 4 legs. How many legs do 5 dogs have?",
    answer: 20,
    keyword: "5 dogs",
    keyPl: "5 psów po 4 nogi → mnożymy",
    workingPl: "5 × 4 = 20",
  },
  {
    id: "rubber",
    en: "A pen costs 45p and a rubber costs 75p. How much do they cost altogether? Answer in pence.",
    answer: 120,
    keyword: "altogether",
    keyPl: "„altogether” = razem → dodajemy („rubber” to gumka do ścierania). Od 100p kwotę zapisuje się już w funtach: 120p = £1.20",
    workingPl: "45p + 75p = 120p (£1.20)",
  },
  {
    id: "lesson",
    en: "A lesson starts at quarter past nine and finishes at ten o'clock. How many minutes long is it?",
    answer: 45,
    keyword: "how many minutes long",
    keyPl: "„how many minutes long” = ile minut trwa → od 9:15 do 10:00",
    workingPl: "9:15 → 10:00 = 45 minut",
  },
];

function wordProblemsSession(): Exercise[] {
  return pickSome(WORD_PROBLEMS, 6).map(
    (problem, i): Exercise => ({
      id: `wp-${problem.id}-${i}`,
      kind: "typed",
      exercise: "word-problem",
      item: problem.id,
      heading: "Posłuchaj, przeczytaj, policz",
      promptEn: problem.en,
      sound: say(problem.en),
      answer: problem.answer,
      revealText: problem.workingPl,
      explainPl: `${problem.keyPl}: ${problem.workingPl}.`,
      parentPl: `Słowo-klucz: „${problem.keyword}”. Zapytaj najpierw: „Dodajemy, odejmujemy, mnożymy czy dzielimy? Po czym to poznałeś?” — to pytanie jest ważniejsze od samego wyniku.`,
    }),
  );
}

// --- Zegar ------------------------------------------------------------------------

/**
 * Godziny tak, jak czyta się je z tarczy: „o'clock", potem „past" (po) do
 * połowy godziny, potem „to" (za) z nazwą NASTĘPNEJ godziny. Year 3 czyta
 * zegar do minuty (program: „tell and write the time from an analogue clock…
 * to the nearest minute"), więc pięciominutówki są tu w komplecie.
 */
type TimeKind =
  | "oclock"
  | "five-past"
  | "ten-past"
  | "quarter-past"
  | "twenty-past"
  | "twenty-five-past"
  | "half"
  | "twenty-five-to"
  | "twenty-to"
  | "quarter-to"
  | "ten-to"
  | "five-to";

const TIME_KINDS: TimeKind[] = [
  "oclock",
  "five-past",
  "ten-past",
  "quarter-past",
  "twenty-past",
  "twenty-five-past",
  "half",
  "twenty-five-to",
  "twenty-to",
  "quarter-to",
  "ten-to",
  "five-to",
];

/** Godziny „do minuty" — nowe względem o'clock / half / quarter. */
const MINUTE_KINDS: TimeKind[] = TIME_KINDS.filter(
  (kind) => !["oclock", "half", "quarter-past", "quarter-to"].includes(kind),
);

const MINUTE_OF: Record<TimeKind, number> = {
  oclock: 0,
  "five-past": 5,
  "ten-past": 10,
  "quarter-past": 15,
  "twenty-past": 20,
  "twenty-five-past": 25,
  half: 30,
  "twenty-five-to": 35,
  "twenty-to": 40,
  "quarter-to": 45,
  "ten-to": 50,
  "five-to": 55,
};

function kindOfMinute(minute: number): TimeKind {
  const found = TIME_KINDS.find((kind) => MINUTE_OF[kind] === minute);
  if (!found) throw new Error(`kindOfMinute: brak rodzaju dla ${minute}`);
  return found;
}

/** „twenty past" ↔ „twenty to": ta sama liczba minut, przeciwny kierunek. */
function mirrorKind(kind: TimeKind): TimeKind {
  return kindOfMinute((60 - MINUTE_OF[kind]) % 60);
}

export function timePhrase(hour: number, kind: TimeKind): string {
  const word = (h: number) => numberToWords(((h - 1 + 12) % 12) + 1);
  const minute = MINUTE_OF[kind];
  switch (kind) {
    case "oclock":
      return `${word(hour)} o'clock`;
    case "half":
      return `half past ${word(hour)}`;
    case "quarter-past":
      return `quarter past ${word(hour)}`;
    case "quarter-to":
      return `quarter to ${word(hour + 1)}`;
    default:
      return minute < 30
        ? `${numberToWords(minute)} past ${word(hour)}`
        : `${numberToWords(60 - minute)} to ${word(hour + 1)}`;
  }
}

/** Wskazówki zegara dla „hour" i rodzaju godziny („to" = następna godzina jeszcze nie wybiła). */
function clockOf(hour: number, kind: TimeKind): { hour: number; minute: number } {
  return { hour, minute: MINUTE_OF[kind] };
}

function timeKey(hour: number, kind: TimeKind): string {
  return `${hour}-${kind}`;
}

/**
 * Dystraktory celowo z pułapek. Polskie „wpół do czwartej" to 3:30, a
 * angielskie „half past three" też 3:30 — liczby w nazwach się różnią, więc
 * pułapka działa w obie strony INACZEJ:
 *  - ze słuchu (zdanie → zegar): dziecko słyszy „three" i ustawia „wpół do
 *    trzeciej" = 2:30 → dystraktor o godzinę WCZEŚNIEJ;
 *  - z tarczy (zegar → zdanie): dziecko widzi 3:30, myśli „wpół do czwartej"
 *    i szuka „four" → dystraktor „half past four", o godzinę PÓŹNIEJ.
 * Dla minut pułapką jest kierunek: „twenty past three" (3:20) kontra „twenty
 * to three" (2:40 — te same słowa, inny kierunek) i „twenty to four" (3:40 —
 * lustrzane odbicie wskazówki).
 */
function timeDistractors(hour: number, kind: TimeKind, direction: "read" | "hear"): Array<[number, TimeKind]> {
  const prev = hour === 1 ? 12 : hour - 1;
  const next = hour === 12 ? 1 : hour + 1;
  switch (kind) {
    case "half":
      return [
        [direction === "hear" ? prev : next, "half"],
        [hour, "quarter-past"],
      ];
    case "quarter-to":
      return [
        [next, "quarter-past"],
        [hour, "quarter-past"],
      ];
    case "quarter-past":
      return [
        [hour, "quarter-to"],
        [hour, "half"],
      ];
    case "oclock":
      return [
        [hour, "half"],
        [next, "oclock"],
      ];
    default: {
      const mirror = mirrorKind(kind);
      // „past": te same słowa z „to" to godzina wcześniej (twenty to THREE = 2:40);
      // „to": te same słowa z „past" to godzina później (twenty past FOUR = 4:20).
      return [
        [hour, mirror],
        [MINUTE_OF[kind] < 30 ? prev : next, mirror],
      ];
    }
  }
}

type Meridiem = "am" | "pm";

/** 12-godzinny zapis cyfrowy: „3:30 pm" (tak pisze się w Anglii na co dzień). */
function digital12(hour: number, minute: number, meridiem: Meridiem): string {
  return `${hour}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

/** 24-godzinny zapis (rozkłady jazdy, program Year 4): 3:30 pm → 15:30, 12:15 am → 00:15. */
function digital24(hour: number, minute: number, meridiem: Meridiem): string {
  const h24 = meridiem === "am" ? hour % 12 : (hour % 12) + 12;
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Pory dnia z życia angielskiego dziecka — z nich Year 3 wnioskuje am / pm.
 * Realia: lekcje ok. 8:45–15:15, „tea" to wieczorny posiłek, kółka po szkole.
 */
export const DAY_TIMES: Array<{ id: string; en: string; hour: number; kind: TimeKind; meridiem: Meridiem; pl: string }> = [
  { id: "wake", en: "I wake up at seven o'clock.", hour: 7, kind: "oclock", meridiem: "am", pl: "budzę się — rano" },
  { id: "breakfast", en: "I eat breakfast at half past seven.", hour: 7, kind: "half", meridiem: "am", pl: "śniadanie — rano" },
  { id: "school-starts", en: "School starts at quarter to nine.", hour: 8, kind: "quarter-to", meridiem: "am", pl: "początek lekcji — rano (8:45)" },
  { id: "shop", en: "The shop opens at nine o'clock.", hour: 9, kind: "oclock", meridiem: "am", pl: "sklep otwiera się — rano" },
  { id: "lunch", en: "We have lunch at quarter past twelve.", hour: 12, kind: "quarter-past", meridiem: "pm", pl: "lunch — w południe; od 12:00 jest już pm" },
  { id: "school-ends", en: "School finishes at quarter past three.", hour: 3, kind: "quarter-past", meridiem: "pm", pl: "koniec lekcji — po południu" },
  { id: "swimming", en: "Swimming club is at ten past four.", hour: 4, kind: "ten-past", meridiem: "pm", pl: "kółko pływackie po szkole — po południu" },
  { id: "tea", en: "We have tea at five o'clock.", hour: 5, kind: "oclock", meridiem: "pm", pl: "„tea” to tu wieczorny posiłek — po południu" },
  { id: "bed", en: "I go to bed at eight o'clock.", hour: 8, kind: "oclock", meridiem: "pm", pl: "idę spać — wieczorem" },
];

/** Year 3: z pory dnia dziecko wybiera zapis z am albo pm. */
function amPmExercise(index: number): Exercise {
  const item = DAY_TIMES[index];
  const minute = MINUTE_OF[item.kind];
  const other: Meridiem = item.meridiem === "am" ? "pm" : "am";
  const nextHour = item.hour === 12 ? 1 : item.hour + 1;
  const correct = digital12(item.hour, minute, item.meridiem);
  const options = shuffle([correct, digital12(item.hour, minute, other), digital12(nextHour, minute, item.meridiem)]);
  return {
    id: `time-ampm-${item.id}`,
    kind: "choice",
    exercise: "time-ampm",
    item: item.id,
    heading: "am czy pm? Wybierz zapis",
    promptEn: item.en,
    sound: say(item.en),
    visual: { kind: "clock", hour: item.hour, minute },
    options: options.map((label) => ({ id: label, label })),
    answer: correct,
    columns: 3,
    explainPl: `${item.pl}: ${correct}. am = od północy do południa, pm = od południa do północy.`,
  };
}

/** Year 4: zamiana 12 h ↔ 24 h. Pułapki: am/pm odwrotnie, „15" przeczytane jako 5. */
function clock24Exercise(index: number): Exercise {
  const hour = 1 + Math.floor(Math.random() * 11);
  const kind = TIME_KINDS[Math.floor(Math.random() * TIME_KINDS.length)];
  const minute = MINUTE_OF[kind];
  const meridiem: Meridiem = Math.random() < 0.5 ? "am" : "pm";
  const other: Meridiem = meridiem === "am" ? "pm" : "am";
  const nearHour = meridiem === "pm" ? (hour <= 9 ? hour + 2 : hour - 2) : hour === 11 ? 10 : hour + 1;
  const to24 = index % 2 === 0;
  const shown = to24 ? digital12(hour, minute, meridiem) : digital24(hour, minute, meridiem);
  const correct = to24 ? digital24(hour, minute, meridiem) : digital12(hour, minute, meridiem);
  const options = to24
    ? [correct, digital24(hour, minute, other), digital24(nearHour, minute, meridiem)]
    : [correct, digital12(hour, minute, other), digital12(nearHour, minute, meridiem)];
  return {
    id: `time-24h-${index}`,
    kind: "choice",
    exercise: "time-24h",
    item: digital24(hour, minute, meridiem),
    heading: to24 ? "Zapisz jak na rozkładzie jazdy (24 h)" : "Zegar 24-godzinny — który zapis z am / pm?",
    promptEn: "What time is it?",
    sound: say("What time is it?"),
    visual: { kind: "big", text: shown },
    options: shuffle(options).map((label) => ({ id: label, label })),
    answer: correct,
    columns: 3,
    explainPl:
      meridiem === "pm"
        ? `${digital12(hour, minute, "pm")} = ${digital24(hour, minute, "pm")}: po południu dodajemy 12 do godziny (${hour} + 12 = ${hour + 12}).`
        : `${digital12(hour, minute, "am")} = ${digital24(hour, minute, "am")}: rano godzina zostaje ta sama, tylko z zerem z przodu.`,
  };
}

function timeSession(): Exercise[] {
  const screens: Exercise[] = [
    {
      id: "time-learn",
      kind: "learn",
      exercise: "learn",
      item: "time-words",
      heading: "Zegar po angielsku",
      visual: { kind: "clock", hour: 3, minute: 30 },
      promptEn: "It's half past three.",
      sound: say("It's half past three."),
      bodyPl:
        "Uwaga, pułapka! „Half past three” to 3:30 — pół godziny PO trzeciej. Po polsku mówimy „wpół do czwartej”, więc łatwo pomylić godzinę. Anglik liczy od godziny, która minęła: do połowy mówi „past” (po), po połowie „to” (za) i już nazywa następną godzinę. Cyfrowo: 3:30 pm na co dzień, 15:30 na rozkładzie jazdy.",
      examples: [
        { en: "three o'clock", pl: "3:00 — trzecia" },
        { en: "quarter past three", pl: "3:15 — kwadrans po trzeciej" },
        { en: "twenty-five past three", pl: "3:25 — do połowy godziny: „past” (po)" },
        { en: "half past three", pl: "3:30 — wpół do czwartej!" },
        { en: "twenty-five to four", pl: "3:35 — po połowie: „to” (za) i już „four”" },
        { en: "quarter to four", pl: "3:45 — za kwadrans czwarta" },
        { en: "ten to four", pl: "3:50 — za dziesięć czwarta" },
        { en: "half four", pl: "potocznie: 4:30 (half past four), NIE „wpół do czwartej”!" },
      ],
      parentPl:
        "W Year 3–4 dzieci czytają zegar wskazówkowy do minuty („twenty past”, „ten to”; także tarcze z cyframi rzymskimi), znają am/pm i zapis 24-godzinny (Year 4 zamienia jeden na drugi). Na co dzień mówi się 12-godzinnie: „half past three” to i 3:30, i 15:30. Uwaga na potoczne „half four” (tak mówią rodzice na placu zabaw: „pick-up at half four”) — to 4:30, a polskie ucho słyszy „wpół do czwartej”, czyli 3:30. Warto w domu mówić godziny po angielsku przy okazji: „It's quarter past seven — time for breakfast!”",
    },
  ];

  const used = new Set<string>();
  const draws: Array<[number, TimeKind]> = [];
  const pickKind = (n: number): TimeKind => {
    // Trzy razy „half past" (w nim siedzi pułapka), trzy godziny do minuty, reszta dowolna.
    if (n < 3) return "half";
    if (n < 6) return MINUTE_KINDS[Math.floor(Math.random() * MINUTE_KINDS.length)];
    return TIME_KINDS[Math.floor(Math.random() * TIME_KINDS.length)];
  };
  while (draws.length < 8) {
    const hour = 1 + Math.floor(Math.random() * 12);
    const kind = pickKind(draws.length);
    if (used.has(timeKey(hour, kind))) continue;
    used.add(timeKey(hour, kind));
    draws.push([hour, kind]);
  }

  draws.forEach(([hour, kind], i) => {
    const direction = i % 2 === 0 ? "read" : "hear";
    const options = shuffle([[hour, kind] as [number, TimeKind], ...timeDistractors(hour, kind, direction)]);
    const correct = timeKey(hour, kind);
    if (direction === "read") {
      // Zegar → które zdanie.
      screens.push({
        id: `time-read-${i}`,
        kind: "choice",
        exercise: "time-read",
        item: correct,
        promptEn: "What time is it?",
        sound: say("What time is it?"),
        visual: { kind: "clock", ...clockOf(hour, kind) },
        options: options.map(([h, k]) => ({
          id: timeKey(h, k),
          label: timePhrase(h, k),
          sound: say(timePhrase(h, k)),
        })),
        answer: correct,
        columns: 1,
        explainPl: explainTime(hour, kind),
      });
    } else {
      // Zdanie ze słuchu → który zegar.
      const phrase = `It's ${timePhrase(hour, kind)}.`;
      screens.push({
        id: `time-hear-${i}`,
        kind: "choice",
        exercise: "time-hear",
        item: correct,
        heading: "Który zegar?",
        promptEn: phrase,
        sound: say(phrase),
        options: options.map(([h, k]) => ({
          id: timeKey(h, k),
          label: "",
          visual: { kind: "clock", ...clockOf(h, k) },
        })),
        answer: correct,
        columns: 3,
        explainPl: explainTime(hour, kind),
      });
    }
  });

  screens.push(amPmExercise(Math.floor(Math.random() * DAY_TIMES.length)));
  screens.push(clock24Exercise(Math.floor(Math.random() * 2)));
  return screens;
}

function explainTime(hour: number, kind: TimeKind): string {
  const next = hour === 12 ? 1 : hour + 1;
  const minute = MINUTE_OF[kind];
  const hh = (h: number, m: number) => `${h}:${String(m).padStart(2, "0")}`;
  switch (kind) {
    case "oclock":
      return `${timePhrase(hour, kind)} = ${hh(hour, 0)} — długa wskazówka na 12.`;
    case "half":
      return `${timePhrase(hour, kind)} = ${hh(hour, 30)} — pół godziny PO ${hour}. Po polsku „wpół do ${next}”.`;
    case "quarter-past":
      return `${timePhrase(hour, kind)} = ${hh(hour, 15)} — kwadrans PO ${hour}.`;
    case "quarter-to":
      return `${timePhrase(hour, kind)} = ${hh(hour, 45)} — za kwadrans ${next}.`;
    default:
      return minute < 30
        ? `${timePhrase(hour, kind)} = ${hh(hour, minute)} — ${minute} minut PO ${hour} (past = po).`
        : `${timePhrase(hour, kind)} = ${hh(hour, minute)} — za ${60 - minute} minut ${next} (to = za; mówimy już następną godzinę).`;
  }
}

// --- Zapis jak w Anglii --------------------------------------------------------------

export type NotationItem = {
  id: string;
  shown: string;
  promptEn: string;
  options: string[];
  answer: string;
  explainPl: string;
};

export const NOTATION: NotationItem[] = [
  {
    id: "decimal",
    shown: "2.5",
    promptEn: "How do you say this number?",
    options: ["two point five", "twenty-five", "two thousand, five hundred"],
    answer: "two point five",
    explainPl: "W Anglii ułamek dziesiętny zapisuje się z KROPKĄ: 2.5 (czytaj „two point five”). Nasze 2,5 to po angielsku 2.5. Zero przed kropką Brytyjczycy często czytają „nought”: 0.5 = „nought point five”.",
  },
  {
    id: "thousands",
    shown: "2,500",
    promptEn: "How do you say this number?",
    options: ["two thousand, five hundred", "two point five", "twenty-five"],
    answer: "two thousand, five hundred",
    explainPl: "Uwaga! Przecinek w angielskiej liczbie oddziela TYSIĄCE: 2,500 = dwa tysiące pięćset (u nas 2 500). To nie jest 2,5!",
  },
  {
    id: "divide",
    shown: "12 ÷ 3",
    promptEn: "What does this sign mean?",
    options: ["divided by", "times", "take away"],
    answer: "divided by",
    explainPl: "Po angielsku dzielenie zapisuje się znakiem ÷ („divided by”). Dwukropek (12 : 3) oznacza w angielskim zapisie godzinę (3:30), nie dzielenie.",
  },
  {
    id: "times",
    shown: "4 × 5",
    promptEn: "What does this sign mean?",
    options: ["times", "plus", "divided by"],
    answer: "times",
    explainPl: "× czyta się „times” albo „multiplied by”. W angielskim zapisie mnoży się tylko znakiem × — kropki (4 · 5) się nie używa.",
  },
  {
    id: "pounds",
    shown: "£3.50",
    promptEn: "How do you say this amount?",
    options: ["three pounds fifty", "thirty-five pounds", "thirty-five pence"],
    answer: "three pounds fifty",
    explainPl: "£ stoi PRZED liczbą: £3.50 = 3 funty i 50 pensów, mówi się „three pounds fifty”. To tyle samo co 350 pensów (100 pensów = 1 funt), ale kwotę z £ czyta się w funtach.",
  },
  {
    id: "pence",
    shown: "75p",
    promptEn: "How do you say this amount?",
    options: ["seventy-five pence", "seven pounds fifty", "seventy-five pounds"],
    answer: "seventy-five pence",
    explainPl: "„p” po liczbie to pensy: 75p = „seventy-five pence” (dzieci często mówią też „seventy-five p”).",
  },
  {
    id: "clock",
    shown: "3:30",
    promptEn: "What time is it?",
    options: ["half past three", "half past four", "quarter past three"],
    answer: "half past three",
    explainPl: "3:30 = „half past three” — pół godziny PO trzeciej. Po polsku „wpół do czwartej”, dlatego kusi „four” — ale Anglik liczy od godziny, która minęła.",
  },
  {
    id: "half",
    shown: "½",
    promptEn: "What is this fraction called?",
    options: ["a half", "a quarter", "a third"],
    answer: "a half",
    explainPl: "½ = „a half” (połowa), ¼ = „a quarter” (ćwierć), ⅓ = „a third” (jedna trzecia).",
  },
  {
    id: "quarter",
    shown: "¼",
    promptEn: "What is this fraction called?",
    options: ["a quarter", "a half", "a third"],
    answer: "a quarter",
    explainPl: "¼ = „a quarter” — to samo słowo co w „quarter past three” (kwadrans = ćwierć godziny).",
  },
  {
    id: "am-pm",
    shown: "3:30 pm",
    promptEn: "What time is it?",
    options: ["half past three in the afternoon", "half past three in the morning", "half past four in the afternoon"],
    answer: "half past three in the afternoon",
    explainPl: "am = od północy do południa, pm = od południa do północy. Na co dzień w Anglii zegar jest 12-godzinny: nasze 15:30 to „3:30 pm”. Zapis 24-godzinny (15:30) też jest w szkole, ale spotyka się go głównie w rozkładach jazdy.",
  },
  {
    id: "roman",
    shown: "XII",
    promptEn: "What number is this?",
    options: ["twelve", "eleven", "seven"],
    answer: "twelve",
    explainPl: "Cyfry rzymskie po angielsku to „Roman numerals”. Są na tarczach zegarów i w zadaniach — tak jak w polskiej szkole, więc nowa jest tylko nazwa. XII = twelve, IX = nine, IV = four.",
  },
  {
    id: "negative",
    shown: "−3",
    promptEn: "How do you say this number?",
    options: ["minus three", "three", "a third"],
    answer: "minus three",
    explainPl: "Liczba poniżej zera: −3 czyta się „minus three” (na lekcji także „negative three”). Znaczenie jak po polsku — najczęściej przy temperaturze: „It's minus three degrees.”",
  },
];

function notationSession(): Exercise[] {
  const learn: Exercise = {
    id: "notation-learn",
    kind: "learn",
    exercise: "learn",
    item: "notation",
    heading: "Zapis jak w Anglii",
    visual: { kind: "big", text: "2.5   2,500   ÷" },
    bodyPl:
      "Matematyka ta sama, zapis trochę inny: ułamek dziesiętny z kropką (2.5), tysiące z przecinkiem (2,500), dzielenie znakiem ÷, pieniądze w funtach (£) i pensach (p), godziny z am i pm.",
    examples: [
      {
        en: "One pound is one hundred pence.",
        pl: "£1 = 100p. Monety: 1p, 2p, 5p, 10p, 20p, 50p, £1, £2; banknoty: £5, £10, £20, £50.",
      },
    ],
    parentPl:
      "Praktyczna rzecz na zeszyt: polską „jedynkę” z długim daszkiem angielski nauczyciel może przeczytać jako 7. W Anglii 1 pisze się jedną prostą kreską, a 7 bez przekreślenia. Druga rzecz: przecinek dziesiętny — w Anglii przecinek oddziela tysiące, więc 2,5 nic nie znaczy; trzeba pisać 2.5. Warto przećwiczyć zapis cyfr i kropki przed wrześniem.",
  };
  return [
    learn,
    ...shuffle(NOTATION).map(
      (item, i): Exercise => ({
        id: `notation-${item.id}-${i}`,
        kind: "choice",
        exercise: "notation",
        item: item.id,
        visual: { kind: "big", text: item.shown },
        promptEn: item.promptEn,
        sound: say(item.promptEn),
        options: shuffle(item.options).map((option) => ({ id: option, label: option, sound: say(option) })),
        answer: item.answer,
        columns: 1,
        explainPl: item.explainPl,
      }),
    ),
  ];
}

// --- Jednostki -----------------------------------------------------------------------

/**
 * Jednostki po angielsku (Year 3–4): te same co w Polsce, inne słowa i
 * brytyjska pisownia (metre, litre — nie meter, liter). Program: zamiana
 * jednostek prostych (Year 3: m ↔ cm, kg ↔ g) i mieszanych (Year 4:
 * 1 kg 200 g = 1,200 g), czas (godziny ↔ minuty). Imperialne (mile, pints)
 * tylko we wskazówce dla rodzica — w programie Year 3–4 ich nie ma.
 */
export type UnitWordItem = {
  id: string;
  shown: string;
  answer: string;
  options: string[];
  explainPl: string;
};

export const UNIT_WORDS: UnitWordItem[] = [
  {
    id: "m-cm",
    shown: "1 m 50 cm",
    answer: "one metre and fifty centimetres",
    options: ["one metre and fifty centimetres", "one metre and fifty millimetres", "fifteen metres"],
    explainPl: "1 m 50 cm = „one metre and fifty centimetres” (w mowie często krótko: „one metre fifty”). Pisownia brytyjska: metre, centimetre — z -re na końcu.",
  },
  {
    id: "km",
    shown: "2 km",
    answer: "two kilometres",
    options: ["two kilometres", "two kilograms", "two centimetres"],
    explainPl: "km = kilometre(s): „two kilometres”. kg to kilogram — skróty łatwo pomylić, ale słowa brzmią inaczej.",
  },
  {
    id: "g",
    shown: "500 g",
    answer: "five hundred grams",
    options: ["five hundred grams", "five hundred kilograms", "fifty grams"],
    explainPl: "g = gram(s): „five hundred grams” — pół kilograma.",
  },
  {
    id: "kg-g",
    shown: "1 kg 200 g",
    answer: "one kilogram and two hundred grams",
    options: ["one kilogram and two hundred grams", "one kilogram and twenty grams", "twelve kilograms"],
    explainPl: "Jednostki mieszane czyta się po kolei: „one kilogram and two hundred grams” = 1,200 g.",
  },
  {
    id: "ml",
    shown: "250 ml",
    answer: "two hundred and fifty millilitres",
    options: ["two hundred and fifty millilitres", "two hundred and fifty litres", "twenty-five millilitres"],
    explainPl: "ml = millilitre(s). Pisownia brytyjska: litre, millilitre (amerykańska: liter).",
  },
  {
    id: "l",
    shown: "3 litres",
    answer: "three litres",
    options: ["three litres", "three millilitres", "three metres"],
    explainPl: "litre — jak polski „litr”, ale z -re na końcu; 1 litre = 1,000 millilitres.",
  },
  {
    id: "m-thousands",
    shown: "1,500 m",
    answer: "one thousand, five hundred metres",
    options: ["one thousand, five hundred metres", "one thousand and fifty metres", "fifteen metres"],
    explainPl: "1,500 m — przecinek oddziela tysiące. To tyle samo co 1 km 500 m (1.5 km).",
  },
];

export type UnitConversion = {
  id: string;
  en: string;
  answer: number;
  /** Rozpisanie po angielsku (z przecinkiem w tysiącach — tak wygląda w zeszycie). */
  workingEn: string;
  hintPl: string;
};

export const UNIT_CONVERSIONS: UnitConversion[] = [
  { id: "m-to-cm", en: "How many centimetres are there in 5 metres?", answer: 500, workingEn: "5 m = 500 cm", hintPl: "1 metre = 100 centimetres" },
  { id: "m-to-cm-3", en: "How many centimetres are there in 3 metres?", answer: 300, workingEn: "3 m = 300 cm", hintPl: "1 metre = 100 centimetres" },
  { id: "km-to-m", en: "How many metres are there in 2 kilometres?", answer: 2000, workingEn: "2 km = 2,000 m", hintPl: "1 kilometre = 1,000 metres; po angielsku 2,000 — z przecinkiem" },
  { id: "half-km", en: "How many metres are there in half a kilometre?", answer: 500, workingEn: "½ km = 500 m", hintPl: "połowa z 1,000 metres" },
  { id: "kg-to-g", en: "How many grams are there in 1 kilogram?", answer: 1000, workingEn: "1 kg = 1,000 g", hintPl: "kilo = tysiąc" },
  { id: "kg-g-mixed", en: "How many grams are there in 1 kilogram 200 grams?", answer: 1200, workingEn: "1 kg 200 g = 1,200 g", hintPl: "1,000 g + 200 g" },
  { id: "m-cm-mixed", en: "How many centimetres are there in 1 metre 50 centimetres?", answer: 150, workingEn: "1 m 50 cm = 150 cm", hintPl: "100 cm + 50 cm" },
  { id: "l-to-ml", en: "How many millilitres are there in 1 litre?", answer: 1000, workingEn: "1 litre = 1,000 ml", hintPl: "milli = tysięczna część" },
  { id: "cm-to-mm", en: "How many millimetres are there in 1 centimetre?", answer: 10, workingEn: "1 cm = 10 mm", hintPl: "milimetry — najmniejsze kreski na linijce" },
  { id: "h-to-min", en: "How many minutes are there in 2 hours?", answer: 120, workingEn: "2 hours = 120 minutes", hintPl: "1 hour = 60 minutes" },
  { id: "h-half-to-min", en: "How many minutes are there in an hour and a half?", answer: 90, workingEn: "1½ hours = 90 minutes", hintPl: "60 + 30" },
  { id: "min-to-s", en: "How many seconds are there in a minute?", answer: 60, workingEn: "1 minute = 60 seconds", hintPl: "seconds = sekundy" },
];

function unitsSession(): Exercise[] {
  const learn: Exercise = {
    id: "units-learn",
    kind: "learn",
    exercise: "learn",
    item: "units",
    heading: "Jednostki po angielsku",
    visual: { kind: "big", text: "m  cm  kg  g  l  ml" },
    promptEn: "metre, centimetre, kilometre",
    sound: say("metre, centimetre, kilometre"),
    bodyPl:
      "Te same jednostki co w Polsce, inne słowa i pisownia: metre, centimetre, kilometre, gram, kilogram, litre, millilitre. Końcówka -re to pisownia brytyjska (amerykańska ma -er). Skróty jak u nas: m, cm, km, g, kg, l, ml. Tysiące z przecinkiem: 1 km = 1,000 m.",
    examples: [
      { en: "metre, centimetre, kilometre", pl: "m, cm, km — długość" },
      { en: "gram, kilogram", pl: "g, kg — masa" },
      { en: "litre, millilitre", pl: "l, ml — objętość" },
      { en: "One kilogram is one thousand grams.", pl: "1 kg = 1,000 g" },
    ],
    parentPl:
      "Year 3 zamienia jednostki proste (m ↔ cm, kg ↔ g), Year 4 zapisuje też jednostki mieszane (1 kg 200 g = 1,200 g) i czas (godziny ↔ minuty). Poza szkołą Anglicy mówią też milami (drogowskazy), pintami (mleko) i stopami (wzrost) — w programie Year 3–4 tego nie ma, więc tu nie ćwiczymy, ale dziecko usłyszy to na ulicy.",
  };
  const words = pickSome(UNIT_WORDS, 4).map(
    (item, i): Exercise => ({
      id: `units-word-${item.id}-${i}`,
      kind: "choice",
      exercise: "unit-word",
      item: item.id,
      visual: { kind: "big", text: item.shown },
      promptEn: "How do you say this?",
      sound: say("How do you say this?"),
      options: shuffle(item.options).map((option) => ({ id: option, label: option, sound: say(option) })),
      answer: item.answer,
      columns: 1,
      explainPl: item.explainPl,
    }),
  );
  const conversions = pickSome(UNIT_CONVERSIONS, 5).map(
    (item, i): Exercise => ({
      id: `units-convert-${item.id}-${i}`,
      kind: "typed",
      exercise: "unit-convert",
      item: item.id,
      promptEn: item.en,
      sound: say(item.en),
      answer: item.answer,
      revealText: item.workingEn,
      explainPl: `${item.workingEn} (${item.hintPl}).`,
    }),
  );
  return [learn, ...words, ...conversions];
}

// --- Tysiące i poniżej zera ---------------------------------------------------------

/**
 * Year 4: liczby czterocyfrowe i „count backwards through zero to include
 * negative numbers". Ze słuchu myli się 1,500 („one thousand, five hundred")
 * z 1,050 („one thousand and fifty"); liczby ujemne mają „minus" przed
 * liczbą, a klawiatura odpowiedzi dostaje klawisz − tylko w tych ćwiczeniach.
 */
export type NegativeItem = {
  id: string;
  en: string;
  answer: number;
  workingPl: string;
  visual?: Visual;
};

export const NEGATIVE_ITEMS: NegativeItem[] = [
  { id: "less-than-1", en: "What is 2 less than 1?", answer: -1, workingPl: "1 − 2 = −1", visual: { kind: "sequence", items: [3, 2, 1, 0, -1, -2] } },
  { id: "less-than-3", en: "What is 5 less than 3?", answer: -2, workingPl: "3 − 5 = −2" },
  {
    id: "count-back",
    en: "Start at 2 and count back 4. Where do you land?",
    answer: -2,
    workingPl: "2 → 1 → 0 → −1 → −2",
    visual: { kind: "sequence", items: [2, 1, 0, -1, null] },
  },
  {
    id: "temp-rise",
    en: "The temperature is minus three degrees. It rises by two degrees. What is the temperature now?",
    answer: -1,
    workingPl: "−3 + 2 = −1 (rises = rośnie)",
    visual: { kind: "big", text: "−3 °C" },
  },
  {
    id: "temp-fall",
    en: "The temperature is two degrees. It falls by five degrees. What is the temperature now?",
    answer: -3,
    workingPl: "2 − 5 = −3 (falls = spada)",
    visual: { kind: "big", text: "2 °C" },
  },
  { id: "sequence-down", en: "What is the missing number?", answer: -1, workingPl: "3, 2, 1, 0, −1 — liczymy wstecz przez zero", visual: { kind: "sequence", items: [3, 2, 1, 0, null] } },
  { id: "sequence-up", en: "What is the missing number?", answer: 0, workingPl: "−3, −2, −1, 0, 1 — zero też jest liczbą w ciągu", visual: { kind: "sequence", items: [-3, -2, -1, null, 1] } },
];

/** Jak się mówi liczbę ujemną — termometr. */
const SAY_NEGATIVE = {
  shown: "−3 °C",
  promptEn: "How do you say this temperature?",
  answer: "minus three degrees",
  options: ["minus three degrees", "three degrees", "minus thirty degrees"],
  explainPl: "−3 °C = „minus three degrees” (na lekcji też „negative three”). Prognoza pogody powie: „It's minus three tonight.”",
};

function thousandsSession(): Exercise[] {
  const learn: Exercise = {
    id: "thousands-learn",
    kind: "learn",
    exercise: "learn",
    item: "thousands",
    heading: "Tysiące i poniżej zera",
    visual: { kind: "big", text: "2,500   −3" },
    promptEn: "two thousand, five hundred",
    sound: say("two thousand, five hundred"),
    bodyPl:
      "Year 4 liczy w tysiącach i poniżej zera. W zapisie tysiące oddziela PRZECINEK (2,500), a ułamek KROPKA (2.5) — odwrotnie niż u nas. Liczby ujemne mają „minus” przed liczbą: −3 = minus three. W tych ćwiczeniach klawiatura ma klawisz −.",
    examples: [
      { en: "two thousand, five hundred", pl: "2,500 — przecinek w zapisie, pauza w mowie" },
      { en: "one thousand and fifty", pl: "1,050 — nie ma setek, więc od razu „and”" },
      { en: "minus three", pl: "−3 — trzy poniżej zera; na lekcji też „negative three”" },
      { en: "three, two, one, zero, minus one, minus two", pl: "liczenie wstecz przez zero" },
    ],
    parentPl:
      "Program Year 4: liczby czterocyfrowe i „count backwards through zero to include negative numbers”. Ze słuchu myli się 1,500 („one thousand, five hundred”) z 1,050 („one thousand and fifty”) — po „and” nie ma już setek. Termometr za oknem to najlepsze ćwiczenie liczb ujemnych: „It's minus two degrees today.”",
  };
  // 10,000 ma pięć cyfr — klawiatura odpowiedzi mieści cztery, więc trafia tylko do słuchania/czytania.
  const values = pickSome(THOUSANDS_POOL, 7).sort((a, b) => (a === 10000 ? -1 : b === 10000 ? 1 : 0));
  const numbers: Exercise[] = [
    ...values.slice(0, 3).map((v, i) => hearNumberChoice(v, `thousands-hear-${i}`)),
    ...values.slice(3, 5).map((v, i) => readNumberChoice(v, `thousands-read-${i}`)),
    ...values.slice(5).map((v, i) => hearNumberTyped(v, `thousands-type-${i}`)),
  ];
  const negatives = pickSome(NEGATIVE_ITEMS, 3).map(
    (item, i): Exercise => ({
      id: `negative-${item.id}-${i}`,
      kind: "typed",
      exercise: "negative",
      item: item.id,
      promptEn: item.en,
      sound: say(item.en),
      visual: item.visual,
      answer: item.answer,
      allowNegative: true,
      revealText: item.workingPl,
      explainPl: `${item.workingPl}. Minus wpisujesz klawiszem −.`,
    }),
  );
  const sayNegative: Exercise = {
    id: "negative-say",
    kind: "choice",
    exercise: "negative-say",
    item: "minus-three",
    visual: { kind: "big", text: SAY_NEGATIVE.shown },
    promptEn: SAY_NEGATIVE.promptEn,
    sound: say(SAY_NEGATIVE.promptEn),
    options: shuffle(SAY_NEGATIVE.options).map((option) => ({ id: option, label: option, sound: say(option) })),
    answer: SAY_NEGATIVE.answer,
    columns: 1,
    explainPl: SAY_NEGATIVE.explainPl,
  };
  return [learn, ...shuffle([...numbers, ...negatives, sayNegative])];
}

// --- Zeszyt: jak zapisuje się działania w angielskiej szkole ---------------------------

/**
 * Treść zakładki „Jak pisać w zeszycie" — bez ćwiczeń, do przepisania na
 * kartkę. Układy według White Rose Maths / NCETM (program Anglii): kolumny
 * z nagłówkami H T O, „exchange" (nie „borrow", nie „carry"), przeniesiona
 * cyfra mała POD kreską wyniku, w odejmowaniu przekreślona cyfra z nową nad
 * nią i mała 1 przy jednościach, dzielenie „bus stop" z wynikiem NAD kreską.
 *
 * Komórka to jedna kratka zeszytu. Znaczniki: ^1^ = mała cyfra (exchange),
 * ~7~ = przekreślona; „^1^2" = mała 1 przed 2 w tej samej kratce.
 */
export type NotebookRow = { cells: string[]; muted?: boolean; frameFrom?: number } | "rule";

export type NotebookMethod = {
  id: string;
  emoji: string;
  titlePl: string;
  /** Działanie, które pokazuje przykład. */
  sumEn: string;
  rows: NotebookRow[];
  /** Kroki tak, jak dziecko ma je wykonać ręką. */
  stepsPl: string[];
  /** Co mówi nauczycielka — z nagraniami. */
  phrases: string[];
  /** Czym różni się od polskiego zeszytu. */
  differencePl: string;
  yearPl: string;
};

export const NOTEBOOK_METHODS: NotebookMethod[] = [
  {
    id: "column-addition",
    emoji: "➕",
    titlePl: "Dodawanie w słupku (column addition)",
    sumEn: "347 + 285 = 632",
    rows: [
      { cells: ["", "H", "T", "O"], muted: true },
      { cells: ["", "3", "4", "7"] },
      { cells: ["+", "2", "8", "5"] },
      "rule",
      { cells: ["", "6", "3", "2"] },
      { cells: ["", "^1^", "^1^", ""] },
    ],
    stepsPl: [
      "Nad słupkiem litery H T O (hundreds, tens, ones) — jedna cyfra w jednej kratce.",
      "Zaczynamy od jedności: 7 + 5 = 12. Piszemy 2, a małą 1 (jedna dziesiątka) POD kreską wyniku, w kolumnie dziesiątek.",
      "Dziesiątki: 4 + 8 + 1 = 13. Piszemy 3, mała 1 pod kreską w kolumnie setek.",
      "Setki: 3 + 2 + 1 = 6.",
    ],
    phrases: [
      "Line up the digits.",
      "Start with the ones.",
      "Seven add five is twelve. Write the two and exchange ten ones for one ten.",
      "Don't forget the one you exchanged.",
    ],
    differencePl:
      "W polskim zeszycie przeniesioną jedynkę pisze się nad słupkiem. W Anglii (White Rose) — małą cyfrą pod kreską wyniku. Słowo to „exchange” (wymiana): dziesięć jedności wymieniamy na jedną dziesiątkę.",
    yearPl: "Year 3 (do 3 cyfr), Year 4 (do 4 cyfr)",
  },
  {
    id: "column-subtraction",
    emoji: "➖",
    titlePl: "Odejmowanie w słupku (column subtraction)",
    sumEn: "572 − 238 = 334",
    rows: [
      { cells: ["", "H", "T", "O"], muted: true },
      { cells: ["", "", "^6^", ""] },
      { cells: ["", "5", "~7~", "^1^2"] },
      { cells: ["−", "2", "3", "8"] },
      "rule",
      { cells: ["", "3", "3", "4"] },
    ],
    stepsPl: [
      "Jedności: 2 − 8 nie da się. Trzeba „wymienić” (exchange) jedną dziesiątkę na dziesięć jedności.",
      "Przekreślamy 7 w dziesiątkach i piszemy nad nim małe 6. Przy 2 w jednościach dopisujemy małą 1 — teraz jest tam 12.",
      "12 − 8 = 4. Dziesiątki: 6 − 3 = 3. Setki: 5 − 2 = 3.",
    ],
    phrases: [
      "Two take away eight — we can't do that. We need to exchange.",
      "Exchange one ten for ten ones.",
      "Cross out the seven and write six.",
      "Now twelve take away eight is four.",
    ],
    differencePl:
      "Po polsku „pożyczamy” i pamiętamy w głowie albo stawiamy kropkę. W Anglii wszystko widać na kartce: przekreślona 7, małe 6 nad nią i mała 1 przy jednościach. Nauczycielka mówi „exchange”, nie „borrow”.",
    yearPl: "Year 3 (do 3 cyfr), Year 4 (do 4 cyfr)",
  },
  {
    id: "short-multiplication",
    emoji: "✖️",
    titlePl: "Mnożenie pisemne krótkie (short multiplication)",
    sumEn: "234 × 3 = 702",
    rows: [
      { cells: ["", "H", "T", "O"], muted: true },
      { cells: ["", "2", "3", "4"] },
      { cells: ["×", "", "", "3"] },
      "rule",
      { cells: ["", "7", "0", "2"] },
      { cells: ["", "^1^", "^1^", ""] },
    ],
    stepsPl: [
      "Mnożnik (3) piszemy pod jednościami. Zaczynamy od jedności: 4 × 3 = 12. Piszemy 2, mała 1 pod kreską w kolumnie dziesiątek.",
      "Dziesiątki: 3 × 3 = 9, plus 1 = 10. Piszemy 0, mała 1 pod kreską w kolumnie setek.",
      "Setki: 2 × 3 = 6, plus 1 = 7.",
    ],
    phrases: [
      "Multiply the ones first.",
      "Four times three is twelve. Write the two and exchange the one.",
      "Three times three is nine, add one is ten.",
    ],
    differencePl:
      "Układ podobny do polskiego, ale przeniesiona cyfra znów idzie POD kreskę, nie nad słupek. Słyszy się „exchange”, czasem też „carry”.",
    yearPl: "Year 4 (liczba 2- i 3-cyfrowa razy jednocyfrowa)",
  },
  {
    id: "bus-stop",
    emoji: "🚌",
    titlePl: "Dzielenie „bus stop” (short division)",
    sumEn: "54 ÷ 4 = 13 r 2",
    rows: [
      { cells: ["", "1", "3", "r 2"] },
      { cells: ["4", "5", "^1^4", ""], frameFrom: 1 },
    ],
    stepsPl: [
      "Rysujemy „przystanek”: kreska nad dzielną (54) i kreska z lewej. Dzielnik (4) stoi PRZED przystankiem, wynik piszemy NAD kreską.",
      "Od lewej: ile czwórek w 5? Jedna, reszta 1. Piszemy 1 nad 5, a małą 1 dopisujemy przed 4 — teraz jest tam 14.",
      "Ile czwórek w 14? Trzy, reszta 2. Piszemy 3 nad 4. Resztę zapisujemy obok wyniku: r 2 (remainder 2).",
    ],
    phrases: [
      "How many fours in five? One, remainder one.",
      "Carry the one to the next digit.",
      "How many fours in fourteen? Three, remainder two.",
      "The answer is thirteen remainder two.",
    ],
    differencePl:
      "Zupełnie inny obrazek niż polskie dzielenie pisemne: dzielna jest w środku „przystanku”, wynik nad kreską, nic się nie odejmuje pod spodem. Reszta to „remainder”, w zapisie „r 2”.",
    yearPl: "W programie krajowym formalnie Year 5; wiele szkół pokazuje układ już w Year 4",
  },
];

/** Drobiazgi zapisu, które w Polsce wyglądają inaczej — do przepisania jako wzór. */
export const NOTEBOOK_NOTATION: Array<{ shown: string; pl: string }> = [
  { shown: "1  7", pl: "Jedynka to jedna prosta kreska (bez daszka), siódemka bez kreski w poprzek. Polska 1 z długim daszkiem bywa czytana jako 7." },
  { shown: "2.5", pl: "Ułamek dziesiętny z KROPKĄ (decimal point). Czyta się „two point five”." },
  { shown: "2,500", pl: "Przecinek oddziela TYSIĄCE. Czyta się „two thousand, five hundred”." },
  { shown: "£3.50   75p", pl: "Funt (£) przed liczbą, kropka między funtami a pensami. Pensy: „p” po liczbie. Nigdy razem: £0.75p to błąd." },
  { shown: "Monday 5th October", pl: "Data u góry strony, słownie z końcówką (1st, 2nd, 3rd, 4th…). Skrótowo dzień/miesiąc/rok jak u nas: 05/10/2026." },
];

export const NOTEBOOK_PHRASES = ["One digit in each square.", "Write the date and underline it with a ruler.", "Remember the decimal point."];

// --- Tematy ----------------------------------------------------------------------

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const MATHS_TOPICS: MathsTopic[] = [
  {
    id: "numbers-20",
    titlePl: "Liczby do 20",
    emoji: "🔢",
    goalPl: "Rozpoznaj liczbę ze słuchu — także eleven i twelve.",
    parentIntroPl:
      "Najtrudniejsze są eleven i twelve (nie mają końcówki -teen) oraz pary -teen / -ty. Dziecko, które dobrze liczy po polsku, i tak musi „przestawić ucho” — w klasie liczby padają szybko.",
    build: numbersTopic("n20", range(0, 20), { hear: 5, type: 3, read: 2 }),
  },
  {
    id: "teens-tens",
    titlePl: "Thirteen czy thirty?",
    emoji: "👂",
    goalPl: "Usłysz różnicę między -teen a -ty.",
    parentIntroPl:
      "13/30, 14/40… różnią się głównie akcentem. Pomyłka psuje całe zadanie, a w klasie nikt jej nie wyłapie — dlatego osobny trening.",
    build: teensTensSession,
  },
  {
    id: "numbers-100",
    titlePl: "Liczby do 100",
    emoji: "💯",
    goalPl: "Wpisz liczbę, którą słyszysz.",
    parentIntroPl:
      "W angielskim dziesiątki idą PRZED jednościami, jak w polskim („forty-five” = 45) — to akurat łatwe. Pułapką są -teen/-ty i szybkie tempo.",
    build: numbersTopic("n100", range(21, 99), { hear: 3, type: 5, read: 2 }),
  },
  {
    id: "numbers-1000",
    titlePl: "Setki i tysiąc",
    emoji: "🏛️",
    goalPl: "One hundred AND five — liczby do 1000 po brytyjsku.",
    parentIntroPl:
      "Year 4 pracuje na liczbach czterocyfrowych (do 9 999) i zaokrąglaniu. Brytyjczycy mówią „and” po setkach: 406 = „four hundred and six”. Zera w środku i na końcu (406 / 460 / 46) to typowa pomyłka ze słuchu.",
    build: numbersTopic("n1000", HUNDREDS_POOL, { hear: 3, type: 5, read: 3 }),
  },
  {
    id: "thousands",
    titlePl: "Tysiące i poniżej zera",
    emoji: "🌡️",
    goalPl: "Two thousand, five hundred — i minus three.",
    parentIntroPl:
      "Year 4: liczby czterocyfrowe (z przecinkiem w tysiącach: 2,500) i liczenie wstecz przez zero. Ze słuchu myli się 1,500 z 1,050 — „five hundred” kontra „and fifty”. Przy liczbach ujemnych klawiatura dostaje klawisz −.",
    build: thousandsSession,
  },
  {
    id: "operations",
    titlePl: "Słowa działań",
    emoji: "➗",
    goalPl: "Total, difference, lots of, share — policz, gdy działanie jest powiedziane słowami.",
    parentIntroPl:
      "To najważniejszy temat działu. Polskie dziecko liczy dobrze, ale gubi się na „the difference between” albo „subtract 6 from 20” (odwrotna kolejność niż w zdaniu). Po błędzie aplikacja pokazuje, co znaczy słowo-klucz.",
    build: operationsSession,
  },
  {
    id: "word-problems",
    titlePl: "Zadania z treścią",
    emoji: "📖",
    goalPl: "Znajdź słowo-klucz i policz.",
    parentIntroPl:
      "Zadania w stylu Year 3–4: pensy, funty, grupy, reszta. Najpierw słuchamy, potem czytamy. W trybie z rodzicem po każdym zadaniu jest pytanie „po czym poznałeś, co liczyć?” — tego uczy angielska szkoła („explain your reasoning”).",
    build: wordProblemsSession,
  },
  {
    id: "time",
    titlePl: "Zegar po angielsku",
    emoji: "🕒",
    goalPl: "Half past, twenty to, five past — do minuty, plus am/pm i 24 h.",
    parentIntroPl:
      "Pułapka dla polskich dzieci: „half past three” to 3:30, a po polsku „wpół do czwartej”. Dziecko słyszy „three” i ustawia 2:30. Ćwiczenie celowo podsuwa ten błąd, żeby go oswoić. Do tego minuty („twenty past”, „ten to” — Year 3 czyta zegar do minuty), am/pm z pory dnia i zamiana na zapis 24-godzinny (Year 4).",
    build: timeSession,
  },
  {
    id: "units",
    titlePl: "Jednostki miary",
    emoji: "📏",
    goalPl: "Metre, kilogram, litre — i 2 km = 2,000 m.",
    parentIntroPl:
      "Te same jednostki, inne słowa i brytyjska pisownia (metre, litre). Year 3 zamienia m ↔ cm i kg ↔ g, Year 4 zapisuje jednostki mieszane (1 kg 200 g = 1,200 g) i czas (godziny ↔ minuty). Tysiące z przecinkiem: 2,000 m.",
    build: unitsSession,
  },
  {
    id: "notation",
    titlePl: "Zapis jak w Anglii",
    emoji: "✏️",
    goalPl: "2.5 zamiast 2,5, ÷ zamiast :, £ i p, am i pm.",
    parentIntroPl:
      "Rzeczy, których nikt nie tłumaczy, bo w Anglii są oczywiste: kropka dziesiętna, przecinek w tysiącach, znak ÷, funty i pensy, am/pm, cyfry rzymskie na zegarze i „minus” przed liczbą ujemną.",
    build: notationSession,
  },
];

export function getMathsTopic(id: string): MathsTopic | undefined {
  return MATHS_TOPICS.find((topic) => topic.id === id);
}

/** Wszystkie zdania działu — dla generatora nagrań i audytu. */
export function mathsPhrases(): string[] {
  const phrases = new Set<string>();
  const add = (text: string) => phrases.add(text);
  TEEN_TY_PAIRS.forEach(([teen, ty]) => add(`${numberToWords(teen)}, ${numberToWords(ty)}`));
  ["add, take away, lots of, share", "add, plus, the total of, the sum of", "take away, subtract, minus, the difference between", "times, lots of, groups of, multiply by", "share equally, divide by, how many in"].forEach(add);
  OPERATIONS.forEach((item) => add(item.en));
  WORD_PROBLEMS.forEach((item) => add(item.en));
  add("What time is it?");
  ["half four", "twenty past three", "ten to four", "One pound is one hundred pence."].forEach(add);
  for (let hour = 1; hour <= 12; hour++) {
    for (const kind of TIME_KINDS) {
      add(timePhrase(hour, kind));
      add(`It's ${timePhrase(hour, kind)}.`);
    }
  }
  NOTATION.forEach((item) => {
    add(item.promptEn);
    item.options.forEach(add);
  });
  DAY_TIMES.forEach((item) => add(item.en));
  ["metre, centimetre, kilometre", "gram, kilogram", "litre, millilitre", "One kilogram is one thousand grams.", "How do you say this?"].forEach(add);
  UNIT_WORDS.forEach((item) => item.options.forEach(add));
  UNIT_CONVERSIONS.forEach((item) => add(item.en));
  ["two thousand, five hundred", "one thousand and fifty", "minus three", "three, two, one, zero, minus one, minus two"].forEach(add);
  NEGATIVE_ITEMS.forEach((item) => add(item.en));
  add(SAY_NEGATIVE.promptEn);
  SAY_NEGATIVE.options.forEach(add);
  NOTEBOOK_METHODS.forEach((method) => method.phrases.forEach(add));
  NOTEBOOK_PHRASES.forEach(add);
  return [...phrases];
}
