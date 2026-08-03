/**
 * Zapis fonetyczny (IPA) dla grafemów — używany WYŁĄCZNIE przy generowaniu
 * nagrań (scripts/generate-audio.mjs), nie w interfejsie.
 *
 * Wymowa brytyjska (RP), bo dziecko idzie do szkoły w UK.
 *
 * ZASTRZEŻENIE: to zapis głoski w izolacji. Dla spółgłosek zwartych (p, b, t,
 * d, k, g) „głoska w izolacji" jest z natury sztuczna — w mowie nie występuje
 * bez sąsiedniego dźwięku. Dlatego pliki wygenerowane dla tych liter trzeba
 * odsłuchać krytycznie i skasować, jeśli brzmią jak „py", „by", „ty"
 * (doklejona samogłoska to dokładnie ten błąd, którego uczy się unikać).
 *
 * Klucze odpowiadają `id` z sounds.ts oraz pojedynczym literom używanym w
 * ćwiczeniach sklejania.
 */

export const IPA_BY_GRAPHEME: Record<string, string> = {
  // Set 1 — pojedyncze litery
  m: "m", a: "a", s: "s", d: "d", t: "t", i: "ɪ", n: "n", p: "p",
  g: "ɡ", o: "ɒ", c: "k", k: "k", u: "ʌ", b: "b", f: "f", e: "e",
  l: "l", h: "h", r: "ɹ", j: "dʒ", v: "v", y: "j", w: "w", z: "z",
  x: "ks",

  // Set 1 — "special friends"
  sh: "ʃ",
  ch: "tʃ",
  th: "θ", // bezdźwięczne, jak w "thin"; dźwięczne (this) to /ð/
  qu: "kw",
  ng: "ŋ",
  nk: "ŋk",

  // Set 2 — speed sounds
  ay: "eɪ",
  ee: "iː",
  igh: "aɪ",
  "ow-blow": "əʊ",
  "oo-zoo": "uː",
  "oo-look": "ʊ",
  ar: "ɑː",
  or: "ɔː",
  air: "eə",
  ir: "ɜː",
  ou: "aʊ",
  oy: "ɔɪ",

  // Set 3
  ea: "iː",
  oi: "ɔɪ",
  "a-e": "eɪ",
  "i-e": "aɪ",
  "o-e": "əʊ",
  "u-e": "juː",
  aw: "ɔː",
  are: "eə",
  ur: "ɜː",
  er: "ə",
  "ow-brown": "aʊ",
  ai: "eɪ",
  oa: "əʊ",
  ew: "uː",
  ire: "aɪə",
  ear: "ɪə",
  ure: "ʊə",
};

/** Spółgłoski zwarte — te nagrania wymagają szczególnie uważnego odsłuchu. */
export const PLOSIVES = ["p", "b", "t", "d", "k", "c", "g"];

/**
 * Podpowiedzi dla rodzica nagrywającego głoski — pisane pod polskie ucho.
 *
 * ZAŁOŻENIE: rodzic mówi po polsku, nie jest native speakerem. Te uwagi
 * dotyczą miejsc, gdzie polski nawyk najbardziej przeszkadza. Nie zastępują
 * odsłuchania wzorca — dlatego w studiu głosek wzorzec jest pierwszym
 * przyciskiem.
 */
export const TRICKY_FOR_POLISH: Record<string, string> = {
  th: 'Czubek języka MIĘDZY zębami, nie „f" i nie „s". Najtrudniejsza głoska dla polskiego ucha — warto odsłuchać wzorzec kilka razy.',
  r: 'Angielskie „r" nie wibruje — język nie uderza o podniebienie. Polskie „r" brzmi tu wyraźnie obco.',
  w: 'Jak polskie „ł", nie jak polskie „w".',
  u: 'Krótkie, pomiędzy polskim „a" a „e" — nie polskie „u" (much ≠ „macz" z polskim u).',
  i: 'Krótkie i luźne, pomiędzy polskim „i" a „y".',
  a: 'Szersze niż polskie „a", usta bardziej rozciągnięte na boki.',
  sh: 'Bliskie polskiemu „sz", ale łagodniejsze — język trochę dalej od zębów.',
  ch: 'Bliskie polskiemu „cz". Uwaga: to NIE polskie „ch" jak w „chleb".',
  ng: 'Dźwięk z tyłu nosa, bez wyraźnego „g" na końcu.',
};

export function trickyHint(grapheme: string): string | undefined {
  if (TRICKY_FOR_POLISH[grapheme]) return TRICKY_FOR_POLISH[grapheme];
  if (PLOSIVES.includes(grapheme)) {
    return 'Spółgłoska zwarta — powiedz krótko, bez doklejonej samogłoski („p", nie „py").';
  }
  return undefined;
}

export function ipaFor(grapheme: string): string | undefined {
  return IPA_BY_GRAPHEME[grapheme];
}
