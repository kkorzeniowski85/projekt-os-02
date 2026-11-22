/**
 * ➖➕ Odejmowanie i dodawanie po angielsku — z wybieranym zakresem liczb
 * (do 20, 30, 50 albo 100). Prośby rodzica: proste wyniki, głównie
 * odejmowanie, bo z nim jest kłopot (2026-11-18); zakres do poszerzania bez
 * zakładania nowego tematu (2026-11-18).
 *
 * Dwa tematy (id w postępie zostają „subtract-30” i „add-subtract-30” — to
 * stare, stabilne klucze; zakres jest ustawieniem, nie osobnym tematem):
 *  - „Odejmowanie”: działanie widać („13 − 5 =”), a pytanie pada po angielsku
 *    („What is 13 take away 5?”). Najwięcej zadań PRZEZ DZIESIĄTKĘ.
 *  - „Dodawanie i odejmowanie słowami”: działanie tylko SŁOWAMI (subtract …
 *    from, less than, the difference between, more than, the total of) i krótkie
 *    zadania z treścią — rozumienie angielskiego zdania, nie znaku.
 * Po każdym zadaniu: sposób krok po kroku i sprawdzenie działaniem odwrotnym
 * (Year 3: „use inverse operations to check answers”). Kropki w dziesiątkach:
 * w obu tematach dopiero po błędnej odpowiedzi, jako przycisk do rozwinięcia
 * („Pokaż na kropkach”) — najpierw próba w pamięci (prośba rodzica 2026-11-22).
 *
 * ZAKRES: liczby dzielą się na pasy 1–20, 21–30, 31–50, 51–100. Sesja w
 * zakresie R bierze ok. 60% zadań z najwyższego pasa (nowe liczby), resztę z
 * niższych — po poszerzeniu to, co dziecko już umie, nie znika.
 *
 * Bank zadań jest STAŁY (deterministyczny), bo każde pytanie i każde zdanie z
 * odpowiedzią ma nagranie (calcPhrases → npm run audio:akademia). Losujemy
 * dopiero przy budowie sesji.
 */

import { pickSome, say, type Exercise, type Visual } from "@/lib/akademia/session/exercise";

export const CALC_RANGES = [20, 30, 50, 100] as const;
export type CalcRange = (typeof CALC_RANGES)[number];
export const DEFAULT_CALC_RANGE: CalcRange = 30;

type Op = "-" | "+";
type Group = "easy" | "cross" | "tens" | "two-digit" | "words-sub" | "words-add" | "story";

type CalcItem = {
  id: string;
  op: Op;
  a: number;
  b: number;
  /** Pytanie po angielsku — pokazane i nagrane. */
  en: string;
  /** Jak rozpoznać działanie (temat ze słowami). */
  keyPl?: string;
  group: Group;
  /** Najmniejszy zakres, w którym zadanie się mieści (liczby i wynik). */
  band: CalcRange;
};

const result = (item: Pick<CalcItem, "op" | "a" | "b">) => (item.op === "-" ? item.a - item.b : item.a + item.b);

function bandOf(a: number, b: number, op: Op): CalcRange {
  const top = Math.max(a, b, op === "-" ? a - b : a + b);
  return CALC_RANGES.find((range) => top <= range) ?? 100;
}

/** Zdanie z odpowiedzią — po błędzie gra i jest widoczne. */
function answerSentence(item: Pick<CalcItem, "op" | "a" | "b">): string {
  return item.op === "-"
    ? `${item.a} take away ${item.b} is ${result(item)}.`
    : `${item.a} add ${item.b} is ${result(item)}.`;
}

// --- Bank: „Odejmowanie” ------------------------------------------------------------

