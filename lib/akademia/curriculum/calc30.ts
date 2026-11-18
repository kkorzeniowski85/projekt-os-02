/**
 * ➖➕ Odejmowanie i dodawanie do 30 — po angielsku. Prośba rodzica
 * (2026-11-18): proste wyniki, głównie odejmowanie, bo z nim jest kłopot.
 *
 * Dwa tematy:
 *  - „Odejmowanie do 30”: działanie widać („13 − 5 =”), a pytanie pada po
 *    angielsku („What is 13 take away 5?”). Najwięcej zadań PRZEZ DZIESIĄTKĘ
 *    (13 − 5, 22 − 7) — tu dzieci mylą się najczęściej. Po każdym: sposób
 *    krok po kroku i sprawdzenie dodawaniem (Year 3: „use inverse operations
 *    to check answers”).
 *  - „Dodawanie i odejmowanie do 30”: działania tylko SŁOWAMI (subtract … from,
 *    less than, the difference between, more than, the total of) i krótkie
 *    zadania z treścią — rozumienie angielskiego zdania, nie znaku.
 * W obu: przycisk „Pokaż na kropkach” (dziesiątki po 5+5, skreślone kropki
 * przy odejmowaniu) — konkretny obraz dla dziecka, któremu odejmowanie w
 * głowie jeszcze nie wychodzi.
 *
 * Bank zadań jest STAŁY (deterministyczny), bo każde pytanie i każde zdanie z
 * odpowiedzią ma nagranie (calcPhrases → npm run audio:akademia). Losujemy
 * dopiero przy budowie sesji.
 */

import { pickSome, say, type Exercise, type Visual } from "@/lib/akademia/session/exercise";

type Op = "-" | "+";

type CalcItem = {
  id: string;
  op: Op;
  a: number;
  b: number;
  /** Pytanie po angielsku — pokazane i nagrane. */
  en: string;
  /** Jak rozpoznać działanie (temat ze słowami). */
  keyPl?: string;
  /** Grupa do losowania sesji. */
  group: "easy" | "cross" | "tens" | "two-digit" | "words-sub" | "words-add" | "story";
};

const result = (item: Pick<CalcItem, "op" | "a" | "b">) => (item.op === "-" ? item.a - item.b : item.a + item.b);

/** Zdanie z odpowiedzią — po błędzie gra i jest widoczne. */
function answerSentence(item: CalcItem): string {
  return item.op === "-"
    ? `${item.a} take away ${item.b} is ${result(item)}.`
    : `${item.a} add ${item.b} is ${result(item)}.`;
}

// --- Bank: „Odejmowanie do 30” ----------------------------------------------------

function subtractionBank(): CalcItem[] {
  const items: CalcItem[] = [];
  const add = (a: number, b: number, group: CalcItem["group"]) => {
    // Na zmianę „take away” i „minus” — oba słowa padają na lekcji.
    const en = (a + b) % 2 === 0 ? `What is ${a} take away ${b}?` : `What is ${a} minus ${b}?`;
    items.push({ id: `${a}-${b}`, op: "-", a, b, en, group });
  };
  // Bez przechodzenia przez dziesiątkę (rozgrzewka): 8 − 3, 17 − 4, 29 − 6.
  for (const [a, b] of [
    [8, 3], [9, 5], [10, 4], [7, 6], [15, 3], [17, 4], [18, 6], [19, 7],
    [16, 5], [26, 4], [29, 6], [27, 5], [24, 3], [28, 7], [25, 5], [23, 2],
  ]) add(a, b, "easy");
  // Przez dziesiątkę: wszystkie z drugiej dziesiątki (11–20) — podstawowe
  // fakty Year 2 — i co drugi z trzeciej (21–30).
  for (let a = 11; a <= 30; a++) {
    for (let b = 2; b <= 9; b++) {
      if (a % 10 >= b || a - b < 1) continue;
      if (a > 20 && (a + b) % 2 !== 0) continue;
      add(a, b, "cross");
    }
  }
  // Dziesiątki: 27 − 10, 30 − 20.
  for (const [a, b] of [[27, 10], [19, 10], [30, 20], [25, 20], [30, 10], [24, 10], [28, 20], [16, 10]]) add(a, b, "tens");
  // Dwucyfrowa minus dwucyfrowa: 26 − 13 (bez przejścia), 24 − 17 (z przejściem).
  for (const [a, b] of [
    [26, 13], [29, 15], [28, 14], [25, 12], [27, 16], [30, 15],
    [24, 17], [22, 13], [30, 18], [23, 15], [21, 14], [26, 19],
  ]) add(a, b, "two-digit");
  return items;
}

