/**
 * Mini-czytanki: jedno zdanie do przeczytania na koniec każdej lekcji toru 1.
 *
 * PO CO: sklejanie pojedynczych słów to technika; czytanie ZDANIA to jej cel.
 * RWI robi dokładnie to samo (tzw. ditty) — po ćwiczeniu słów dziecko czyta
 * krótki tekst złożony wyłącznie z tego, co już umie. Badania nad czytaniem
 * w kontekście i nauką przez historyjki pokazują, że słowo osadzone w zdaniu
 * zapada głębiej niż słowo na fiszce.
 *
 * ŻELAZNA ZASADA: zdanie lekcji N używa WYŁĄCZNIE grafemów dźwięków 1..N
 * plus red words poznanych do lekcji N włącznie. Pilnuje tego mechanicznie
 * audyt (scripts/audit-lessons.mjs) — zdanie łamiące zasadę to BŁĄD, nie
 * uwaga, bo dziecko dostałoby słowo, którego nie ma prawa umieć przeczytać.
 *
 * Świadome kompromisy zapisu (audyt je rozumie):
 *  - podwojone litery (ll, ss, gg) i ck składają się z pojedynczych liter,
 *  - "-le" na końcu (purple) czyta się l+e — akceptowalne przybliżenie,
 *  - split digraph (a-e w "cake") audyt rozpoznaje wzorcem samogłoska-spółgłoska-e.
 *
 * Bez importów — generator nagrań czyta ten plik z Node.
 */

export type LessonSentence = { en: string; pl: string };