function subtractionBank(): CalcItem[] {
  const items: CalcItem[] = [];
  const seen = new Set<string>();
  /** wording: do 30 — parzystość a + b (stare nagrania), wyżej — na zmianę w grupie. */
  const add = (a: number, b: number, group: Group, takeAway: boolean) => {
    const id = `${a}-${b}`;
    if (seen.has(id)) return;
    seen.add(id);
    const en = takeAway ? `What is ${a} take away ${b}?` : `What is ${a} minus ${b}?`;
    items.push({ id, op: "-", a, b, en, group, band: bandOf(a, b, "-") });
  };
  const parity = (a: number, b: number) => (a + b) % 2 === 0;

  // --- do 20 i do 30 (oba słowa padają na lekcji: parzysta suma → take away)
  for (const [a, b] of [
    [8, 3], [9, 5], [10, 4], [7, 6], [15, 3], [17, 4], [18, 6], [19, 7],
    [16, 5], [26, 4], [29, 6], [27, 5], [24, 3], [28, 7], [25, 5], [23, 2],
  ]) add(a, b, "easy", parity(a, b));
  // Przez dziesiątkę: wszystkie z 11–20 (podstawowe fakty Year 2) i co drugi z 21–30.
  for (let a = 11; a <= 30; a++) {
    for (let b = 2; b <= 9; b++) {
      if (a % 10 >= b || a - b < 1) continue;
      if (a > 20 && (a + b) % 2 !== 0) continue;
      add(a, b, "cross", parity(a, b));
    }
  }
  for (const [a, b] of [[27, 10], [19, 10], [30, 20], [25, 20], [30, 10], [24, 10], [28, 20], [16, 10], [20, 10], [17, 10]]) {
    add(a, b, "tens", parity(a, b));
  }
  for (const [a, b] of [
    [17, 12], [19, 14], [18, 13], [16, 11], [20, 13], [20, 16],
    [26, 13], [29, 15], [28, 14], [25, 12], [27, 16], [30, 15],
    [24, 17], [22, 13], [30, 18], [23, 15], [21, 14], [26, 19],
  ]) add(a, b, "two-digit", parity(a, b));

  // --- do 50 i do 100: słowo na zmianę w obrębie grupy
  const alternate = (group: Group, pairs: number[][]) =>
    pairs.forEach(([a, b], i) => add(a, b, group, i % 2 === 0));
  alternate("easy", [[34, 2], [37, 5], [39, 6], [45, 3], [48, 7], [46, 4], [38, 8], [49, 9], [43, 1], [36, 5]]);
  alternate("easy", [[57, 4], [68, 5], [79, 6], [86, 3], [95, 4], [64, 2], [77, 7], [99, 8], [58, 6], [83, 1]]);
  const cross = (from: number, to: number, keep: (a: number, b: number) => boolean) => {
    const pairs: number[][] = [];
    for (let a = from; a <= to; a++) {
      for (let b = 2; b <= 9; b++) if (a % 10 < b && keep(a, b)) pairs.push([a, b]);
    }
    alternate("cross", pairs);
  };
  cross(31, 50, (a, b) => (a + b) % 3 === 0);
  cross(51, 100, (a, b) => (a + 2 * b) % 7 === 0);
  alternate("tens", [[45, 10], [38, 20], [50, 30], [47, 30], [42, 20], [50, 10], [36, 10], [49, 40]]);
  alternate("tens", [[75, 20], [90, 40], [68, 30], [100, 50], [84, 60], [57, 10], [100, 20], [93, 50]]);
  alternate("two-digit", [
    [47, 23], [39, 16], [48, 25], [46, 14],
    [42, 17], [35, 18], [50, 24], [43, 26], [41, 15], [50, 35], [44, 29], [36, 19],
  ]);
  alternate("two-digit", [
    [76, 34], [89, 45], [97, 52], [68, 25],
    [83, 47], [72, 38], [91, 56], [64, 29], [100, 45], [80, 33], [55, 27], [96, 58],
  ]);
  return items;
}

export const SUBTRACT_BANK: CalcItem[] = subtractionBank();

// --- Bank: „Dodawanie i odejmowanie słowami” -----------------------------------------

const ADD_FORMS = ["add", "plus", "total", "sum", "more-than"];