export const SUBTRACT_30: CalcItem[] = subtractionBank();

// --- Bank: „Dodawanie i odejmowanie do 30” (słowami) --------------------------------

const KEY: Record<string, string> = {
  "take-away": "take away = zabierz, odejmij",
  minus: "minus = minus (odejmowanie)",
  "subtract-from": "subtract 4 from 12 = odejmij 4 OD 12 — kolejność odwrotna niż w zdaniu!",
  "less-than": "3 less than 20 = o 3 MNIEJ niż 20 → odejmujemy",
  difference: "the difference between = różnica: od większej odejmij mniejszą",
  add: "add = dodaj",
  plus: "plus = plus (dodawanie)",
  total: "the total of = razem, suma → dodajemy",
  sum: "the sum of = suma → dodajemy",
  "more-than": "10 more than 17 = o 10 WIĘCEJ niż 17 → dodajemy",
};

function wordItem(form: string, a: number, b: number): CalcItem {
  const op: Op = ["add", "plus", "total", "sum", "more-than"].includes(form) ? "+" : "-";
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
  return { id: `${form}-${a}-${b}`, op, a, b, en, keyPl: KEY[form], group: op === "-" ? "words-sub" : "words-add" };
}

const STORIES: CalcItem[] = [
  { id: "class", op: "-", a: 25, b: 7, group: "story", en: "There are 25 children in the class. 7 are at home today. How many children are at school?", keyPl: "7 dzieci jest w domu, więc w szkole jest MNIEJ → odejmujemy" },
  { id: "stickers", op: "-", a: 16, b: 9, group: "story", en: "Sam has 16 stickers. He gives 9 to Mia. How many stickers does Sam have left?", keyPl: "„gives” (daje) i „left” (zostało) → odejmujemy" },
  { id: "biscuits", op: "-", a: 30, b: 12, group: "story", en: "There are 30 biscuits in a packet. We eat 12. How many biscuits are left?", keyPl: "„left” = zostało → odejmujemy" },
  { id: "bus", op: "-", a: 23, b: 6, group: "story", en: "There are 23 people on a bus. 6 people get off. How many people are on the bus now?", keyPl: "„get off” = wysiadają, czyli ubywa → odejmujemy" },
  { id: "pencils", op: "-", a: 14, b: 8, group: "story", en: "Mia has 14 pencils. Tom has 8 pencils. How many more pencils does Mia have?", keyPl: "„how many more” = o ile więcej → różnica, odejmujemy (mimo słowa „more”!)" },
  { id: "cars", op: "+", a: 12, b: 9, group: "story", en: "There are 12 red cars and 9 blue cars. How many cars are there altogether?", keyPl: "„altogether” = razem → dodajemy" },
  { id: "points", op: "+", a: 15, b: 8, group: "story", en: "Tom has 15 points. Then he scores 8 more points. How many points does he have now?", keyPl: "„scores more” = zdobywa jeszcze → dodajemy" },
];

export const WORDS_30: CalcItem[] = [
  ...[
    ["take-away", 15, 7], ["take-away", 22, 5], ["take-away", 30, 8],
    ["minus", 17, 9], ["minus", 26, 4], ["minus", 21, 6],
    ["subtract-from", 12, 4], ["subtract-from", 25, 9], ["subtract-from", 30, 12],
    ["less-than", 20, 3], ["less-than", 16, 8], ["less-than", 28, 10],
    ["difference", 15, 9], ["difference", 24, 18], ["difference", 30, 25], ["difference", 13, 7],
    ["add", 8, 5], ["add", 14, 7], ["plus", 9, 6], ["plus", 16, 8],
    ["total", 12, 9], ["total", 7, 7], ["sum", 18, 6], ["sum", 11, 9],
    ["more-than", 17, 10], ["more-than", 19, 5],
  ].map(([form, a, b]) => wordItem(form as string, a as number, b as number)),
  ...STORIES,
];

