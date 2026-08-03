/**
 * Sekwencja dźwięków Read Write Inc. (Set 1 / 2 / 3).
 *
 * Kolejność pochodzi wprost z briefu projektowego (zweryfikowana przez rodzica
 * względem materiałów RWI). Trzymamy się jej dokładnie, żeby dziecko wchodząc
 * do szkoły w UK spotkało znaną strukturę i terminologię.
 *
 * ZAŁOŻENIE (do weryfikacji przez rodzica): dziecko zna już proste CVC, więc
 * pojedyncze litery Set 1 traktujemy jako "do szybkiego sprawdzenia", a naukę
 * zaczynamy od "special friends" (ch, sh, th, qu, ng, nk).
 */

export type SoundSet = 1 | 2 | 3;

export type SoundKind = "single-letter" | "special-friend" | "speed-sound";

export type Sound = {
  /** Identyfikator w URL i w danych postępu. Stabilny — nie zmieniać. */
  id: string;
  /** Zapis pokazywany dziecku. */
  grapheme: string;
  set: SoundSet;
  kind: SoundKind;
  /** Przykładowe słowo z tym dźwiękiem. */
  example: string;
  /** Doprecyzowanie dla dźwięków o tym samym zapisie (np. dwa razy "oo"). */
  variantNote?: string;
  /** Podpowiedź dla rodzica po polsku — jak wymówić / na co uważać. */
  parentHintPl?: string;
};

/** Przykładowe słowo dla każdej pojedynczej litery Set 1. */
const EXAMPLE_FOR_LETTER: Record<string, string> = {
  m: "mum", a: "apple", s: "sun", d: "dog", t: "tap", i: "in", n: "net",
  p: "pen", g: "get", o: "on", c: "cat", k: "kit", u: "up", b: "bat",
  f: "fun", e: "egg", l: "leg", h: "hat", r: "run", j: "jam", v: "van",
  y: "yes", w: "win", z: "zip", x: "box",
};

/**
 * Pełna sekwencja RWI. Lekcje (ćwiczenia) istnieją na razie tylko dla części
 * dźwięków — patrz lib/curriculum/lessons.ts. Reszta pokazuje się w aplikacji
 * jako "wkrótce", żeby było widać całą drogę, ale bez pustych ekranów.
 */