/** Słowo-klucz z liczbami TEGO zadania (nie z przykładu — inaczej myli). */
function keyOf(form: string, a: number, b: number): string {
  switch (form) {
    case "take-away":
      return "take away = zabierz, odejmij";
    case "minus":
      return "minus = minus (odejmowanie)";
    case "subtract-from":
      return `subtract ${b} from ${a} = odejmij ${b} OD ${a} (kolejność odwrotna niż w zdaniu!)`;
    case "less-than":
      return `${b} less than ${a} = o ${b} MNIEJ niż ${a} → odejmujemy`;
    case "difference":
      return "the difference between = różnica: od większej odejmij mniejszą";
    case "add":
      return "add = dodaj";
    case "plus":
      return "plus = plus (dodawanie)";
    case "total":
      return "the total of = razem, suma → dodajemy";
    case "sum":
      return "the sum of = suma → dodajemy";
    case "more-than":
      return `${b} more than ${a} = o ${b} WIĘCEJ niż ${a} → dodajemy`;
    default:
      return "";
  }
}

function wordItem(form: string, a: number, b: number): CalcItem {
  const op: Op = ADD_FORMS.includes(form) ? "+" : "-";
  const en = {
    "take-away": `What is ${a} take away ${b}?`,
    minus: `What is ${a} minus ${b}?`,
    "subtract-from": `Subtract ${b} from ${a}.`,
    "less-than": `What is ${b} less than ${a}?`,
    difference: `What is the difference between ${a} and ${b}?`,
    add: `What is ${a} add ${b}?`,
    plus: `What is ${a} plus ${b}?`,
    total: `What is the total of ${a} and ${b}?`,
    sum: `What is the sum of ${a} and ${b}?`,
    "more-than": `What is ${b} more than ${a}?`,
  }[form]!;
  return {
    id: `${form}-${a}-${b}`,
    op,
    a,
    b,
    en,
    keyPl: keyOf(form, a, b),
    group: op === "-" ? "words-sub" : "words-add",
    band: bandOf(a, b, op),
  };
}

type StorySpec = { id: string; op: Op; a: number; b: number; en: string; keyPl: string };

const STORIES: StorySpec[] = [
  // do 20
  { id: "eggs", op: "-", a: 20, b: 7, en: "Mum buys 20 eggs. She uses 7. How many eggs are left?", keyPl: "„left” = zostało → odejmujemy" },
  { id: "stickers", op: "-", a: 16, b: 9, en: "Sam has 16 stickers. He gives 9 to Mia. How many stickers does Sam have left?", keyPl: "„gives” (daje) i „left” (zostało) → odejmujemy" },
  { id: "pencils", op: "-", a: 14, b: 8, en: "Mia has 14 pencils. Tom has 8 pencils. How many more pencils does Mia have?", keyPl: "„how many more” = o ile więcej → różnica, odejmujemy (mimo słowa „more”!)" },
  { id: "ducks", op: "+", a: 9, b: 6, en: "There are 9 ducks on the pond. 6 more ducks come. How many ducks are there now?", keyPl: "„more ducks come” = przybywa → dodajemy" },
  // do 30
  { id: "class", op: "-", a: 25, b: 7, en: "There are 25 children in the class. 7 are at home today. How many children are at school?", keyPl: "7 dzieci jest w domu, więc w szkole jest MNIEJ → odejmujemy" },
  { id: "biscuits", op: "-", a: 30, b: 12, en: "There are 30 biscuits in a packet. We eat 12. How many biscuits are left?", keyPl: "„left” = zostało → odejmujemy" },
  { id: "bus", op: "-", a: 23, b: 6, en: "There are 23 people on a bus. 6 people get off. How many people are on the bus now?", keyPl: "„get off” = wysiadają, czyli ubywa → odejmujemy" },
  { id: "cars", op: "+", a: 12, b: 9, en: "There are 12 red cars and 9 blue cars. How many cars are there altogether?", keyPl: "„altogether” = razem → dodajemy" },
  { id: "points", op: "+", a: 15, b: 8, en: "Tom has 15 points. Then he scores 8 more points. How many points does he have now?", keyPl: "„scores more” = zdobywa jeszcze → dodajemy" },
  // do 50
  { id: "hall", op: "-", a: 45, b: 18, en: "There are 45 children in the hall. 18 go back to class. How many children are still in the hall?", keyPl: "18 dzieci wychodzi, więc zostaje MNIEJ → odejmujemy" },
  { id: "apples", op: "-", a: 50, b: 23, en: "A shop has 50 apples. It sells 23. How many apples are left?", keyPl: "„sells” (sprzedaje) i „left” (zostało) → odejmujemy" },
  { id: "marbles", op: "-", a: 42, b: 27, en: "Sam has 42 marbles. Tom has 27 marbles. How many more marbles does Sam have?", keyPl: "„how many more” = o ile więcej → różnica, odejmujemy (mimo słowa „more”!)" },
  { id: "pages", op: "+", a: 34, b: 15, en: "Mia reads 34 pages on Monday and 15 pages on Tuesday. How many pages does she read altogether?", keyPl: "„altogether” = razem → dodajemy" },
  // do 100
  { id: "sweets", op: "-", a: 100, b: 36, en: "There are 100 sweets in a jar. The children eat 36. How many sweets are left?", keyPl: "„left” = zostało → odejmujemy" },
  { id: "train", op: "-", a: 85, b: 29, en: "There are 85 people on a train. 29 people get off. How many people are on the train now?", keyPl: "„get off” = wysiadają, czyli ubywa → odejmujemy" },
  { id: "scores", op: "-", a: 73, b: 46, en: "Tom has 73 points. Mia has 46 points. How many more points does Tom have?", keyPl: "„how many more” = o ile więcej → różnica, odejmujemy (mimo słowa „more”!)" },
  { id: "year3", op: "+", a: 58, b: 37, en: "There are 58 girls and 37 boys in Year 3. How many children are there altogether?", keyPl: "„altogether” = razem → dodajemy" },
];