// --- Sposób krok po kroku -------------------------------------------------------------

/** Jak policzyć — po polsku, krok po kroku, ze sprawdzeniem. */
export function strategyPl(op: Op, a: number, b: number): string {
  const r = op === "-" ? a - b : a + b;
  if (op === "+") {
    const toTen = (10 - (a % 10)) % 10;
    const steps =
      b % 10 === 0
        ? `Dołóż ${b / 10 === 1 ? "jedną dziesiątkę" : `${b / 10} dziesiątki`}, jedności zostają: ${a} + ${b} = ${r}.`
        : b > 10
        ? `Najpierw dziesiątki: ${a} + ${Math.floor(b / 10) * 10} = ${a + Math.floor(b / 10) * 10}, potem jedności: + ${b % 10} = ${r}.`
        : toTen > 0 && b > toTen
          ? `Przez dziesiątkę: ${a} + ${toTen} = ${a + toTen}, potem + ${b - toTen} = ${r} (${b} = ${toTen} + ${b - toTen}).`
          : `Dolicz ${b} do ${a}: ${r}.`;
    return `${steps} Sprawdź odejmowaniem: ${r} − ${b} = ${a}.`;
  }
  let steps: string;
  if (b % 10 === 0) {
    steps = `Zabierz ${b / 10 === 1 ? "jedną dziesiątkę" : `${b / 10} dziesiątki`}, jedności zostają: ${a} − ${b} = ${r}.`;
  } else if (b > 10) {
    steps = `Najpierw dziesiątki: ${a} − ${b - (b % 10)} = ${a - (b - (b % 10))}, potem jedności: ${a - (b - (b % 10))} − ${b % 10} = ${r}.`;
  } else if (a <= 10) {
    steps = `Policz w tył od ${a} o ${b}: ${r}.`;
  } else if (a % 10 >= b) {
    steps = `Odejmij same jedności: ${a % 10} − ${b} = ${(a % 10) - b}, dziesiątki zostają → ${r}.`;
  } else if (a % 10 === 0) {
    steps = `${a} to ${a - 10} i jeszcze 10. Z tej dziesiątki zabierz ${b}: 10 − ${b} = ${10 - b}. Razem ${a - 10} + ${10 - b} = ${r}.`;
  } else {
    const first = a % 10;
    steps = `Przez dziesiątkę: najpierw do dziesiątki ${a} − ${first} = ${a - first}, potem reszta ${a - first} − ${b - first} = ${r} (bo ${b} = ${first} + ${b - first}).`;
  }
  return `${steps} Sprawdź dodawaniem: ${r} + ${b} = ${a}.`;
}

// --- Ćwiczenia ----------------------------------------------------------------------

const dots = (item: CalcItem): Visual =>
  item.op === "-" ? { kind: "dots", total: item.a, crossed: item.b } : { kind: "dots", total: item.a, added: item.b };

function exerciseOf(item: CalcItem, index: number, showSum: boolean): Exercise {
  const r = result(item);
  const sign = item.op === "-" ? "−" : "+";
  return {
    id: `calc-${item.id}-${index}`,
    kind: "typed",
    exercise: "calc",
    item: `${item.a}${sign}${item.b}`,
    promptEn: item.en,
    sound: say(item.en),
    // Temat 1: działanie widać obok okienka („13 − 5 = [ ]”); temat 2: tylko słowa.
    visual: showSum ? { kind: "big", text: `${item.a} ${sign} ${item.b} =` } : undefined,
    answer: r,
    hint: dots(item),
    revealText: `${item.a} ${sign} ${item.b} = ${r}`,
    revealSound: say(answerSentence(item)),
    explainPl: item.keyPl ? `${item.keyPl}. ${strategyPl(item.op, item.a, item.b)}` : strategyPl(item.op, item.a, item.b),
  };
}