const SENTENCES: Record<string, LessonSentence[]> = {
  // "m" to pierwsza lekcja (tylko jeden dzwiek) - czytanki startuja od "a".
  a: [{ en: "I am!", pl: "Jestem!" }],
  s: [{ en: "I am Sam.", pl: "Jestem Sam." }],
  d: [{ en: "A sad dad.", pl: "Smutny tata." }],
  t: [{ en: "Dad sat at the mat.", pl: "Tata usiadł na macie." }],
  i: [{ en: "It is Tim!", pl: "To Tim!" }],
  n: [{ en: "Nan is in.", pl: "Babcia jest w domu." }],
  p: [{ en: "A pin is in the tin.", pl: "Szpilka jest w puszce." }],
  g: [{ en: "Dig, pig, dig!", pl: "Kop, świnko, kop!" }],
  o: [{ en: "The dog sat on the mat.", pl: "Pies usiadł na macie." }],
  c: [{ en: "The cat sat on the dog!", pl: "Kot usiadł na psie!" }],
  k: [{ en: "A kid, a cat and a dog.", pl: "Dzieciak, kot i pies." }],
  u: [{ en: "The pup dug it up.", pl: "Szczeniak to odkopał." }],
  b: [{ en: "A bug sat on the bus.", pl: "Robal usiadł w autobusie." }],
  f: [{ en: "Fun in the sun!", pl: "Zabawa w słońcu!" }],
  e: [{ en: "Get ten eggs.", pl: "Przynieś dziesięć jajek." }],
  l: [{ en: "I can smell eggs!", pl: "Czuję zapach jajek!" }],
  h: [{ en: "Hop on the big bus!", pl: "Wskakuj do wielkiego autobusu!" }],
  r: [{ en: "Run, rat, run!", pl: "Biegnij, szczurze, biegnij!" }],
  j: [{ en: "Jam on a hot bun.", pl: "Dżem na ciepłej bułce." }],
  v: [{ en: "The vet can help.", pl: "Weterynarz może pomóc." }],
  y: [{ en: "Yum, yum, jam!", pl: "Mniam, mniam, dżem!" }],
  w: [{ en: "We can win!", pl: "Możemy wygrać!" }],
  z: [{ en: "Zip! The zip is up.", pl: "Zzz! Zamek zapięty." }],
  x: [{ en: "Max sat in a box.", pl: "Max usiadł w pudle." }],
  sh: [{ en: "The fish is in the shop.", pl: "Ryba jest w sklepie." }],
  ch: [{ en: "Fish and chips, yum!", pl: "Ryba z frytkami, mniam!" }],
  th: [{ en: "This is the thin path.", pl: "To jest wąska ścieżka." }],
  qu: [{ en: "The quiz is quick.", pl: "Quiz jest szybki." }],
  ng: [{ en: "The king can sing.", pl: "Król umie śpiewać." }],
  nk: [{ en: "I think it is pink!", pl: "Myślę, że to różowe!" }],
  ay: [{ en: "May I play? Yes!", pl: "Mogę się pobawić? Tak!" }],
  ee: [{ en: "Keep the sheep in the jeep!", pl: "Trzymaj owcę w dżipie!" }],
  igh: [{ en: "The light is bright at night.", pl: "Światło jest jasne nocą." }],
  "ow-blow": [{ en: "Blow, wind, blow!", pl: "Wiej, wietrze, wiej!" }],
  "oo-zoo": [{ en: "Zoom to the zoo!", pl: "Pędź do zoo!" }],
  "oo-look": [{ en: "Look at the good book.", pl: "Spójrz na dobrą książkę." }],
  ar: [{ en: "The shark is in the dark!", pl: "Rekin jest w ciemności!" }],
  or: [{ en: "The storm is strong.", pl: "Burza jest silna." }],
  air: [{ en: "The chair is in the air!", pl: "Krzesło jest w powietrzu!" }],
  ir: [{ en: "The bird can twirl.", pl: "Ptak umie wirować." }],
  ou: [{ en: "Shout it out loud!", pl: "Wykrzycz to głośno!" }],
  oy: [{ en: "The boy has a toy.", pl: "Chłopiec ma zabawkę." }],
  ea: [{ en: "A cream tea treat!", pl: "Podwieczorek ze śmietanką!" }],
  oi: [{ en: "Boil it in the pot.", pl: "Zagotuj to w garnku." }],
  "a-e": [{ en: "Bake a cake, mate!", pl: "Upiecz ciasto, kolego!" }],
  "i-e": [{ en: "I like a big smile.", pl: "Lubię szeroki uśmiech." }],
  "o-e": [{ en: "Go home, mole!", pl: "Idź do domu, krecie!" }],
  "u-e": [{ en: "Use the huge tube.", pl: "Użyj wielkiej tuby." }],
  aw: [{ en: "I saw a hawk yawn.", pl: "Widziałem, jak jastrząb ziewa." }],
  are: [{ en: "We share and care.", pl: "Dzielimy się i dbamy o siebie." }],
  ur: [{ en: "The cat has soft fur.", pl: "Kot ma miękkie futro." }],
  er: [{ en: "Her sister is a helper.", pl: "Jej siostra jest pomocnicą." }],
  "ow-brown": [{ en: "How now, brown cow?", pl: "No i jak, brązowa krowo?" }],
  ai: [{ en: "The snail is on the train.", pl: "Ślimak jedzie pociągiem." }],
  oa: [{ en: "The goat is in the boat.", pl: "Koza płynie łódką." }],
  ew: [{ en: "The crew flew to the moon.", pl: "Załoga poleciała na księżyc." }],
  ire: [{ en: "The fire is hot, hot, hot!", pl: "Ogień jest gorący!" }],
  ear: [{ en: "I can hear with my ear.", pl: "Słyszę własnym uchem." }],
  ure: [{ en: "The picture is pure fun.", pl: "Ten obrazek to czysta frajda." }],
};

/** Zdania lekcji (pusta tablica, gdy lekcja jeszcze nie ma czytanki). */
export function getSentences(soundId: string): LessonSentence[] {
  return SENTENCES[soundId] ?? [];
}

/** Wszystkie teksty zdań — dla generatora nagrań (lądują w /audio/phrases). */
export function sentenceTexts(): string[] {
  const texts = new Set<string>();
  for (const lista of Object.values(SENTENCES)) {
    lista.forEach((sentence) => texts.add(sentence.en));
  }
  return [...texts].sort();
}

/** Cała mapa — dla audytu (kontrola dekodowalności wg pozycji w sekwencji). */
export function allSentences(): Record<string, LessonSentence[]> {
  return SENTENCES;
}