export const WORDS_BANK: CalcItem[] = [
  ...[
    // do 30 (stare nagrania)
    ["take-away", 15, 7], ["take-away", 22, 5], ["take-away", 30, 8],
    ["minus", 17, 9], ["minus", 26, 4], ["minus", 21, 6],
    ["subtract-from", 12, 4], ["subtract-from", 25, 9], ["subtract-from", 30, 12],
    ["less-than", 20, 3], ["less-than", 16, 8], ["less-than", 28, 10],
    ["difference", 15, 9], ["difference", 24, 18], ["difference", 30, 25], ["difference", 13, 7],
    ["add", 8, 5], ["add", 14, 7], ["plus", 9, 6], ["plus", 16, 8],
    ["total", 12, 9], ["total", 7, 7], ["sum", 18, 6], ["sum", 11, 9],
    ["more-than", 17, 10], ["more-than", 19, 5],
    // do 50
    ["take-away", 45, 8], ["take-away", 36, 19], ["minus", 42, 7], ["subtract-from", 50, 13],
    ["less-than", 40, 6], ["less-than", 47, 20], ["difference", 50, 35], ["difference", 43, 28],
    ["add", 27, 15], ["plus", 35, 9], ["total", 28, 17], ["sum", 24, 19], ["more-than", 36, 10], ["more-than", 42, 8],
    // do 100
    ["take-away", 83, 7], ["take-away", 95, 28], ["minus", 72, 35], ["subtract-from", 100, 45],
    ["less-than", 90, 4], ["less-than", 76, 30], ["difference", 100, 64], ["difference", 61, 47],
    ["add", 48, 26], ["plus", 57, 9], ["total", 65, 27], ["sum", 39, 45], ["more-than", 58, 20], ["more-than", 67, 6],
  ].map(([form, a, b]) => wordItem(form as string, a as number, b as number)),
  ...STORIES.map((story): CalcItem => ({ ...story, group: "story", band: bandOf(story.a, story.b, story.op) })),
];

// --- Sposób krok po kroku -------------------------------------------------------------

function tensWord(n: number): string {
  if (n === 1) return "jedną dziesiątkę";
  return n >= 2 && n <= 4 ? `${n} dziesiątki` : `${n} dziesiątek`;
}