export function subtract30Session(): Exercise[] {
  const learn: Exercise = {
    id: "sub30-learn",
    kind: "learn",
    exercise: "learn",
    item: "subtract-30",
    heading: "Odejmowanie do 30",
    visual: { kind: "big", text: "13 − 5 = 8" },
    promptEn: "13 take away 5 is 8.",
    sound: say("13 take away 5 is 8."),
    bodyPl:
      "Najtrudniejsze jest przejście przez dziesiątkę (13 − 5). Sposób: najpierw odejmij do dziesiątki, potem resztę. Wynik sprawdzisz dodawaniem. Po angielsku odejmowanie to „take away” albo „minus”. Gdy trudno — stuknij „Pokaż na kropkach”.",
    examples: [
      { en: "13 take away 3 is 10.", pl: "krok 1: do dziesiątki (5 = 3 + 2)", visual: { kind: "dots", total: 13, crossed: 3 } },
      { en: "10 take away 2 is 8.", pl: "krok 2: reszta" },
      { en: "8 add 5 is 13.", pl: "sprawdzenie dodawaniem — zgadza się!" },
      { en: "27 minus 10 is 17.", pl: "dziesiątka: zabierz jedną dziesiątkę, jedności zostają" },
    ],
    parentPl:
      "Program UK (Year 2–3): odejmowanie do 20 „z pamięci”, przez dziesiątkę, i sprawdzanie dodawaniem. Gdy dziecko się myli, najpierw kropki (konkret), potem sposób „do dziesiątki i reszta” na głos. W domu: liczcie przedmioty i zabierajcie — „We have 13 grapes. You eat 5. How many are left?”.",
  };
  const pick = (group: CalcItem["group"], n: number) => pickSome(SUBTRACT_30.filter((item) => item.group === group), n);
  const items = [...pick("easy", 2), ...pick("cross", 5), ...pick("tens", 1), ...pick("two-digit", 2)];
  return [learn, ...items.map((item, i) => exerciseOf(item, i, true))];
}

export function addSubtract30Session(): Exercise[] {
  const learn: Exercise = {
    id: "addsub30-learn",
    kind: "learn",
    exercise: "learn",
    item: "add-subtract-30",
    heading: "Dodawanie i odejmowanie słowami",
    promptEn: "add or take away?",
    sound: say("add or take away?"),
    bodyPl:
      "Na lekcji działanie często pada słowami, nie znakiem. Najpierw rozpoznaj, czy dodajesz, czy odejmujesz — dopiero potem licz.",
    examples: [
      { en: "add, plus, the total of, the sum of, more than", pl: "dodawanie (+)" },
      { en: "take away, minus, subtract from, less than, the difference between", pl: "odejmowanie (−)" },
      { en: "Subtract 4 from 12.", pl: "12 − 4 — odejmij 4 OD 12, kolejność odwrotna!" },
      { en: "What is 3 less than 20?", pl: "20 − 3 — o 3 mniej niż 20" },
      { en: "How many are left?", pl: "Ile zostało? → odejmujemy" },
    ],
    parentPl:
      "W angielskiej szkole „subtract 4 from 12” i „3 less than 20” to codzienność — a kolejność liczb w zdaniu jest odwrotna niż w działaniu. Gdy dziecko się pomyli, zapytajcie razem: „dodajemy czy odejmujemy? skąd wiesz?” — słowo-klucz jest w wyjaśnieniu po odpowiedzi.",
  };
  const words = [
    ...pickSome(WORDS_30.filter((item) => item.group === "words-sub"), 5),
    ...pickSome(WORDS_30.filter((item) => item.group === "words-add"), 2),
    ...pickSome(WORDS_30.filter((item) => item.group === "story"), 3),
  ];
  return [learn, ...pickSome(words, words.length).map((item, i) => exerciseOf(item, i, false))];
}

/** Wszystkie wypowiedzi obu tematów — do nagrań. */
export function calcPhrases(): string[] {
  const phrases = new Set<string>();
  for (const item of [...SUBTRACT_30, ...WORDS_30]) {
    phrases.add(item.en);
    phrases.add(answerSentence(item));
  }
  for (const build of [subtract30Session, addSubtract30Session]) {
    const learn = build()[0];
    if (learn.promptEn) phrases.add(learn.promptEn);
    if (learn.kind === "learn") learn.examples?.forEach((example) => phrases.add(example.en));
  }
  return [...phrases];
}
