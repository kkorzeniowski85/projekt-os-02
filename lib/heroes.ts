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