/** Odejmowanie liczby jednocyfrowej — wspólne dla zadań „easy” i „cross”. */
function subtractOnes(a: number, b: number): string {
  const r = a - b;
  if (a <= 10) return `Policz w tył od ${a} o ${b}: ${r}.`;
  if (a % 10 >= b) return `Odejmij same jedności: ${a % 10} − ${b} = ${(a % 10) - b}, dziesiątki zostają → ${r}.`;
  if (a % 10 === 0) {
    return `${a} to ${a - 10} i jeszcze 10. Z tej dziesiątki zabierz ${b}: 10 − ${b} = ${10 - b}. Razem ${a - 10} + ${10 - b} = ${r}.`;
  }
  const first = a % 10;
  return `Przez dziesiątkę: najpierw do dziesiątki ${a} − ${first} = ${a - first}, potem reszta ${a - first} − ${b - first} = ${r} (bo ${b} = ${first} + ${b - first}).`;
}

/** Jak policzyć — po polsku, krok po kroku, ze sprawdzeniem działaniem odwrotnym. */
export function strategyPl(op: Op, a: number, b: number): string {
  const r = op === "-" ? a - b : a + b;
  if (op === "+") {
    let steps: string;
    if (b % 10 === 0) {
      steps = `Dołóż ${tensWord(b / 10)}, jedności zostają: ${a} + ${b} = ${r}.`;
    } else if (b > 10) {
      const tens = b - (b % 10);
      const mid = a + tens;
      const ones = b % 10;
      const toTen = (10 - (mid % 10)) % 10;
      const second =
        toTen > 0 && ones > toTen ? `${mid} + ${toTen} = ${mid + toTen}, potem + ${ones - toTen} = ${r}` : `${mid} + ${ones} = ${r}`;
      steps = `Najpierw dziesiątki: ${a} + ${tens} = ${mid}, potem jedności: ${second}.`;
    } else {
      const toTen = (10 - (a % 10)) % 10;
      if (toTen > 0 && b > toTen) {
        steps = `Przez dziesiątkę: ${a} + ${toTen} = ${a + toTen}, potem + ${b - toTen} = ${r} (${b} = ${toTen} + ${b - toTen}).`;
      } else if (toTen > 0 && b === toTen) {
        steps = a > 10
          ? `Jedności dają pełną dziesiątkę: ${a % 10} + ${b} = 10, więc ${a} + ${b} = ${r}.`
          : `${a} i ${b} to para do dziesięciu: ${a} + ${b} = 10.`;
      } else {
        steps = `Dolicz ${b} do ${a}: ${r}.`;
      }
    }
    return `${steps} Sprawdź odejmowaniem: ${r} − ${b} = ${a}.`;
  }
  let steps: string;
  if (b % 10 === 0) {
    steps = `Zabierz ${tensWord(b / 10)}${a % 10 === 0 ? "" : ", jedności zostają"}: ${a} − ${b} = ${r}.`;
  } else if (b > 10) {
    const tens = b - (b % 10);
    const mid = a - tens;
    const ones = b % 10;
    const first = mid % 10;
    // Drugi krok bywa znowu przejściem przez dziesiątkę (14 − 7) — rozpisujemy go
    // tak samo jak w zadaniach „przez dziesiątkę”, bo to właśnie trudny krok.
    const second =
      first >= ones || mid <= 10
        ? `${mid} − ${ones} = ${r}`
        : first === 0
          ? `${mid} − ${ones} = ${r} (bo 10 − ${ones} = ${10 - ones})`
          : `${mid} − ${first} = ${mid - first}, potem ${mid - first} − ${ones - first} = ${r} (bo ${ones} = ${first} + ${ones - first})`;
    steps = `Najpierw dziesiątki: ${a} − ${tens} = ${mid}, potem jedności: ${second}.`;
  } else {
    steps = subtractOnes(a, b);
  }
  return `${steps} Sprawdź dodawaniem: ${r} + ${b} = ${a}.`;
}

