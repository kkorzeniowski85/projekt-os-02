/**
 * Oryginalne postacie w stylu superbohaterów.
 *
 * WAŻNE: żadnych postaci chronionych prawem autorskim (Marvel/DC itd.).
 * Wszystko poniżej jest wymyślone na potrzeby tej aplikacji.
 *
 * Imiona są ANGIELSKIE i dobrane tak, żeby każde zawierało dźwięk, który dana
 * postać odblokowuje: SHOCK ma „sh", CHOMP ma „ch", THUNDER ma „th". Dzięki
 * temu samo imię jest powtórką dźwięku, a nie tylko ozdobą. BUZZ (postać
 * startowa) jest krótkie i czyta się je dźwiękami, które dziecko już zna.
 *
 * Imiona są nadal ROBOCZE — do wymyślenia razem z dzieckiem. Zmieniaj pole
 * `codename` (i `emblem`, jeśli trzeba); pole `id` musi zostać, bo po nim
 * zapisany jest postęp.
 */

export type Hero = {
  id: string;
  codename: string;
  /** Moc opisana językiem dziecka. */
  power: string;
  /** Za co dziecko odblokowuje tę postać. */
  unlockedBy: "start" | { soundId: string };
  colors: {
    suit: string;
    cape: string;
    accent: string;
  };
  /** Znak na piersi — w sesji podmieniany na grafem ćwiczonego dźwięku. */
  emblem?: string;
};

export const HEROES: Hero[] = [
  {
    id: "buzz",
    codename: "BUZZ",
    power: "Słyszy dźwięki ukryte w środku słów — nawet te bardzo ciche.",
    unlockedBy: "start",
    colors: { suit: "#2f6bff", cape: "#21d4fd", accent: "#ffc93c" },
    emblem: "b",
  },
  {
    id: "shock",
    codename: "SHOCK",
    power: "Skleja pojedyncze dźwięki w całe słowo jednym ruchem ręki.",
    unlockedBy: { soundId: "sh" },
    colors: { suit: "#ff5fa2", cape: "#a06bff", accent: "#7bed6b" },
    emblem: "sh",
  },
  {
    id: "chomp",
    codename: "CHOMP",
    power: "Połyka długie słowa i wypluwa je przeczytane — bez zacinania się.",
    unlockedBy: { soundId: "ch" },
    colors: { suit: "#ffc93c", cape: "#ff5fa2", accent: "#2f6bff" },
    emblem: "ch",
  },
  {
    id: "thunder",
    codename: "THUNDER",
    power: 'Pilnuje „red words" — słów, których nie da się rozłożyć na dźwięki.',
    unlockedBy: { soundId: "th" },
    colors: { suit: "#e33d5a", cape: "#10163a", accent: "#ffc93c" },
    emblem: "th",
  },
  {
    id: "speed",
    codename: "SPEED",
    power: "Rozpędza czytanie tak, że długie dźwięki brzmią jak jeden błysk.",
    unlockedBy: { soundId: "ee" },
    colors: { suit: "#21d4fd", cape: "#2f6bff", accent: "#f5f7ff" },
    emblem: "ee",
  },
  {
    id: "moon",
    codename: "MOON",
    power: "Świeci w ciemności i widzi, kiedy te same litery brzmią inaczej.",
    unlockedBy: { soundId: "oo-zoo" },
    colors: { suit: "#a06bff", cape: "#10163a", accent: "#ffc93c" },
    emblem: "oo",
  },
  {
    id: "spark",
    codename: "SPARK",
    power: "Krzesze iskry z najtrudniejszych dźwięków i rozświetla całe zdania.",
    unlockedBy: { soundId: "ar" },
    colors: { suit: "#ffc93c", cape: "#e33d5a", accent: "#21d4fd" },
    emblem: "ar",
  },
  {
    id: "gleam",
    codename: "GLEAM",
    power: "Dostrzega czarodziejskie „e” na końcu słowa, które zmienia dźwięk w środku.",
    unlockedBy: { soundId: "ea" },
    colors: { suit: "#7bed6b", cape: "#21d4fd", accent: "#10163a" },
    emblem: "ea",
  },
  {
    id: "flame",
    codename: "FLAME",
    power: "Rozgrzewa długie słowa tak, że rozpadają się na sylaby same.",
    unlockedBy: { soundId: "a-e" },
    colors: { suit: "#ff5fa2", cape: "#ffc93c", accent: "#10163a" },
    emblem: "a-e",
  },
  {
    id: "burn",
    codename: "BURN",
    power: "Nie boi się żadnego dźwięku — im rzadszy, tym jaśniej płonie.",
    unlockedBy: { soundId: "ur" },
    colors: { suit: "#e33d5a", cape: "#a06bff", accent: "#7bed6b" },
    emblem: "ur",
  },
  // Dwie ostatnie postacie istnieją po to, żeby końcówka programu też miała
  // nagrodę: po "ur" zostawało jeszcze osiem lekcji bez ani jednej nowej postaci.
  {
    id: "float",
    codename: "FLOAT",
    power: "Unosi się nad najdłuższymi słowami i czyta je bez zatrzymania.",
    unlockedBy: { soundId: "oa" },
    colors: { suit: "#21d4fd", cape: "#7bed6b", accent: "#ffc93c" },
    emblem: "oa",
  },
  {
    id: "cure",
    codename: "CURE",
    power: "Zna już wszystkie dźwięki — naprawia każde słowo, które się zacięło.",
    unlockedBy: { soundId: "ure" },
    colors: { suit: "#ffc93c", cape: "#a06bff", accent: "#e33d5a" },
    emblem: "ure",
  },
];

export const HEROES_BY_ID: Record<string, Hero> = Object.fromEntries(
  HEROES.map((hero) => [hero.id, hero]),
);

export function getHero(id: string): Hero {
  return HEROES_BY_ID[id] ?? HEROES[0];
}

/** Postacie odblokowywane po opanowaniu danego dźwięku. */
export function heroesUnlockedBySound(soundId: string): Hero[] {
  return HEROES.filter(
    (hero) => typeof hero.unlockedBy === "object" && hero.unlockedBy.soundId === soundId,
  );
}