export const SOUNDS: Sound[] = [
  // --- Set 1: pojedyncze litery -------------------------------------------
  ...[
    "m", "a", "s", "d", "t", "i", "n", "p", "g", "o", "c", "k",
    "u", "b", "f", "e", "l", "h", "r", "j", "v", "y", "w", "z", "x",
  ].map<Sound>((letter) => ({
    id: letter,
    grapheme: letter,
    set: 1,
    kind: "single-letter",
    example: EXAMPLE_FOR_LETTER[letter] ?? letter,
  })),

  // --- Set 1: "special friends" (dwuznaki uczone jeszcze w Set 1) ----------
  {
    id: "sh",
    grapheme: "sh",
    set: 1,
    kind: "special-friend",
    example: "ship",
    parentHintPl:
      'Długie "szszsz" jak uciszanie. Nie mów "sze" — sam dźwięk, bez "e" na końcu.',
  },
  {
    id: "ch",
    grapheme: "ch",
    set: 1,
    kind: "special-friend",
    example: "chip",
    parentHintPl:
      'Krótkie "cz" jak ruszający pociąg: cz-cz-cz. Uwaga: to nie polskie "ch".',
  },
  {
    id: "th",
    grapheme: "th",
    set: 1,
    kind: "special-friend",
    example: "this",
    parentHintPl:
      "Język między zębami. Dwa warianty: dźwięczny (this) i bezdźwięczny (thin).",
  },
  {
    id: "qu",
    grapheme: "qu",
    set: 1,
    kind: "special-friend",
    example: "queen",
    parentHintPl: 'Jak "kł" — queen brzmi „kłiin”.',
  },
  {
    id: "ng",
    grapheme: "ng",
    set: 1,
    kind: "special-friend",
    example: "ring",
    parentHintPl: 'Dźwięk z tyłu nosa, bez wyraźnego "g" na końcu.',
  },
  {
    id: "nk",
    grapheme: "nk",
    set: 1,
    kind: "special-friend",
    example: "pink",
    parentHintPl: 'Jak "nk" w polskim „bank”.',
  },

  // --- Set 2: 12 "speed sounds" -------------------------------------------
  { id: "ay", grapheme: "ay", set: 2, kind: "speed-sound", example: "play" },
  { id: "ee", grapheme: "ee", set: 2, kind: "speed-sound", example: "tree" },
  { id: "igh", grapheme: "igh", set: 2, kind: "speed-sound", example: "high" },
  {
    id: "ow-blow",
    grapheme: "ow",
    set: 2,
    kind: "speed-sound",
    example: "blow",
    variantNote: 'jak w "blow"',
  },
  {
    id: "oo-zoo",
    grapheme: "oo",
    set: 2,
    kind: "speed-sound",
    example: "zoo",
    variantNote: 'długie, jak w "zoo"',
  },
  {
    id: "oo-look",
    grapheme: "oo",
    set: 2,
    kind: "speed-sound",
    example: "look",
    variantNote: 'krótkie, jak w "look"',
  },
  { id: "ar", grapheme: "ar", set: 2, kind: "speed-sound", example: "car" },
  { id: "or", grapheme: "or", set: 2, kind: "speed-sound", example: "fork" },
  { id: "air", grapheme: "air", set: 2, kind: "speed-sound", example: "hair" },
  { id: "ir", grapheme: "ir", set: 2, kind: "speed-sound", example: "bird" },
  {
    id: "ou",
    grapheme: "ou",
    set: 2,
    kind: "speed-sound",
    example: "out",
    variantNote: 'jak w "out"',
  },
  { id: "oy", grapheme: "oy", set: 2, kind: "speed-sound", example: "boy" },

  // --- Set 3 ---------------------------------------------------------------
  { id: "ea", grapheme: "ea", set: 3, kind: "speed-sound", example: "tea" },
  { id: "oi", grapheme: "oi", set: 3, kind: "speed-sound", example: "spoil" },
  { id: "a-e", grapheme: "a-e", set: 3, kind: "speed-sound", example: "cake" },
  { id: "i-e", grapheme: "i-e", set: 3, kind: "speed-sound", example: "smile" },
  { id: "o-e", grapheme: "o-e", set: 3, kind: "speed-sound", example: "home" },
  { id: "u-e", grapheme: "u-e", set: 3, kind: "speed-sound", example: "huge" },
  { id: "aw", grapheme: "aw", set: 3, kind: "speed-sound", example: "saw" },
  { id: "are", grapheme: "are", set: 3, kind: "speed-sound", example: "share" },
  { id: "ur", grapheme: "ur", set: 3, kind: "speed-sound", example: "hurt" },
  { id: "er", grapheme: "er", set: 3, kind: "speed-sound", example: "letter" },
  {
    id: "ow-brown",
    grapheme: "ow",
    set: 3,
    kind: "speed-sound",
    example: "brown",
    variantNote: 'jak w "brown"',
  },
  { id: "ai", grapheme: "ai", set: 3, kind: "speed-sound", example: "snail" },
  { id: "oa", grapheme: "oa", set: 3, kind: "speed-sound", example: "goat" },
  { id: "ew", grapheme: "ew", set: 3, kind: "speed-sound", example: "chew" },
  { id: "ire", grapheme: "ire", set: 3, kind: "speed-sound", example: "fire" },
  { id: "ear", grapheme: "ear", set: 3, kind: "speed-sound", example: "hear" },
  { id: "ure", grapheme: "ure", set: 3, kind: "speed-sound", example: "sure" },
];

export const SOUNDS_BY_ID: Record<string, Sound> = Object.fromEntries(
  SOUNDS.map((sound) => [sound.id, sound]),
);

export function getSound(id: string): Sound | undefined {
  return SOUNDS_BY_ID[id];
}

/** Kolejność w programie = kolejność w tablicy SOUNDS. */
export function soundIndex(id: string): number {
  return SOUNDS.findIndex((sound) => sound.id === id);
}

export function nextSoundAfter(id: string): Sound | undefined {
  const index = soundIndex(id);
  return index >= 0 ? SOUNDS[index + 1] : undefined;
}