// --- Ćwiczenia ----------------------------------------------------------------------

const dots = (item: CalcItem): Visual =>
  item.op === "-" ? { kind: "dots", total: item.a, crossed: item.b } : { kind: "dots", total: item.a, added: item.b };

function exerciseOf(item: CalcItem, index: number, showSum: boolean): Exercise {
  const r = result(item);
  const sign = item.op === "-" ? "−" : "+";
  const strategy = strategyPl(item.op, item.a, item.b);
  return {
    id: `calc-${item.id}-${index}`,
    kind: "typed",
    exercise: "calc",
    // Temat 1: samo działanie („13−5”). Temat 2: forma słowna albo zadanie z
    // treścią — raport ma pokazać, KTÓRE sformułowanie sprawia kłopot.
    item: showSum ? `${item.a}${sign}${item.b}` : item.group === "story" ? `story-${item.id}` : item.id,
    promptEn: item.en,
    sound: say(item.en),
    // Temat 1: działanie widać obok okienka („13 − 5 = [ ]”); temat 2: tylko słowa.
    visual: showSum ? { kind: "big", text: `${item.a} ${sign} ${item.b} =` } : undefined,
    answer: r,
    hint: dots(item),
    revealText: `${item.a} ${sign} ${item.b} = ${r}`,
    revealSound: say(answerSentence(item)),
    explainPl: item.keyPl ? `${item.keyPl}. Działanie: ${item.a} ${sign} ${item.b}. ${strategy}` : strategy,
  };
}

/**
 * Losowanie z podziałem na nowe i znane liczby: ok. 60% z najwyższego pasa
 * zakresu, reszta z niższych. Bez powtórzonego działania w jednej sesji.
 */
function pickForRange(bank: CalcItem[], group: Group, count: number, range: CalcRange, seen: Set<string>): CalcItem[] {
  const fresh = (item: CalcItem) => !seen.has(`${item.a}${item.op}${item.b}`);
  const inRange = bank.filter((item) => item.group === group && item.band <= range && fresh(item));
  const top = inRange.filter((item) => item.band === range);
  const lower = inRange.filter((item) => item.band < range);
  const fromTop = lower.length === 0 ? count : Math.max(1, Math.round(count * 0.6));
  const picked: CalcItem[] = [];
  const take = (pool: CalcItem[], n: number) => {
    for (const item of pickSome(pool, pool.length)) {
      if (picked.length >= count || n <= 0) break;
      const key = `${item.a}${item.op}${item.b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(item);
      n--;
    }
  };
  take(top, fromTop);
  take(lower, count - picked.length);
  take(inRange, count - picked.length); // dopełnienie, gdy któryś pas jest za mały
  return picked;
}

function learnSubtract(range: CalcRange): Exercise {
  return {
    id: "sub-learn",
    kind: "learn",
    exercise: "learn",
    item: "subtract-30",
    heading: `Odejmowanie do ${range}`,
    visual: { kind: "big", text: "13 − 5 = 8" },
    promptEn: "13 take away 5 is 8.",
    sound: say("13 take away 5 is 8."),
    bodyPl:
      "Najtrudniejsze jest przejście przez dziesiątkę (13 − 5). Sposób: najpierw odejmij do dziesiątki, potem resztę. Wynik sprawdzisz dodawaniem. Po angielsku odejmowanie to „take away” albo „minus”. Gdy się pomylisz, możesz stuknąć „Pokaż na kropkach”.",
    examples: [
      { en: "13 take away 3 is 10.", pl: "krok 1: do dziesiątki (5 = 3 + 2)", visual: { kind: "dots", total: 13, crossed: 3 } },
      { en: "10 take away 2 is 8.", pl: "krok 2: reszta" },
      { en: "8 add 5 is 13.", pl: "sprawdzenie dodawaniem — zgadza się!" },
      { en: "27 minus 10 is 17.", pl: "dziesiątka: zabierz jedną dziesiątkę, jedności zostają" },
      ...(range >= 50 ? [{ en: "43 take away 7 is 36.", pl: "większe liczby, ten sam sposób: 43 − 3 = 40, 40 − 4 = 36" }] : []),
    ],
    parentPl:
      "Program UK (Year 2–3): odejmowanie do 20 „z pamięci”, przez dziesiątkę, i sprawdzanie dodawaniem; Year 3 — liczby dwucyfrowe. Gdy dziecko się myli, najpierw kropki (konkret), potem sposób „do dziesiątki i reszta” na głos. Zakres zmienisz na ekranie startu tematu. W domu: liczcie przedmioty i zabierajcie — „We have 13 grapes. You eat 5. How many are left?”.",
  };
}

export function subtractSession(range: CalcRange = DEFAULT_CALC_RANGE): Exercise[] {
  const seen = new Set<string>();
  const items = [
    ...pickForRange(SUBTRACT_BANK, "easy", 2, range, seen),
    ...pickForRange(SUBTRACT_BANK, "cross", 5, range, seen),
    ...pickForRange(SUBTRACT_BANK, "tens", 1, range, seen),
    ...pickForRange(SUBTRACT_BANK, "two-digit", 2, range, seen),
  ];
  return [learnSubtract(range), ...items.map((item, i) => exerciseOf(item, i, true))];
}

function learnWords(range: CalcRange): Exercise {
  return {
    id: "words-learn",
    kind: "learn",
    exercise: "learn",
    item: "add-subtract-30",
    heading: `Dodawanie i odejmowanie słowami (do ${range})`,
    promptEn: "add or take away?",
    sound: say("add or take away?"),
    bodyPl:
      "Na lekcji działanie często pada słowami, nie znakiem. Najpierw rozpoznaj, czy dodajesz, czy odejmujesz — dopiero potem licz. Uwaga na pułapkę: „How many more…?” (o ile więcej?) to odejmowanie, mimo słowa „more”.",
    examples: [
      { en: "add, plus, the total of, the sum of, more than", pl: "dodawanie (+)" },
      { en: "take away, minus, subtract from, less than, the difference between", pl: "odejmowanie (−)" },
      { en: "Subtract 4 from 12.", pl: "12 − 4 — odejmij 4 OD 12, kolejność odwrotna!" },
      { en: "What is 3 less than 20?", pl: "20 − 3 — o 3 mniej niż 20" },
      { en: "How many are left?", pl: "Ile zostało? → odejmujemy" },
    ],
    parentPl:
      "W angielskiej szkole „subtract 4 from 12” i „3 less than 20” to codzienność — a kolejność liczb w zdaniu jest odwrotna niż w działaniu. Gdy dziecko się pomyli, zapytajcie razem: „dodajemy czy odejmujemy? skąd wiesz?” — słowo-klucz jest w wyjaśnieniu po odpowiedzi. Kropki pokazują się dopiero po błędzie, żeby nie zdradzały działania.",
  };
}

export function wordsSession(range: CalcRange = DEFAULT_CALC_RANGE): Exercise[] {
  const seen = new Set<string>();
  const items = [
    ...pickForRange(WORDS_BANK, "words-sub", 5, range, seen),
    ...pickForRange(WORDS_BANK, "words-add", 2, range, seen),
    ...pickForRange(WORDS_BANK, "story", 3, range, seen),
  ];
  return [learnWords(range), ...pickSome(items, items.length).map((item, i) => exerciseOf(item, i, false))];
}

/** Wszystkie wypowiedzi obu tematów we wszystkich zakresach — do nagrań. */
export function calcPhrases(): string[] {
  const phrases = new Set<string>();
  for (const item of [...SUBTRACT_BANK, ...WORDS_BANK]) {
    phrases.add(item.en);
    phrases.add(answerSentence(item));
  }
  for (const range of CALC_RANGES) {
    for (const learn of [learnSubtract(range), learnWords(range)]) {
      if (learn.promptEn) phrases.add(learn.promptEn);
      if (learn.kind === "learn") learn.examples?.forEach((example) => phrases.add(example.en));
    }
  }
  return [...phrases];
}
