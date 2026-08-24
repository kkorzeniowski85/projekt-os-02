/**
 * Treść ćwiczeń dla poszczególnych dźwięków.
 *
 * Świadomie NIE piszemy tu całego programu na miesiące — brief mówi wprost:
 * najpierw 1-2 kompletne, grywalne sesje, test z dzieckiem, dopiero potem
 * skalowanie. Dźwięki bez lekcji pokazują się w aplikacji jako "wkrótce".
 *
 * Emoji zamiast ilustracji to świadomy skrót MVP — działa na każdym urządzeniu
 * bez ładowania grafik. Docelowo do podmiany na własne ilustracje postaci.
 * UWAGA: używamy wyłącznie emoji sprzed Unicode 12 (2019) — nowsze (🪥 🛖 🪑 🪓)
 * na starszych tabletach wyświetlają się jako puste prostokąty.
 */

import { getSound } from "./sounds";

/** Słowo rozbite na grafemy — dziecko stuka w kolejne kawałki (RWI: Fred Talk). */
export type WordCard = {
  word: string;
  /** Kawałki do "sklejania". Grafem docelowy jest oznaczony przez targetIndex. */
  graphemes: string[];
  targetIndex: number;
  pl: string;
  emoji: string;
};

/** Dziecko słyszy słowo i decyduje, czy jest w nim dany dźwięk. */
export type ListenItem = {
  word: string;
  hasTarget: boolean;
  pl: string;
  emoji: string;
};

/** Dziecko słyszy słowo i wybiera właściwy zapis spośród podobnych. */
export type ChoiceRound = {
  answer: string;
  options: string[];
  pl: string;
  emoji: string;
};

export type Lesson = {
  soundId: string;
  /** Postać prowadząca tę sesję. */
  heroId: string;
  /** Krótkie hasło, które dziecko powtarza na głos. */
  chant: string;
  /** Co rodzic ma zrobić/powiedzieć przy wprowadzaniu dźwięku. */
  parentIntro: string;
  listen: ListenItem[];
  blend: WordCard[];
  choice: ChoiceRound[];
  /** "Red words" pasujące do tej sesji — czytane w całości, bez głoskowania. */
  redWords: string[];
};

export const LESSONS: Record<string, Lesson> = {
  // --- Set 1: pojedyncze litery -------------------------------------------
  // Te lekcje NIE ucza rozpoznawania ksztaltu litery — dziecko zna je z
  // polskiego. Ucza, jak litera brzmi PO ANGIELSKU, bo przy 11 z 25 polski
  // nawyk aktywnie myli (y, w, j, c to zupelnie inne dzwieki).
  "m": {
    soundId: "m",
    heroId: "buzz",
    chant: "m — m — mmm!",
    parentIntro:
      "Angielskie /m/ brzmi tak samo jak polskie „m\" — to szybkie sprawdzenie, nie pułapka. Pilnuj tylko jednej rzeczy: dziecko nie może doklejać samogłoski, ma być długie „mmm\" z zamkniętymi ustami, a nie „my\" ani „em\". Poproś, żeby przytrzymało dźwięk trzy sekundy i dotknęło nosa — poczuje, jak drga.",
    listen: [
      { word: "milk", hasTarget: true, pl: "mleko", emoji: "🥛" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
      { word: "summer", hasTarget: true, pl: "lato", emoji: "☀️" },
      { word: "star", hasTarget: false, pl: "gwiazda", emoji: "⭐" },
      { word: "swim", hasTarget: true, pl: "pływać", emoji: "🏊" },
      { word: "letter", hasTarget: false, pl: "list", emoji: "✉️" },
      { word: "lamp", hasTarget: true, pl: "lampa", emoji: "💡" },
      { word: "bus", hasTarget: false, pl: "autobus", emoji: "🚌" },
    ],
    blend: [
      { word: "man", graphemes: ["m", "a", "n"], targetIndex: 0, pl: "mężczyzna", emoji: "👨" },
      { word: "mug", graphemes: ["m", "u", "g"], targetIndex: 0, pl: "kubek", emoji: "☕" },
      { word: "jam", graphemes: ["j", "a", "m"], targetIndex: 2, pl: "dżem", emoji: "🍓" },
      { word: "ham", graphemes: ["h", "a", "m"], targetIndex: 2, pl: "szynka", emoji: "🍖" },
      { word: "mum", graphemes: ["m", "u", "m"], targetIndex: 0, pl: "mama", emoji: "👩" },
    ],
    choice: [
      { answer: "man", options: ["man", "can", "pan"], pl: "mężczyzna", emoji: "👨" },
      { answer: "mug", options: ["bug", "mug", "rug"], pl: "kubek", emoji: "☕" },
      { answer: "jam", options: ["jar", "ham", "jam"], pl: "dżem", emoji: "🍓" },
      { answer: "moon", options: ["moon", "noon", "spoon"], pl: "księżyc", emoji: "🌙" },
    ],
    redWords: ["the", "I"],
  },
  "a": {
    soundId: "a",
    heroId: "buzz",
    chant: "a — a — apple!",
    parentIntro:
      "Najtrudniejsza z tych liter dla polskiego ucha. Angielskie „a” w „cat” to NIE polskie „a”: opuść żuchwę niżej niż przy polskim „a”, buzia otwiera się szerzej, a język idzie do przodu. Ćwiczcie parami: polskie „kat”, potem angielskie „cat” — ma zabrzmieć niżej i szerzej. Uwaga: w „car”, „cake” i „water” ta sama litera brzmi zupełnie inaczej, dlatego w ćwiczeniu te słowa są odpowiedzią „nie słychać”.",
    listen: [
      { word: "cat", hasTarget: true, pl: "kot", emoji: "🐱" },
      { word: "car", hasTarget: false, pl: "samochód", emoji: "🚗" },
      { word: "apple", hasTarget: true, pl: "jabłko", emoji: "🍎" },
      { word: "water", hasTarget: false, pl: "woda", emoji: "💧" },
      { word: "hand", hasTarget: true, pl: "ręka", emoji: "✋" },
      { word: "cake", hasTarget: false, pl: "ciasto", emoji: "🍰" },
      { word: "flag", hasTarget: true, pl: "flaga", emoji: "🚩" },
      { word: "moon", hasTarget: false, pl: "księżyc", emoji: "🌙" },
    ],
    blend: [
      { word: "cat", graphemes: ["c", "a", "t"], targetIndex: 1, pl: "kot", emoji: "🐱" },
      { word: "hat", graphemes: ["h", "a", "t"], targetIndex: 1, pl: "kapelusz", emoji: "🎩" },
      { word: "bat", graphemes: ["b", "a", "t"], targetIndex: 1, pl: "nietoperz", emoji: "🦇" },
      { word: "man", graphemes: ["m", "a", "n"], targetIndex: 1, pl: "mężczyzna", emoji: "👨" },
      { word: "van", graphemes: ["v", "a", "n"], targetIndex: 1, pl: "furgonetka", emoji: "🚐" },
    ],
    choice: [
      { answer: "cat", options: ["cat", "cot", "cut"], pl: "kot", emoji: "🐱" },
      { answer: "hat", options: ["hot", "hat", "hut"], pl: "kapelusz", emoji: "🎩" },
      { answer: "bag", options: ["big", "bug", "bag"], pl: "plecak", emoji: "🎒" },
      { answer: "map", options: ["map", "mop", "mug"], pl: "mapa", emoji: "🗺️" },
    ],
    redWords: ["said", "was"],
  },
  "s": {
    soundId: "s",
    heroId: "buzz",
    chant: "s — s — sss!",
    parentIntro:
      "Angielskie „s” jest praktycznie takie samo jak polskie — to szybkie sprawdzenie. Dwie uwagi: to nigdy nie jest „sz” (słowo „shop” ma inny dźwięk), a na końcu wielu słów litera „s” brzmi jak „z” („nose”, „dogs”). W drugą stronę też bywa myląco: dźwięk „s” czasem zapisuje się literą „c” — „pencil”, „city”. Liczy się to, co SŁYCHAĆ, nie to, co widać.",
    listen: [
      { word: "sun", hasTarget: true, pl: "słońce", emoji: "☀️" },
      { word: "nose", hasTarget: false, pl: "nos", emoji: "👃" },
      { word: "pencil", hasTarget: true, pl: "ołówek", emoji: "✏️" },
      { word: "shop", hasTarget: false, pl: "sklep", emoji: "🏪" },
      { word: "sock", hasTarget: true, pl: "skarpetka", emoji: "🧦" },
      { word: "letter", hasTarget: false, pl: "list", emoji: "✉️" },
      { word: "bus", hasTarget: true, pl: "autobus", emoji: "🚌" },
      { word: "moon", hasTarget: false, pl: "księżyc", emoji: "🌙" },
    ],
    blend: [
      { word: "sun", graphemes: ["s", "u", "n"], targetIndex: 0, pl: "słońce", emoji: "☀️" },
      { word: "sock", graphemes: ["s", "o", "ck"], targetIndex: 0, pl: "skarpetka", emoji: "🧦" },
      { word: "sad", graphemes: ["s", "a", "d"], targetIndex: 0, pl: "smutny", emoji: "😢" },
      { word: "bus", graphemes: ["b", "u", "s"], targetIndex: 2, pl: "autobus", emoji: "🚌" },
      { word: "yes", graphemes: ["y", "e", "s"], targetIndex: 2, pl: "tak", emoji: "✅" },
    ],
    choice: [
      { answer: "sun", options: ["fun", "sun", "bun"], pl: "słońce", emoji: "☀️" },
      { answer: "sock", options: ["sock", "rock", "lock"], pl: "skarpetka", emoji: "🧦" },
      { answer: "bus", options: ["bun", "bug", "bus"], pl: "autobus", emoji: "🚌" },
      { answer: "sad", options: ["mad", "sad", "bad"], pl: "smutny", emoji: "😢" },
    ],
    redWords: ["he", "she"],
  },
  "d": {
    soundId: "d",
    heroId: "buzz",
    chant: "d — d — d! dog!",
    parentIntro:
      "Angielskie „d” jest bardzo blisko polskiego — to głównie szybkie sprawdzenie. Język dotyka wałka za zębami, nie samych zębów. Nigdy nie mów „dy” ani „de” — to ma być sam krótki wybuch. Różnicę „bed” i „bet” słychać głównie w samogłosce: w „bed” jest ona zauważalnie dłuższa, w „bet” ucięta na krótko.",
    listen: [
      { word: "dog", hasTarget: true, pl: "pies", emoji: "🐶" },
      { word: "cat", hasTarget: false, pl: "kot", emoji: "🐱" },
      { word: "garden", hasTarget: true, pl: "ogród", emoji: "🌳" },
      { word: "rabbit", hasTarget: false, pl: "królik", emoji: "🐰" },
      { word: "bed", hasTarget: true, pl: "łóżko", emoji: "🛏️" },
      { word: "walked", hasTarget: false, pl: "szedł", emoji: "🚶" },
      { word: "duck", hasTarget: true, pl: "kaczka", emoji: "🦆" },
      { word: "fish", hasTarget: false, pl: "ryba", emoji: "🐟" },
    ],
    blend: [
      { word: "dog", graphemes: ["d", "o", "g"], targetIndex: 0, pl: "pies", emoji: "🐶" },
      { word: "dad", graphemes: ["d", "a", "d"], targetIndex: 0, pl: "tata", emoji: "🧔" },
      { word: "bed", graphemes: ["b", "e", "d"], targetIndex: 2, pl: "łóżko", emoji: "🛏️" },
      { word: "duck", graphemes: ["d", "u", "ck"], targetIndex: 0, pl: "kaczka", emoji: "🦆" },
      { word: "red", graphemes: ["r", "e", "d"], targetIndex: 2, pl: "czerwony", emoji: "🔴" },
    ],
    choice: [
      { answer: "dog", options: ["dog", "log", "fog"], pl: "pies", emoji: "🐶" },
      { answer: "bed", options: ["bet", "bed", "bell"], pl: "łóżko", emoji: "🛏️" },
      { answer: "duck", options: ["luck", "lock", "duck"], pl: "kaczka", emoji: "🦆" },
      { answer: "dad", options: ["bad", "dad", "sad"], pl: "tata", emoji: "🧔" },
    ],
    redWords: ["you", "me"],
  },
  "t": {
    soundId: "t",
    heroId: "buzz",
    chant: "t — t — t! tick-tock!",
    parentIntro:
      "Angielskie „t” na początku słowa ma wyraźny podmuch powietrza — mocniej niż polskie. Sprawdźcie kartką przy ustach: przy „ten” ma drgnąć. Nigdy nie mów „ty” ani „te” — sam wybuch, bez samogłoski. Pamiętaj, że „th” to zupełnie inny dźwięk, a w „listen” i „castle” litera „t” w ogóle nie brzmi.",
    listen: [
      { word: "cat", hasTarget: true, pl: "kot", emoji: "🐱" },
      { word: "listen", hasTarget: false, pl: "słuchać", emoji: "👂" },
      { word: "letter", hasTarget: true, pl: "list", emoji: "✉️" },
      { word: "moon", hasTarget: false, pl: "księżyc", emoji: "🌙" },
      { word: "tent", hasTarget: true, pl: "namiot", emoji: "⛺" },
      { word: "castle", hasTarget: false, pl: "zamek", emoji: "🏰" },
      { word: "boot", hasTarget: true, pl: "but", emoji: "👢" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
    ],
    blend: [
      { word: "ten", graphemes: ["t", "e", "n"], targetIndex: 0, pl: "dziesięć", emoji: "🔟" },
      { word: "tap", graphemes: ["t", "a", "p"], targetIndex: 0, pl: "kran", emoji: "🚰" },
      { word: "cat", graphemes: ["c", "a", "t"], targetIndex: 2, pl: "kot", emoji: "🐱" },
      { word: "hat", graphemes: ["h", "a", "t"], targetIndex: 2, pl: "kapelusz", emoji: "🎩" },
      { word: "pot", graphemes: ["p", "o", "t"], targetIndex: 2, pl: "garnek", emoji: "🍲" },
    ],
    choice: [
      { answer: "cat", options: ["cap", "cat", "can"], pl: "kot", emoji: "🐱" },
      { answer: "ten", options: ["ten", "hen", "pen"], pl: "dziesięć", emoji: "🔟" },
      { answer: "tap", options: ["map", "cap", "tap"], pl: "kran", emoji: "🚰" },
      { answer: "pot", options: ["pop", "pot", "pan"], pl: "garnek", emoji: "🍲" },
    ],
    redWords: ["to", "of"],
  },
  "i": {
    soundId: "i",
    heroId: "buzz",
    chant: "i — i — icky sticky!",
    parentIntro:
      "Uwaga, to pulapka. Angielskie krotkie \"i\" w slowie \"pig\" NIE jest polskim \"i\" — jest luzniejsze, krotsze i brzmi gdzies pomiedzy polskim \"i\" a \"y\", z rozluznionymi wargami i jezykiem. Jesli dziecko powie napiete polskie \"i\", zamiast \"ship\" (statek) wyjdzie \"sheep\" (owca), a zamiast \"chip\" — \"cheap\".",
    listen: [
      { word: "pig", hasTarget: true, pl: "swinka", emoji: "🐷" },
      { word: "night", hasTarget: false, pl: "noc", emoji: "🌙" },
      { word: "milk", hasTarget: true, pl: "mleko", emoji: "🥛" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
      { word: "chicken", hasTarget: true, pl: "kurczak", emoji: "🐔" },
      { word: "yellow", hasTarget: false, pl: "zolty", emoji: "💛" },
      { word: "fish", hasTarget: true, pl: "ryba", emoji: "🐟" },
      { word: "moon", hasTarget: false, pl: "ksiezyc", emoji: "🌕" },
    ],
    blend: [
      { word: "pig", graphemes: ["p", "i", "g"], targetIndex: 1, pl: "swinka", emoji: "🐷" },
      { word: "kid", graphemes: ["k", "i", "d"], targetIndex: 1, pl: "dzieciak", emoji: "🧒" },
      { word: "bin", graphemes: ["b", "i", "n"], targetIndex: 1, pl: "kosz na śmieci", emoji: "🗑️" },
      { word: "fish", graphemes: ["f", "i", "sh"], targetIndex: 1, pl: "ryba", emoji: "🐟" },
      { word: "ship", graphemes: ["sh", "i", "p"], targetIndex: 1, pl: "statek", emoji: "🚢" },
    ],
    choice: [
      { answer: "pig", options: ["peg", "pig", "pug"], pl: "swinka", emoji: "🐷" },
      { answer: "ship", options: ["ship", "shop", "sheep"], pl: "statek", emoji: "🚢" },
      { answer: "pin", options: ["pen", "pan", "pin"], pl: "pinezka", emoji: "📌" },
      { answer: "chip", options: ["chop", "chip", "cheap"], pl: "frytka", emoji: "🍟" },
    ],
    redWords: ["I", "the"],
  },
  "n": {
    soundId: "n",
    heroId: "buzz",
    chant: "n — n — nnn! nnnose!",
    parentIntro:
      "Tu jest latwo: angielskie \"n\" brzmi praktycznie tak samo jak polskie \"n\". To szybkie sprawdzenie. Pilnuj tylko jednego — dziecko ma mowic sam dzwiek \"nnn\", a nie nazwe litery (\"en\" po polsku ani \"en\" po angielsku).",
    listen: [
      { word: "nose", hasTarget: true, pl: "nos", emoji: "👃" },
      { word: "cat", hasTarget: false, pl: "kot", emoji: "🐱" },
      { word: "lemon", hasTarget: true, pl: "cytryna", emoji: "🍋" },
      { word: "flower", hasTarget: false, pl: "kwiat", emoji: "🌸" },
      { word: "moon", hasTarget: true, pl: "ksiezyc", emoji: "🌕" },
      { word: "cup", hasTarget: false, pl: "kubek", emoji: "🥤" },
      { word: "hen", hasTarget: true, pl: "kura", emoji: "🐔" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
    ],
    blend: [
      { word: "net", graphemes: ["n", "e", "t"], targetIndex: 0, pl: "siatka", emoji: "🥅" },
      { word: "hen", graphemes: ["h", "e", "n"], targetIndex: 2, pl: "kura", emoji: "🐔" },
      { word: "sun", graphemes: ["s", "u", "n"], targetIndex: 2, pl: "slonce", emoji: "☀️" },
      { word: "man", graphemes: ["m", "a", "n"], targetIndex: 2, pl: "mezczyzna", emoji: "👨" },
      { word: "van", graphemes: ["v", "a", "n"], targetIndex: 2, pl: "furgonetka", emoji: "🚐" },
    ],
    choice: [
      { answer: "net", options: ["wet", "net", "vet"], pl: "siatka", emoji: "🥅" },
      { answer: "sun", options: ["sun", "sum", "sub"], pl: "slonce", emoji: "☀️" },
      { answer: "man", options: ["map", "mat", "man"], pl: "mezczyzna", emoji: "👨" },
      { answer: "nose", options: ["rose", "nose", "hose"], pl: "nos", emoji: "👃" },
    ],
    redWords: ["no", "go"],
  },
  "p": {
    soundId: "p",
    heroId: "buzz",
    chant: "p — p — p! p! pop!",
    parentIntro:
      "Na początku wyrazu („pen”, „pot”, „pig”) po angielskim „p” leci mały podmuch powietrza — jakby ciche „h” zaraz po nim. Na końcu wyrazu („cup”, „tap”, „map”) podmuchu nie ma. Sprawdźcie kartką przy ustach. Nigdy nie mów „py” ani „pe” — sam wybuch.",
    listen: [
      { word: "pen", hasTarget: true, pl: "dlugopis", emoji: "🖊️" },
      { word: "elephant", hasTarget: false, pl: "slon", emoji: "🐘" },
      { word: "apple", hasTarget: true, pl: "jablko", emoji: "🍎" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
      { word: "cup", hasTarget: true, pl: "kubek do picia", emoji: "🥤" },
      { word: "fish", hasTarget: false, pl: "ryba", emoji: "🐟" },
      { word: "pig", hasTarget: true, pl: "swinka", emoji: "🐷" },
      { word: "moon", hasTarget: false, pl: "ksiezyc", emoji: "🌕" },
    ],
    blend: [
      { word: "pen", graphemes: ["p", "e", "n"], targetIndex: 0, pl: "dlugopis", emoji: "🖊️" },
      { word: "pot", graphemes: ["p", "o", "t"], targetIndex: 0, pl: "garnek", emoji: "🍲" },
      { word: "cup", graphemes: ["c", "u", "p"], targetIndex: 2, pl: "kubek do picia", emoji: "🥤" },
      { word: "tap", graphemes: ["t", "a", "p"], targetIndex: 2, pl: "kran", emoji: "🚰" },
      { word: "map", graphemes: ["m", "a", "p"], targetIndex: 2, pl: "mapa", emoji: "🗺️" },
    ],
    choice: [
      { answer: "pen", options: ["hen", "ten", "pen"], pl: "dlugopis", emoji: "🖊️" },
      { answer: "cup", options: ["cup", "cut", "cub"], pl: "kubek do picia", emoji: "🥤" },
      { answer: "pot", options: ["hot", "pot", "dot"], pl: "garnek", emoji: "🍲" },
      { answer: "map", options: ["mat", "mad", "map"], pl: "mapa", emoji: "🗺️" },
    ],
    redWords: ["to", "you"],
  },
  "g": {
    soundId: "g",
    heroId: "buzz",
    chant: "g — g — g! glug-glug!",
    parentIntro:
      "Angielskie twarde \"g\" brzmi tak samo jak polskie \"g\" w slowie \"gora\" — to szybkie sprawdzenie. Uwaga tylko na to, ze w niektorych angielskich slowach ta litera czyta sie inaczej (\"giraffe\" zaczyna sie jak polskie \"dz\"); tych slow na razie nie cwiczymy.",
    listen: [
      { word: "dog", hasTarget: true, pl: "pies", emoji: "🐶" },
      { word: "giraffe", hasTarget: false, pl: "zyrafa", emoji: "🦒" },
      { word: "tiger", hasTarget: true, pl: "tygrys", emoji: "🐯" },
      { word: "cat", hasTarget: false, pl: "kot", emoji: "🐱" },
      { word: "frog", hasTarget: true, pl: "zaba", emoji: "🐸" },
      { word: "sun", hasTarget: false, pl: "slonce", emoji: "☀️" },
      { word: "goat", hasTarget: true, pl: "koza", emoji: "🐐" },
      { word: "moon", hasTarget: false, pl: "ksiezyc", emoji: "🌕" },
    ],
    blend: [
      { word: "gift", graphemes: ["g", "i", "f", "t"], targetIndex: 0, pl: "prezent", emoji: "🎁" },
      { word: "dog", graphemes: ["d", "o", "g"], targetIndex: 2, pl: "pies", emoji: "🐶" },
      { word: "leg", graphemes: ["l", "e", "g"], targetIndex: 2, pl: "noga", emoji: "🦵" },
      { word: "mug", graphemes: ["m", "u", "g"], targetIndex: 2, pl: "kubek do kawy", emoji: "☕" },
      { word: "frog", graphemes: ["f", "r", "o", "g"], targetIndex: 3, pl: "zaba", emoji: "🐸" },
    ],
    choice: [
      { answer: "dog", options: ["doll", "dog", "dot"], pl: "pies", emoji: "🐶" },
      { answer: "bag", options: ["bat", "back", "bag"], pl: "plecak", emoji: "🎒" },
      { answer: "mug", options: ["mug", "mud", "mum"], pl: "kubek do kawy", emoji: "☕" },
      { answer: "goat", options: ["coat", "boat", "goat"], pl: "koza", emoji: "🐐" },
    ],
    redWords: ["said", "he"],
  },
  "o": {
    soundId: "o",
    heroId: "buzz",
    chant: "o — o — o! hop, hop!",
    parentIntro:
      "Angielskie „o” w „dog” jest krótsze i bardziej otwarte niż polskie. Buzia otwiera się szerzej, szczęka opada niżej, a wargi są tylko leciutko zaokrąglone — nie wypychaj ich do przodu. Uwaga: w „go”, „no” i „home” ta sama litera brzmi zupełnie inaczej.",
    listen: [
      { word: "dog", hasTarget: true, pl: "pies", emoji: "🐶" },
      { word: "boat", hasTarget: false, pl: "lodka", emoji: "⛵" },
      { word: "sock", hasTarget: true, pl: "skarpetka", emoji: "🧦" },
      { word: "rainbow", hasTarget: false, pl: "tecza", emoji: "🌈" },
      { word: "orange", hasTarget: true, pl: "pomarancza", emoji: "🍊" },
      { word: "book", hasTarget: false, pl: "ksiazka", emoji: "📖" },
      { word: "clock", hasTarget: true, pl: "zegar", emoji: "🕐" },
      { word: "cat", hasTarget: false, pl: "kot", emoji: "🐱" },
    ],
    blend: [
      { word: "dog", graphemes: ["d", "o", "g"], targetIndex: 1, pl: "pies", emoji: "🐶" },
      { word: "pot", graphemes: ["p", "o", "t"], targetIndex: 1, pl: "garnek", emoji: "🍲" },
      { word: "hot", graphemes: ["h", "o", "t"], targetIndex: 1, pl: "goracy", emoji: "🔥" },
      { word: "sock", graphemes: ["s", "o", "ck"], targetIndex: 1, pl: "skarpetka", emoji: "🧦" },
      { word: "shop", graphemes: ["sh", "o", "p"], targetIndex: 1, pl: "sklep", emoji: "🏪" },
    ],
    choice: [
      { answer: "sock", options: ["sack", "sock", "sick"], pl: "skarpetka", emoji: "🧦" },
      { answer: "hot", options: ["hat", "hot", "hit"], pl: "gorący", emoji: "🔥" },
      { answer: "fox", options: ["fix", "fax", "fox"], pl: "lis", emoji: "🦊" },
      { answer: "pot", options: ["pot", "pet", "pit"], pl: "garnek", emoji: "🍲" },
    ],
    redWords: ["of", "was"],
  },
  "c": {
    soundId: "c",
    heroId: "buzz",
    chant: "c — c — k! k! cat!",
    parentIntro:
      "Pułapka: polskie „c” czytamy jak „ts” (cebula), a angielskie „c” w „cat” brzmi dokładnie jak polskie „k”. Jeśli dziecko powie „tsat”, zatrzymaj je i powiedzcie razem „kat”. Wyjątek do zapamiętania: przed „e”, „i” oraz „y” angielskie „c” brzmi jak „s” — „city” czytamy „siti”. To słowo pojawi się w ćwiczeniu jako odpowiedź „nie słychać”.",
    listen: [
      { word: "cat", hasTarget: true, pl: "kot", emoji: "🐱" },
      { word: "fish", hasTarget: false, pl: "ryba", emoji: "🐟" },
      { word: "cup", hasTarget: true, pl: "kubek", emoji: "☕" },
      { word: "city", hasTarget: false, pl: "miasto", emoji: "🏙️" },
      { word: "clock", hasTarget: true, pl: "zegar", emoji: "🕐" },
      { word: "sun", hasTarget: false, pl: "słońce", emoji: "☀️" },
      { word: "car", hasTarget: true, pl: "samochód", emoji: "🚗" },
      { word: "pen", hasTarget: false, pl: "długopis", emoji: "🖊️" },
    ],
    blend: [
      { word: "cat", graphemes: ["c", "a", "t"], targetIndex: 0, pl: "kot", emoji: "🐱" },
      { word: "cot", graphemes: ["c", "o", "t"], targetIndex: 0, pl: "łóżeczko", emoji: "🛏️" },
      { word: "cap", graphemes: ["c", "a", "p"], targetIndex: 0, pl: "czapka", emoji: "🧢" },
      { word: "can", graphemes: ["c", "a", "n"], targetIndex: 0, pl: "puszka", emoji: "🥫" },
      { word: "cab", graphemes: ["c", "a", "b"], targetIndex: 0, pl: "taksówka", emoji: "🚕" },
    ],
    choice: [
      { answer: "cat", options: ["cat", "cap", "can"], pl: "kot", emoji: "🐱" },
      { answer: "can", options: ["can", "man", "pan"], pl: "puszka", emoji: "🥫" },
      { answer: "clock", options: ["clock", "block", "black"], pl: "zegar", emoji: "🕐" },
      { answer: "cake", options: ["cake", "lake", "take"], pl: "ciasto", emoji: "🎂" },
    ],
    redWords: ["the", "I"],
  },
  "k": {
    soundId: "k",
    heroId: "buzz",
    chant: "k — k — k! kick, kick, kick!",
    parentIntro:
      "To akurat łatwe: angielskie „k\" brzmi tak samo jak polskie „k\" — i tak samo jak „c\" w „cat\". Powiedz dziecku wprost, że dwie różne litery grają tu tę samą głoskę, więc to tylko szybkie sprawdzenie. Jedyna niespodzianka to nieme „k\" w „knife\" — tam w ogóle go nie słychać.",
    listen: [
      { word: "king", hasTarget: true, pl: "król", emoji: "👑" },
      { word: "knife", hasTarget: false, pl: "nóż", emoji: "🔪" },
      { word: "key", hasTarget: true, pl: "klucz", emoji: "🔑" },
      { word: "sun", hasTarget: false, pl: "słońce", emoji: "☀️" },
      { word: "sock", hasTarget: true, pl: "skarpetka", emoji: "🧦" },
      { word: "tree", hasTarget: false, pl: "drzewo", emoji: "🌳" },
      { word: "milk", hasTarget: true, pl: "mleko", emoji: "🥛" },
      { word: "fish", hasTarget: false, pl: "ryba", emoji: "🐟" },
    ],
    blend: [
      { word: "kid", graphemes: ["k", "i", "d"], targetIndex: 0, pl: "dzieciak", emoji: "🧒" },
      { word: "kick", graphemes: ["k", "i", "ck"], targetIndex: 0, pl: "kopać", emoji: "⚽" },
      { word: "king", graphemes: ["k", "i", "ng"], targetIndex: 0, pl: "król", emoji: "👑" },
      { word: "kiss", graphemes: ["k", "i", "ss"], targetIndex: 0, pl: "całus", emoji: "💋" },
      { word: "kit", graphemes: ["k", "i", "t"], targetIndex: 0, pl: "zestaw", emoji: "🧰" },
    ],
    choice: [
      { answer: "king", options: ["king", "ring", "wing"], pl: "król", emoji: "👑" },
      { answer: "kid", options: ["kid", "lid", "kit"], pl: "dzieciak", emoji: "🧒" },
      { answer: "kiss", options: ["kiss", "miss", "kick"], pl: "całus", emoji: "💋" },
      { answer: "milk", options: ["milk", "mill", "silk"], pl: "mleko", emoji: "🥛" },
    ],
    redWords: ["to", "said"],
  },
  "u": {
    soundId: "u",
    heroId: "buzz",
    chant: "u — u — a! up, up, up!",
    parentIntro:
      "Pułapka: angielskie „u” w „up” i „sun” to NIE polskie „u” — to krótkie, otwarte „a”. Powiedzcie razem „ap”, „san”, „kap” — tak brzmią „up”, „sun”, „cup”. Jeśli dziecko powie „up” przez polskie „u”, popraw od razu. W ćwiczeniu usłyszysz też „blue” — tam litery „ue” razem dają długie „u”, więc to odpowiedź „nie słychać”.",
    listen: [
      { word: "cup", hasTarget: true, pl: "kubek", emoji: "☕" },
      { word: "cat", hasTarget: false, pl: "kot", emoji: "🐱" },
      { word: "bus", hasTarget: true, pl: "autobus", emoji: "🚌" },
      { word: "blue", hasTarget: false, pl: "niebieski", emoji: "🔵" },
      { word: "duck", hasTarget: true, pl: "kaczka", emoji: "🦆" },
      { word: "moon", hasTarget: false, pl: "księżyc", emoji: "🌙" },
      { word: "sun", hasTarget: true, pl: "słońce", emoji: "☀️" },
      { word: "pen", hasTarget: false, pl: "długopis", emoji: "🖊️" },
    ],
    blend: [
      { word: "cup", graphemes: ["c", "u", "p"], targetIndex: 1, pl: "kubek", emoji: "☕" },
      { word: "bus", graphemes: ["b", "u", "s"], targetIndex: 1, pl: "autobus", emoji: "🚌" },
      { word: "sun", graphemes: ["s", "u", "n"], targetIndex: 1, pl: "słońce", emoji: "☀️" },
      { word: "duck", graphemes: ["d", "u", "ck"], targetIndex: 1, pl: "kaczka", emoji: "🦆" },
      { word: "nut", graphemes: ["n", "u", "t"], targetIndex: 1, pl: "orzech", emoji: "🥜" },
    ],
    choice: [
      { answer: "cup", options: ["cup", "cap", "cat"], pl: "kubek", emoji: "☕" },
      { answer: "bus", options: ["bus", "bed", "box"], pl: "autobus", emoji: "🚌" },
      { answer: "duck", options: ["duck", "dock", "deck"], pl: "kaczka", emoji: "🦆" },
      { answer: "nut", options: ["nut", "net", "nap"], pl: "orzech", emoji: "🥜" },
    ],
    redWords: ["you", "was"],
  },
  "b": {
    soundId: "b",
    heroId: "buzz",
    chant: "b — b — b! ball, bat, bus!",
    parentIntro:
      "Dźwięk jest ten sam co polskie „b\", więc to szybkie sprawdzenie. Jedno warto pilnować: w polskim „b\" na końcu wyrazu robi się „p\" („chleb\" mówimy „chlep\"), a po angielsku musi zostać dźwięczne — „web\", „cub\". Czasem „b\" jest zupełnie nieme, jak w „thumb\".",
    listen: [
      { word: "bed", hasTarget: true, pl: "łóżko", emoji: "🛏️" },
      { word: "thumb", hasTarget: false, pl: "kciuk", emoji: "👍" },
      { word: "book", hasTarget: true, pl: "książka", emoji: "📖" },
      { word: "pen", hasTarget: false, pl: "długopis", emoji: "🖊️" },
      { word: "bus", hasTarget: true, pl: "autobus", emoji: "🚌" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
      { word: "web", hasTarget: true, pl: "pajęczyna", emoji: "🕸️" },
      { word: "sun", hasTarget: false, pl: "słońce", emoji: "☀️" },
    ],
    blend: [
      { word: "bed", graphemes: ["b", "e", "d"], targetIndex: 0, pl: "łóżko", emoji: "🛏️" },
      { word: "bus", graphemes: ["b", "u", "s"], targetIndex: 0, pl: "autobus", emoji: "🚌" },
      { word: "bat", graphemes: ["b", "a", "t"], targetIndex: 0, pl: "nietoperz", emoji: "🦇" },
      { word: "box", graphemes: ["b", "o", "x"], targetIndex: 0, pl: "pudełko", emoji: "📦" },
      { word: "web", graphemes: ["w", "e", "b"], targetIndex: 2, pl: "pajęczyna", emoji: "🕸️" },
    ],
    choice: [
      { answer: "bed", options: ["bed", "red", "bad"], pl: "łóżko", emoji: "🛏️" },
      { answer: "box", options: ["box", "fox", "fix"], pl: "pudełko", emoji: "📦" },
      { answer: "bat", options: ["bat", "cat", "hat"], pl: "nietoperz", emoji: "🦇" },
      { answer: "web", options: ["web", "wet", "net"], pl: "pajęczyna", emoji: "🕸️" },
    ],
    redWords: ["we", "me"],
  },
  "f": {
    soundId: "f",
    heroId: "buzz",
    chant: "f — f — ffff! fish!",
    parentIntro:
      "Angielskie „f\" brzmi dokładnie jak polskie „f\" — szybkie sprawdzenie, bez pułapki w wymowie. Warto tylko wiedzieć, że ten sam dźwięk bywa zapisany przez „ph\" („phone\" czytamy „foun\"), a w słówku „of\" litera „f\" brzmi jak polskie „w\". Pilnuj też, żeby „f\" nie zamieniło się w „w\" — „fan\" to nie „van\".",
    listen: [
      { word: "fox", hasTarget: true, pl: "lis", emoji: "🦊" },
      { word: "van", hasTarget: false, pl: "furgonetka", emoji: "🚐" },
      { word: "leaf", hasTarget: true, pl: "liść", emoji: "🍃" },
      { word: "sun", hasTarget: false, pl: "słońce", emoji: "☀️" },
      { word: "fish", hasTarget: true, pl: "ryba", emoji: "🐟" },
      { word: "clock", hasTarget: false, pl: "zegar", emoji: "🕐" },
      { word: "phone", hasTarget: true, pl: "telefon", emoji: "☎️" },
      { word: "tree", hasTarget: false, pl: "drzewo", emoji: "🌳" },
    ],
    blend: [
      { word: "fish", graphemes: ["f", "i", "sh"], targetIndex: 0, pl: "ryba", emoji: "🐟" },
      { word: "fox", graphemes: ["f", "o", "x"], targetIndex: 0, pl: "lis", emoji: "🦊" },
      { word: "frog", graphemes: ["f", "r", "o", "g"], targetIndex: 0, pl: "żaba", emoji: "🐸" },
      { word: "fun", graphemes: ["f", "u", "n"], targetIndex: 0, pl: "zabawa", emoji: "🎉" },
      { word: "leaf", graphemes: ["l", "ea", "f"], targetIndex: 2, pl: "liść", emoji: "🍃" },
    ],
    choice: [
      { answer: "fish", options: ["fish", "dish", "wish"], pl: "ryba", emoji: "🐟" },
      { answer: "frog", options: ["frog", "fog", "dog"], pl: "żaba", emoji: "🐸" },
      { answer: "fun", options: ["fun", "sun", "fin"], pl: "zabawa", emoji: "🎉" },
      { answer: "food", options: ["food", "foot", "good"], pl: "jedzenie", emoji: "🍕" },
    ],
    redWords: ["of", "he"],
  },
  "e": {
    soundId: "e",
    heroId: "buzz",
    chant: "e — e — egg!",
    parentIntro:
      "Angielskie „e” w „hen”, „bed” i „pen” to praktycznie polskie „e” z „ten” — krótkie i sprężyste. Nie przymykaj ust: gdy dźwięk się zwęzi, „bed” zaczyna brzmieć jak „bid”. To jedna z łatwiejszych liter, więc powinno pójść szybko.",
    listen: [
      { word: "hen", hasTarget: true, pl: "kura", emoji: "🐔" },
      { word: "tree", hasTarget: false, pl: "drzewo", emoji: "🌳" },
      { word: "bed", hasTarget: true, pl: "łóżko", emoji: "🛏️" },
      { word: "cake", hasTarget: false, pl: "ciasto", emoji: "🎂" },
      { word: "pen", hasTarget: true, pl: "długopis", emoji: "🖊️" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
      { word: "letter", hasTarget: true, pl: "list", emoji: "✉️" },
      { word: "summer", hasTarget: false, pl: "lato", emoji: "☀️" },
    ],
    blend: [
      { word: "pen", graphemes: ["p", "e", "n"], targetIndex: 1, pl: "długopis", emoji: "🖊️" },
      { word: "bed", graphemes: ["b", "e", "d"], targetIndex: 1, pl: "łóżko", emoji: "🛏️" },
      { word: "hen", graphemes: ["h", "e", "n"], targetIndex: 1, pl: "kura", emoji: "🐔" },
      { word: "net", graphemes: ["n", "e", "t"], targetIndex: 1, pl: "siatka", emoji: "🥅" },
      { word: "web", graphemes: ["w", "e", "b"], targetIndex: 1, pl: "pajęczyna", emoji: "🕸️" },
    ],
    choice: [
      { answer: "pen", options: ["pen", "pan", "pin"], pl: "długopis", emoji: "🖊️" },
      { answer: "bed", options: ["bed", "bad", "bud"], pl: "łóżko", emoji: "🛏️" },
      { answer: "net", options: ["net", "nut", "not"], pl: "siatka", emoji: "🥅" },
      { answer: "ten", options: ["ten", "tin", "tan"], pl: "dziesięć", emoji: "🔟" },
    ],
    redWords: ["the", "he"],
  },
  "l": {
    soundId: "l",
    heroId: "buzz",
    chant: "l — l — lll!",
    parentIntro:
      "To szybkie sprawdzenie — polskie L i angielskie /l/ brzmią prawie tak samo, więc dziecko poradzi sobie od razu. Jedyny drobiazg: na końcu sylaby (doll, milk) Anglicy mówią L „ciemniej”, z cofniętym językiem — nie poprawiaj tego na siłę. Warto za to pokazać, że w walk i talk litera L jest niema.",
    listen: [
      { word: "lamp", hasTarget: true, pl: "lampa", emoji: "💡" },
      { word: "walk", hasTarget: false, pl: "iść, spacerować", emoji: "🚶" },
      { word: "milk", hasTarget: true, pl: "mleko", emoji: "🥛" },
      { word: "sun", hasTarget: false, pl: "słońce", emoji: "☀️" },
      { word: "clock", hasTarget: true, pl: "zegar", emoji: "⏰" },
      { word: "talk", hasTarget: false, pl: "rozmawiać", emoji: "💬" },
      { word: "yellow", hasTarget: true, pl: "żółty", emoji: "💛" },
      { word: "water", hasTarget: false, pl: "woda", emoji: "💧" },
    ],
    blend: [
      { word: "leg", graphemes: ["l", "e", "g"], targetIndex: 0, pl: "noga", emoji: "🦵" },
      { word: "lamp", graphemes: ["l", "a", "m", "p"], targetIndex: 0, pl: "lampa", emoji: "💡" },
      { word: "lip", graphemes: ["l", "i", "p"], targetIndex: 0, pl: "warga", emoji: "👄" },
      { word: "bell", graphemes: ["b", "e", "ll"], targetIndex: 2, pl: "dzwonek", emoji: "🔔" },
      { word: "milk", graphemes: ["m", "i", "l", "k"], targetIndex: 2, pl: "mleko", emoji: "🥛" },
    ],
    choice: [
      { answer: "lamp", options: ["lamp", "ramp", "lump"], pl: "lampa", emoji: "💡" },
      { answer: "lock", options: ["lock", "rock", "sock"], pl: "zamek, kłódka", emoji: "🔒" },
      { answer: "lip", options: ["lip", "rip", "lap"], pl: "warga", emoji: "👄" },
      { answer: "bell", options: ["bell", "ball", "bull"], pl: "dzwonek", emoji: "🔔" },
    ],
    redWords: ["I", "my"],
  },
  "h": {
    soundId: "h",
    heroId: "buzz",
    chant: "h — h — hat!",
    parentIntro:
      "Uwaga, pułapka: polskie CH (jak w „chleb”) jest chrapliwe, słychać tarcie w gardle. Angielskie /h/ to samo tchnienie — jak chuchanie na zmarznięte ręce, bez żadnego zgrzytu. Powiedz „hat” z delikatnym dmuchnięciem; jeśli słychać polskie CH, to znaczy, że za mocno.",
    listen: [
      { word: "hat", hasTarget: true, pl: "kapelusz", emoji: "🎩" },
      { word: "fish", hasTarget: false, pl: "ryba", emoji: "🐟" },
      { word: "horse", hasTarget: true, pl: "koń", emoji: "🐴" },
      { word: "cheese", hasTarget: false, pl: "ser", emoji: "🧀" },
      { word: "house", hasTarget: true, pl: "dom", emoji: "🏠" },
      { word: "bath", hasTarget: false, pl: "kąpiel", emoji: "🛁" },
      { word: "hello", hasTarget: true, pl: "cześć", emoji: "👋" },
      { word: "dinner", hasTarget: false, pl: "obiad", emoji: "🍽️" },
    ],
    blend: [
      { word: "hat", graphemes: ["h", "a", "t"], targetIndex: 0, pl: "kapelusz", emoji: "🎩" },
      { word: "hen", graphemes: ["h", "e", "n"], targetIndex: 0, pl: "kura", emoji: "🐔" },
      { word: "hop", graphemes: ["h", "o", "p"], targetIndex: 0, pl: "podskakiwać", emoji: "🦘" },
      { word: "hug", graphemes: ["h", "u", "g"], targetIndex: 0, pl: "przytulić", emoji: "🤗" },
      { word: "hot", graphemes: ["h", "o", "t"], targetIndex: 0, pl: "gorący", emoji: "🔥" },
    ],
    choice: [
      { answer: "hat", options: ["hat", "cat", "bat"], pl: "kapelusz", emoji: "🎩" },
      { answer: "hen", options: ["hen", "pen", "ten"], pl: "kura", emoji: "🐔" },
      { answer: "hop", options: ["hop", "top", "mop"], pl: "podskakiwać", emoji: "🦘" },
      { answer: "hug", options: ["hug", "mug", "bug"], pl: "przytulić", emoji: "🤗" },
    ],
    redWords: ["to", "no"],
  },
  "r": {
    soundId: "r",
    heroId: "buzz",
    chant: "r — r — red!",
    parentIntro:
      "Pułapka: angielskie „r” NIE drga. Polskie „r” uderza czubkiem języka o podniebienie — angielskie nie dotyka niczego, język unosi się wysoko i cofa. Sprawdź na uchu: jeśli słyszysz „łed” zamiast „red”, język leży za płasko — poproś, żeby czubek uniósł się wyżej, w stronę podniebienia, ale go nie dotykał.",
    listen: [
      { word: "red", hasTarget: true, pl: "czerwony", emoji: "🔴" },
      { word: "car", hasTarget: false, pl: "samochód", emoji: "🚗" },
      { word: "rain", hasTarget: true, pl: "deszcz", emoji: "🌧️" },
      { word: "milk", hasTarget: false, pl: "mleko", emoji: "🥛" },
      { word: "frog", hasTarget: true, pl: "żaba", emoji: "🐸" },
      { word: "star", hasTarget: false, pl: "gwiazda", emoji: "⭐" },
      { word: "rabbit", hasTarget: true, pl: "królik", emoji: "🐰" },
      { word: "dinner", hasTarget: false, pl: "obiad", emoji: "🍽️" },
    ],
    blend: [
      { word: "red", graphemes: ["r", "e", "d"], targetIndex: 0, pl: "czerwony", emoji: "🔴" },
      { word: "rat", graphemes: ["r", "a", "t"], targetIndex: 0, pl: "szczur", emoji: "🐀" },
      { word: "run", graphemes: ["r", "u", "n"], targetIndex: 0, pl: "biec", emoji: "🏃" },
      { word: "rain", graphemes: ["r", "ai", "n"], targetIndex: 0, pl: "deszcz", emoji: "🌧️" },
      { word: "ring", graphemes: ["r", "i", "ng"], targetIndex: 0, pl: "pierścionek", emoji: "💍" },
    ],
    choice: [
      { answer: "red", options: ["red", "bed", "rod"], pl: "czerwony", emoji: "🔴" },
      { answer: "rat", options: ["rat", "cat", "rot"], pl: "szczur", emoji: "🐀" },
      { answer: "run", options: ["run", "sun", "ran"], pl: "biec", emoji: "🏃" },
      { answer: "ring", options: ["ring", "king", "wing"], pl: "pierścionek", emoji: "💍" },
    ],
    redWords: ["go", "so"],
  },
  "j": {
    soundId: "j",
    heroId: "buzz",
    chant: "dż — dż — jam!",
    parentIntro:
      "Największa pułapka z całej piątki: polskie J (jak w „jest”) to zupełnie inny dźwięk niż angielskie J. Angielskie J brzmi jak polskie DŻ — „jam” to prawie „dżem”, „jet” to „dżet”. Polskiemu J odpowiada w angielskim litera Y (yes, yellow) — dlatego w ćwiczeniu „słuchaj” słowa yes i yellow są na NIE.",
    listen: [
      { word: "jam", hasTarget: true, pl: "dżem", emoji: "🍓" },
      { word: "yellow", hasTarget: false, pl: "żółty", emoji: "💛" },
      { word: "jump", hasTarget: true, pl: "skakać", emoji: "🤸" },
      { word: "milk", hasTarget: false, pl: "mleko", emoji: "🥛" },
      { word: "jet", hasTarget: true, pl: "odrzutowiec", emoji: "✈️" },
      { word: "yes", hasTarget: false, pl: "tak", emoji: "👍" },
      { word: "jug", hasTarget: true, pl: "dzbanek", emoji: "🏺" },
      { word: "tree", hasTarget: false, pl: "drzewo", emoji: "🌳" },
    ],
    blend: [
      { word: "jam", graphemes: ["j", "a", "m"], targetIndex: 0, pl: "dżem", emoji: "🍓" },
      { word: "jet", graphemes: ["j", "e", "t"], targetIndex: 0, pl: "odrzutowiec", emoji: "✈️" },
      { word: "jug", graphemes: ["j", "u", "g"], targetIndex: 0, pl: "dzbanek", emoji: "🏺" },
      { word: "jump", graphemes: ["j", "u", "m", "p"], targetIndex: 0, pl: "skakać", emoji: "🤸" },
      { word: "job", graphemes: ["j", "o", "b"], targetIndex: 0, pl: "praca", emoji: "💼" },
    ],
    choice: [
      { answer: "jam", options: ["jam", "ham", "yam"], pl: "dżem", emoji: "🍓" },
      { answer: "jet", options: ["jet", "net", "get"], pl: "odrzutowiec", emoji: "✈️" },
      { answer: "jug", options: ["jug", "bug", "hug"], pl: "dzbanek", emoji: "🏺" },
      { answer: "jump", options: ["jump", "bump", "lump"], pl: "skakać", emoji: "🤸" },
    ],
    redWords: ["she", "we"],
  },
  "v": {
    soundId: "v",
    heroId: "buzz",
    chant: "v — v — vvv!",
    parentIntro:
      "Litera v to dla polskiego ucha łatwizna: brzmi dokładnie jak polskie W, np. w słowie \"woda\". Cała trudność jest wzrokowa — dziecko widzi nieznany kształt i musi pamiętać, że czyta go jak polskie \"w\". To szybkie sprawdzenie: wystarczy kilka powtórzeń van, vet, vest.",
    listen: [
      { word: "van", hasTarget: true, pl: "furgonetka", emoji: "🚐" },
      { word: "fish", hasTarget: false, pl: "ryba", emoji: "🐟" },
      { word: "seven", hasTarget: true, pl: "siedem", emoji: "7️⃣" },
      { word: "rabbit", hasTarget: false, pl: "królik", emoji: "🐰" },
      { word: "five", hasTarget: true, pl: "pięć", emoji: "5️⃣" },
      { word: "bus", hasTarget: false, pl: "autobus", emoji: "🚌" },
      { word: "river", hasTarget: true, pl: "rzeka", emoji: "🌊" },
      { word: "summer", hasTarget: false, pl: "lato", emoji: "☀️" },
    ],
    blend: [
      { word: "van", graphemes: ["v", "a", "n"], targetIndex: 0, pl: "furgonetka", emoji: "🚐" },
      { word: "vet", graphemes: ["v", "e", "t"], targetIndex: 0, pl: "weterynarz", emoji: "🐕" },
      { word: "vest", graphemes: ["v", "e", "s", "t"], targetIndex: 0, pl: "podkoszulek", emoji: "👕" },
      { word: "seven", graphemes: ["s", "e", "v", "e", "n"], targetIndex: 2, pl: "siedem", emoji: "7️⃣" },
    ],
    choice: [
      { answer: "van", options: ["van", "fan", "man"], pl: "furgonetka", emoji: "🚐" },
      { answer: "vet", options: ["vet", "net", "jet"], pl: "weterynarz", emoji: "🐕" },
      { answer: "five", options: ["five", "hive", "dive"], pl: "pięć", emoji: "5️⃣" },
      { answer: "vest", options: ["vest", "best", "nest"], pl: "podkoszulek", emoji: "👕" },
    ],
    redWords: ["the", "I"],
  },
  "y": {
    soundId: "y",
    heroId: "buzz",
    chant: "y — y — yes!",
    parentIntro:
      "Uwaga, pułapka. Polskie Y to samogłoska (jak w \"syn\"), a angielskie y na początku słowa to SPÓŁGŁOSKA — dokładnie polskie J, jak w \"jajko\": yes czytamy \"jes\", yellow \"jeloł\". Dodatkowo na końcu słów (happy, baby, toy) y NIE daje tego dźwięku — dlatego w ćwiczeniu słuchania takie słowa są oznaczone jako \"bez tego dźwięku\".",
    listen: [
      { word: "yes", hasTarget: true, pl: "tak", emoji: "✅" },
      { word: "happy", hasTarget: false, pl: "wesoły", emoji: "😀" },
      { word: "yellow", hasTarget: true, pl: "żółty", emoji: "💛" },
      { word: "toy", hasTarget: false, pl: "zabawka", emoji: "🧸" },
      { word: "you", hasTarget: true, pl: "ty", emoji: "👉" },
      { word: "baby", hasTarget: false, pl: "niemowlę", emoji: "👶" },
      { word: "year", hasTarget: true, pl: "rok", emoji: "📅" },
      { word: "sun", hasTarget: false, pl: "słońce", emoji: "☀️" },
    ],
    blend: [
      { word: "yes", graphemes: ["y", "e", "s"], targetIndex: 0, pl: "tak", emoji: "✅" },
      { word: "yak", graphemes: ["y", "a", "k"], targetIndex: 0, pl: "jak (zwierzę)", emoji: "🐃" },
      { word: "yell", graphemes: ["y", "e", "ll"], targetIndex: 0, pl: "krzyczeć", emoji: "📢" },
      { word: "yum", graphemes: ["y", "u", "m"], targetIndex: 0, pl: "mniam", emoji: "😋" },
    ],
    choice: [
      { answer: "yes", options: ["yes", "less", "mess"], pl: "tak", emoji: "✅" },
      { answer: "yellow", options: ["yellow", "fellow", "pillow"], pl: "żółty", emoji: "💛" },
      { answer: "yak", options: ["yak", "back", "sack"], pl: "jak (zwierzę)", emoji: "🐃" },
      { answer: "yell", options: ["yell", "bell", "well"], pl: "krzyczeć", emoji: "📢" },
    ],
    redWords: ["you", "said"],
  },
  "w": {
    soundId: "w",
    heroId: "buzz",
    chant: "w — w — wow!",
    parentIntro:
      "Największa pułapka z całego zestawu. Polska litera W to dźwięk /v/ — czyli dokładnie to, co po angielsku zapisujemy literą V. Angielskie w to zupełnie inny dźwięk: usta w dzióbek, jak polskie Ł w \"łódka\" (water = \"łoter\", nie \"vater\"). Ćwiczcie parami: wet — vet, west — vest.",
    listen: [
      { word: "web", hasTarget: true, pl: "pajęczyna", emoji: "🕸️" },
      { word: "two", hasTarget: false, pl: "dwa", emoji: "✌️" },
      { word: "winter", hasTarget: true, pl: "zima", emoji: "⛄" },
      { word: "snow", hasTarget: false, pl: "śnieg", emoji: "❄️" },
      { word: "water", hasTarget: true, pl: "woda", emoji: "💧" },
      { word: "yellow", hasTarget: false, pl: "żółty", emoji: "💛" },
      { word: "week", hasTarget: true, pl: "tydzień", emoji: "📅" },
      { word: "cow", hasTarget: false, pl: "krowa", emoji: "🐄" },
    ],
    blend: [
      { word: "web", graphemes: ["w", "e", "b"], targetIndex: 0, pl: "pajęczyna", emoji: "🕸️" },
      { word: "wet", graphemes: ["w", "e", "t"], targetIndex: 0, pl: "mokry", emoji: "💧" },
      { word: "win", graphemes: ["w", "i", "n"], targetIndex: 0, pl: "wygrać", emoji: "🏆" },
      { word: "week", graphemes: ["w", "ee", "k"], targetIndex: 0, pl: "tydzień", emoji: "📅" },
    ],
    choice: [
      { answer: "web", options: ["web", "vet", "bed"], pl: "pajęczyna", emoji: "🕸️" },
      { answer: "wet", options: ["wet", "vet", "net"], pl: "mokry", emoji: "💧" },
      { answer: "win", options: ["win", "pin", "fin"], pl: "wygrać", emoji: "🏆" },
      { answer: "week", options: ["week", "seek", "peek"], pl: "tydzień", emoji: "📅" },
    ],
    redWords: ["was", "we"],
  },
  "z": {
    soundId: "z",
    heroId: "buzz",
    chant: "z — z — zzzz!",
    parentIntro:
      "Tu jest łatwo: angielskie z brzmi tak samo jak polskie Z. To szybkie sprawdzenie, bez pułapki dla polskiego ucha. Jedyna rzecz do zapamiętania: po angielsku ten sam dźwięk bardzo często zapisuje się literą s (nose, dogs), dlatego w ćwiczeniu słuchania pojawiają się takie słowa.",
    listen: [
      { word: "zip", hasTarget: true, pl: "suwak", emoji: "🤐" },
      { word: "bus", hasTarget: false, pl: "autobus", emoji: "🚌" },
      { word: "zoo", hasTarget: true, pl: "zoo", emoji: "🦁" },
      { word: "sock", hasTarget: false, pl: "skarpetka", emoji: "🧦" },
      { word: "nose", hasTarget: true, pl: "nos", emoji: "👃" },
      { word: "house", hasTarget: false, pl: "dom", emoji: "🏠" },
      { word: "zebra", hasTarget: true, pl: "zebra", emoji: "🦓" },
      { word: "cats", hasTarget: false, pl: "koty", emoji: "🐈" },
    ],
    blend: [
      { word: "zip", graphemes: ["z", "i", "p"], targetIndex: 0, pl: "suwak", emoji: "🤐" },
      { word: "zip", graphemes: ["z", "i", "p"], targetIndex: 0, pl: "zamek", emoji: "🧥" },
      { word: "buzz", graphemes: ["b", "u", "zz"], targetIndex: 2, pl: "bzyczeć", emoji: "🐝" },
      { word: "fizz", graphemes: ["f", "i", "zz"], targetIndex: 2, pl: "bąbelki", emoji: "🥤" },
      { word: "jazz", graphemes: ["j", "a", "zz"], targetIndex: 2, pl: "jazz", emoji: "🎷" },
    ],
    choice: [
      { answer: "zip", options: ["zip", "sip", "tip"], pl: "suwak", emoji: "🤐" },
      { answer: "zoo", options: ["zoo", "boo", "moo"], pl: "zoo", emoji: "🦁" },
      { answer: "buzz", options: ["buzz", "bus", "bug"], pl: "bzyczeć", emoji: "🐝" },
      { answer: "nose", options: ["nose", "rose", "hose"], pl: "nos", emoji: "👃" },
    ],
    redWords: ["he", "she"],
  },
  "x": {
    soundId: "x",
    heroId: "buzz",
    chant: "x — x — ksss!",
    parentIntro:
      "Litera x to nie jeden dźwięk, tylko dwa naraz: /k/ + /s/, czyli polskie \"ks\". Prawie zawsze stoi na końcu słowa (box, fox, six) — dziecko nie uczy się nowego dźwięku, tylko nowego zapisu. Przy czytaniu mówimy \"ks\", nigdy nazwy litery \"iks\". Ten sam dźwięk słychać też w socks czy books, choć nie ma tam litery x — stąd takie słowo w ćwiczeniu słuchania.",
    listen: [
      { word: "box", hasTarget: true, pl: "pudełko", emoji: "📦" },
      { word: "bag", hasTarget: false, pl: "torba", emoji: "👜" },
      { word: "six", hasTarget: true, pl: "sześć", emoji: "6️⃣" },
      { word: "sun", hasTarget: false, pl: "słońce", emoji: "☀️" },
      { word: "fox", hasTarget: true, pl: "lis", emoji: "🦊" },
      { word: "duck", hasTarget: false, pl: "kaczka", emoji: "🦆" },
      { word: "socks", hasTarget: true, pl: "skarpetki", emoji: "🧦" },
      { word: "clock", hasTarget: false, pl: "zegar", emoji: "⏰" },
    ],
    blend: [
      { word: "box", graphemes: ["b", "o", "x"], targetIndex: 2, pl: "pudełko", emoji: "📦" },
      { word: "fox", graphemes: ["f", "o", "x"], targetIndex: 2, pl: "lis", emoji: "🦊" },
      { word: "six", graphemes: ["s", "i", "x"], targetIndex: 2, pl: "sześć", emoji: "6️⃣" },
      { word: "fix", graphemes: ["f", "i", "x"], targetIndex: 2, pl: "naprawić", emoji: "🔧" },
      { word: "mix", graphemes: ["m", "i", "x"], targetIndex: 2, pl: "mieszać", emoji: "🥣" },
    ],
    choice: [
      { answer: "box", options: ["box", "fox", "bag"], pl: "pudełko", emoji: "📦" },
      { answer: "six", options: ["six", "sick", "sit"], pl: "sześć", emoji: "6️⃣" },
      { answer: "fox", options: ["fox", "fog", "dog"], pl: "lis", emoji: "🦊" },
      { answer: "mix", options: ["mix", "miss", "mist"], pl: "mieszać", emoji: "🥣" },
    ],
    redWords: ["to", "of"],
  },

  sh: {
    soundId: "sh",
    heroId: "buzz",
    chant: "sh — sh — sh!",
    parentIntro:
      'Pokaż palec na ustach i powiedz długie "shhh". Poproś dziecko, żeby powtórzyło 3 razy. ' +
      'Podkreśl: to JEDEN dźwięk, chociaż są DWIE litery — w RWI to "special friends", litery, które trzymają się razem.',
    listen: [
      { word: "ship", hasTarget: true, pl: "statek", emoji: "🚢" },
      { word: "bat", hasTarget: false, pl: "nietoperz", emoji: "🦇" },
      { word: "fish", hasTarget: true, pl: "ryba", emoji: "🐟" },
      { word: "bed", hasTarget: false, pl: "łóżko", emoji: "🛏️" },
      { word: "shell", hasTarget: true, pl: "muszla", emoji: "🐚" },
      { word: "box", hasTarget: false, pl: "pudełko", emoji: "📦" },
      { word: "brush", hasTarget: true, pl: "pędzel", emoji: "🖌️" },
      { word: "bus", hasTarget: false, pl: "autobus", emoji: "🚌" },
    ],
    blend: [
      { word: "ship", graphemes: ["sh", "i", "p"], targetIndex: 0, pl: "statek", emoji: "🚢" },
      { word: "shop", graphemes: ["sh", "o", "p"], targetIndex: 0, pl: "sklep", emoji: "🏪" },
      { word: "fish", graphemes: ["f", "i", "sh"], targetIndex: 2, pl: "ryba", emoji: "🐟" },
      { word: "shed", graphemes: ["sh", "e", "d"], targetIndex: 0, pl: "szopa", emoji: "🏚️" },
      { word: "wish", graphemes: ["w", "i", "sh"], targetIndex: 2, pl: "życzenie", emoji: "⭐" },
    ],
    choice: [
      { answer: "ship", options: ["ship", "shop", "shed"], pl: "statek", emoji: "🚢" },
      { answer: "fish", options: ["fish", "dish", "wish"], pl: "ryba", emoji: "🐟" },
      { answer: "shop", options: ["shed", "shop", "ship"], pl: "sklep", emoji: "🏪" },
      { answer: "brush", options: ["brush", "bush", "blush"], pl: "pędzel", emoji: "🖌️" },
    ],
    redWords: ["the", "I"],
  },

  ch: {
    soundId: "ch",
    heroId: "shock",
    chant: "ch — ch — ch!",
    parentIntro:
      'Zrób dźwięk ruszającego pociągu: "cz-cz-cz". Uwaga na pułapkę dla polskiego ucha — ' +
      'angielskie "ch" to NIE polskie "ch" (jak w „chleb"), tylko "cz".',
    listen: [
      { word: "chip", hasTarget: true, pl: "frytka", emoji: "🍟" },
      { word: "cat", hasTarget: false, pl: "kot", emoji: "🐱" },
      { word: "chair", hasTarget: true, pl: "krzesło", emoji: "💺" },
      { word: "clock", hasTarget: false, pl: "zegar", emoji: "🕐" },
      { word: "lunch", hasTarget: true, pl: "obiad", emoji: "🍱" },
      { word: "cup", hasTarget: false, pl: "kubek", emoji: "☕" },
      { word: "cheese", hasTarget: true, pl: "ser", emoji: "🧀" },
      { word: "desk", hasTarget: false, pl: "biurko", emoji: "📚" },
    ],
    blend: [
      { word: "chip", graphemes: ["ch", "i", "p"], targetIndex: 0, pl: "frytka", emoji: "🍟" },
      { word: "chat", graphemes: ["ch", "a", "t"], targetIndex: 0, pl: "pogawędka", emoji: "💬" },
      { word: "rich", graphemes: ["r", "i", "ch"], targetIndex: 2, pl: "bogaty", emoji: "💰" },
      { word: "chop", graphemes: ["ch", "o", "p"], targetIndex: 0, pl: "siekać", emoji: "🔪" },
      { word: "much", graphemes: ["m", "u", "ch"], targetIndex: 2, pl: "dużo", emoji: "📦" },
    ],
    choice: [
      { answer: "chip", options: ["chip", "chop", "ship"], pl: "frytka", emoji: "🍟" },
      // Było "chair/hair/chain" — wszystkie trzy opierały się na "air" i "ai",
      // czyli dźwiękach z dalszych Setów, których dziecko na etapie "ch" nie zna.
      { answer: "chin", options: ["chin", "shin", "chip"], pl: "broda", emoji: "🧒" },
      { answer: "chop", options: ["chip", "chop", "shop"], pl: "siekać", emoji: "🔪" },
      { answer: "much", options: ["much", "mush", "match"], pl: "dużo", emoji: "📦" },
    ],
    redWords: ["the", "to"],
  },

  // --- reszta "special friends" z Set 1 ------------------------------------

  th: {
    soundId: "th",
    heroId: "chomp",
    chant: "th — th — th!",
    parentIntro:
      "Czubek języka MIĘDZY zębami. Są DWA warianty: przy „thin”, „moth”, „cloth” tylko " +
      "lekko dmuchnij, bez głosu; przy „this”, „that”, „the” język zostaje w tym samym " +
      "miejscu, ale włączasz głos — sprawdźcie palcami na gardle, przy „this” brzęczy, " +
      "przy „thin” nie. Pokaż dziecku swoje usta — tej głoski nie ma w polskim, więc " +
      "trzeba ją zobaczyć, nie tylko usłyszeć. Nie zastępuj jej „f”, „s” ani „d”.",
    listen: [
      { word: "this", hasTarget: true, pl: "to", emoji: "👇" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
      { word: "bath", hasTarget: true, pl: "kąpiel", emoji: "🛁" },
      { word: "doll", hasTarget: false, pl: "lalka", emoji: "🎎" },
      { word: "moth", hasTarget: true, pl: "ćma", emoji: "🦋" },
      { word: "duck", hasTarget: false, pl: "kaczka", emoji: "🦆" },
      { word: "thin", hasTarget: true, pl: "chudy", emoji: "📏" },
      { word: "fox", hasTarget: false, pl: "lis", emoji: "🦊" },
    ],
    blend: [
      // Tylko bezdźwięczne /θ/: kafelek "th" ma jedno nagranie (thin), a "this"
      // i "that" mają th DŹWIĘCZNE — sklejanie kłamałoby dziecku w uszy.
      // Wyłącznie słowa, w których KAŻDY kafelek gra ten dźwięk co w nagraniu.
      // Odpadły: "bath" i "path" (brytyjskie "a" brzmi tam długo /ɑː/, kafelek
      // gra krótkie /a/) oraz "with" (ma th dźwięczne). Wszystkie trzy zostają
      // w słuchaniu i wyborze słowa, gdzie gra całe nagranie — tam problemu nie ma.
      { word: "thin", graphemes: ["th", "i", "n"], targetIndex: 0, pl: "chudy", emoji: "📏" },
      { word: "moth", graphemes: ["m", "o", "th"], targetIndex: 2, pl: "ćma", emoji: "🦋" },
      { word: "cloth", graphemes: ["c", "l", "o", "th"], targetIndex: 3, pl: "ścierka", emoji: "🧵" },
      { word: "tenth", graphemes: ["t", "e", "n", "th"], targetIndex: 3, pl: "dziesiąty", emoji: "🔟" },
      { word: "thud", graphemes: ["th", "u", "d"], targetIndex: 0, pl: "łomot", emoji: "💥" },
    ],
    choice: [
      { answer: "this", options: ["this", "that", "thin"], pl: "to", emoji: "👇" },
      { answer: "bath", options: ["bath", "path", "bat"], pl: "kąpiel", emoji: "🛁" },
      { answer: "moth", options: ["moth", "math", "mash"], pl: "ćma", emoji: "🦋" },
      { answer: "thin", options: ["thin", "shin", "chin"], pl: "chudy", emoji: "📏" },
    ],
    redWords: ["the", "of"],
  },

  qu: {
    soundId: "qu",
    heroId: "thunder",
    chant: "qu — qu — qu!",
    parentIntro:
      'Dwie litery, jeden dźwięk „kł”. Zwróć uwagę dziecka, że „q” nigdy nie chodzi samo — ' +
      "zawsze trzyma się „u” za rękę.",
    listen: [
      { word: "quit", hasTarget: true, pl: "przestać", emoji: "🛑" },
      { word: "frog", hasTarget: false, pl: "żaba", emoji: "🐸" },
      { word: "quiz", hasTarget: true, pl: "quiz", emoji: "❓" },
      { word: "hat", hasTarget: false, pl: "czapka", emoji: "🎩" },
      { word: "squid", hasTarget: true, pl: "kalmar", emoji: "🦑" },
      { word: "hen", hasTarget: false, pl: "kura", emoji: "🐔" },
      { word: "quilt", hasTarget: true, pl: "kołdra", emoji: "🛏️" },
      { word: "jam", hasTarget: false, pl: "dżem", emoji: "🍓" },
    ],
    blend: [
      { word: "quit", graphemes: ["qu", "i", "t"], targetIndex: 0, pl: "przestać", emoji: "🛑" },
      { word: "quiz", graphemes: ["qu", "i", "z"], targetIndex: 0, pl: "quiz", emoji: "❓" },
      { word: "quilt", graphemes: ["qu", "i", "l", "t"], targetIndex: 0, pl: "kołdra", emoji: "🛏️" },
      { word: "squid", graphemes: ["s", "qu", "i", "d"], targetIndex: 1, pl: "kalmar", emoji: "🦑" },
    ],
    choice: [
      { answer: "quit", options: ["quit", "quiz", "quilt"], pl: "przestać", emoji: "🛑" },
      { answer: "quiz", options: ["quiz", "quit", "quick"], pl: "quiz", emoji: "❓" },
      { answer: "squid", options: ["squid", "quid", "skid"], pl: "kalmar", emoji: "🦑" },
      { answer: "quilt", options: ["quilt", "quit", "quill"], pl: "kołdra", emoji: "🛏️" },
    ],
    redWords: ["to", "was"],
  },

  ng: {
    soundId: "ng",
    heroId: "thunder",
    chant: "ng — ng — ng!",
    parentIntro:
      "Dźwięk wychodzi nosem, a język dotyka tyłu podniebienia. Uwaga: na końcu NIE ma " +
      "wyraźnego „g” — „ring” to nie „ring-g”.",
    listen: [
      { word: "ring", hasTarget: true, pl: "pierścionek", emoji: "💍" },
      { word: "kid", hasTarget: false, pl: "dzieciak", emoji: "🧒" },
      { word: "sing", hasTarget: true, pl: "śpiewać", emoji: "🎵" },
      { word: "lamp", hasTarget: false, pl: "lampa", emoji: "💡" },
      { word: "king", hasTarget: true, pl: "król", emoji: "👑" },
      { word: "leg", hasTarget: false, pl: "noga", emoji: "🦵" },
      { word: "song", hasTarget: true, pl: "piosenka", emoji: "🎶" },
      { word: "log", hasTarget: false, pl: "kłoda", emoji: "🌳" },
    ],
    blend: [
      { word: "ring", graphemes: ["r", "i", "ng"], targetIndex: 2, pl: "pierścionek", emoji: "💍" },
      { word: "sing", graphemes: ["s", "i", "ng"], targetIndex: 2, pl: "śpiewać", emoji: "🎵" },
      { word: "king", graphemes: ["k", "i", "ng"], targetIndex: 2, pl: "król", emoji: "👑" },
      { word: "song", graphemes: ["s", "o", "ng"], targetIndex: 2, pl: "piosenka", emoji: "🎶" },
      { word: "long", graphemes: ["l", "o", "ng"], targetIndex: 2, pl: "długi", emoji: "📏" },
    ],
    choice: [
      { answer: "ring", options: ["ring", "wing", "rang"], pl: "pierścionek", emoji: "💍" },
      { answer: "king", options: ["king", "kin", "ping"], pl: "król", emoji: "👑" },
      { answer: "song", options: ["song", "sing", "sung"], pl: "piosenka", emoji: "🎶" },
      { answer: "long", options: ["long", "song", "lung"], pl: "długi", emoji: "📏" },
    ],
    redWords: ["of", "said"],
  },

  nk: {
    soundId: "nk",
    heroId: "thunder",
    chant: "nk — nk — nk!",
    parentIntro:
      'Jak „nk” w polskim „bank” — to akurat łatwe dla polskiego ucha. Podkreśl, że to ' +
      "jeden dźwięk na końcu słowa, nie dwa osobne.",
    listen: [
      { word: "pink", hasTarget: true, pl: "różowy", emoji: "💗" },
      { word: "man", hasTarget: false, pl: "mężczyzna", emoji: "🧑" },
      { word: "sink", hasTarget: true, pl: "zlew", emoji: "🚰" },
      { word: "milk", hasTarget: false, pl: "mleko", emoji: "🥛" },
      { word: "bank", hasTarget: true, pl: "bank", emoji: "🏦" },
      { word: "mug", hasTarget: false, pl: "kubek", emoji: "🍺" },
      { word: "wink", hasTarget: true, pl: "mrugnięcie", emoji: "😉" },
      { word: "net", hasTarget: false, pl: "siatka", emoji: "🥅" },
    ],
    blend: [
      { word: "pink", graphemes: ["p", "i", "nk"], targetIndex: 2, pl: "różowy", emoji: "💗" },
      { word: "sink", graphemes: ["s", "i", "nk"], targetIndex: 2, pl: "zlew", emoji: "🚰" },
      { word: "bank", graphemes: ["b", "a", "nk"], targetIndex: 2, pl: "bank", emoji: "🏦" },
      { word: "wink", graphemes: ["w", "i", "nk"], targetIndex: 2, pl: "mrugnięcie", emoji: "😉" },
      { word: "junk", graphemes: ["j", "u", "nk"], targetIndex: 2, pl: "rupiecie", emoji: "🗑️" },
    ],
    choice: [
      { answer: "pink", options: ["pink", "ping", "pick"], pl: "różowy", emoji: "💗" },
      { answer: "sink", options: ["sink", "sing", "silk"], pl: "zlew", emoji: "🚰" },
      { answer: "bank", options: ["bank", "back", "band"], pl: "bank", emoji: "🏦" },
      { answer: "junk", options: ["junk", "jump", "jug"], pl: "rupiecie", emoji: "🗑️" },
    ],
    redWords: ["was", "you"],
  },

  // --- Set 2: 12 "speed sounds" -------------------------------------------

  ay: {
    soundId: "ay",
    heroId: "thunder",
    chant: "may I play?",
    parentIntro:
      'Długie „ej”. To pierwszy dźwięk z Set 2 — powiedz dziecku, że teraz dwie litery ' +
      "często robią jeden długi dźwięk, tak jak wcześniej „sh” i „ch”.",
    listen: [
      { word: "day", hasTarget: true, pl: "dzień", emoji: "🌞" },
      { word: "pen", hasTarget: false, pl: "długopis", emoji: "🖊️" },
      { word: "play", hasTarget: true, pl: "bawić się", emoji: "🎈" },
      { word: "pig", hasTarget: false, pl: "świnia", emoji: "🐷" },
      { word: "say", hasTarget: true, pl: "powiedzieć", emoji: "💬" },
      { word: "plant", hasTarget: false, pl: "roślina", emoji: "🌱" },
      { word: "way", hasTarget: true, pl: "droga", emoji: "🛣️" },
      { word: "pot", hasTarget: false, pl: "garnek", emoji: "🍲" },
    ],
    blend: [
      { word: "day", graphemes: ["d", "ay"], targetIndex: 1, pl: "dzień", emoji: "🌞" },
      { word: "say", graphemes: ["s", "ay"], targetIndex: 1, pl: "powiedzieć", emoji: "💬" },
      { word: "way", graphemes: ["w", "ay"], targetIndex: 1, pl: "droga", emoji: "🛣️" },
      { word: "play", graphemes: ["p", "l", "ay"], targetIndex: 2, pl: "bawić się", emoji: "🎈" },
      { word: "stay", graphemes: ["s", "t", "ay"], targetIndex: 2, pl: "zostać", emoji: "🏠" },
    ],
    choice: [
      { answer: "day", options: ["day", "say", "way"], pl: "dzień", emoji: "🌞" },
      { answer: "play", options: ["play", "pay", "plan"], pl: "bawić się", emoji: "🎈" },
      { answer: "stay", options: ["stay", "say", "star"], pl: "zostać", emoji: "🏠" },
      { answer: "way", options: ["way", "day", "wag"], pl: "droga", emoji: "🛣️" },
    ],
    redWords: ["said", "are"],
  },

  ee: {
    soundId: "ee",
    heroId: "thunder",
    chant: "what can you see?",
    parentIntro:
      'Długie, napięte „iii”, usta szeroko jak w uśmiechu. Porównaj z „ship”: „sheep” ' +
      '(owca) ma długie napięte „ii”, a „ship” (statek) dźwięk krótki i LUŹNY, pomiędzy ' +
      'polskim „i” a „y”. To dwa różne dźwięki, nie ten sam skrócony — dziecko musi ' +
      'usłyszeć różnicę barwy, nie tylko długości.',
    listen: [
      { word: "tree", hasTarget: true, pl: "drzewo", emoji: "🌳" },
      { word: "rug", hasTarget: false, pl: "dywanik", emoji: "🧶" },
      { word: "feet", hasTarget: true, pl: "stopy", emoji: "👣" },
      { word: "sock", hasTarget: false, pl: "skarpetka", emoji: "🧦" },
      { word: "sheep", hasTarget: true, pl: "owca", emoji: "🐑" },
      { word: "sun", hasTarget: false, pl: "słońce", emoji: "☀️" },
      { word: "week", hasTarget: true, pl: "tydzień", emoji: "📅" },
      { word: "tap", hasTarget: false, pl: "kran", emoji: "🚰" },
    ],
    blend: [
      { word: "see", graphemes: ["s", "ee"], targetIndex: 1, pl: "widzieć", emoji: "👀" },
      { word: "tree", graphemes: ["t", "r", "ee"], targetIndex: 2, pl: "drzewo", emoji: "🌳" },
      { word: "feet", graphemes: ["f", "ee", "t"], targetIndex: 1, pl: "stopy", emoji: "👣" },
      { word: "week", graphemes: ["w", "ee", "k"], targetIndex: 1, pl: "tydzień", emoji: "📅" },
      { word: "sheep", graphemes: ["sh", "ee", "p"], targetIndex: 1, pl: "owca", emoji: "🐑" },
    ],
    choice: [
      { answer: "sheep", options: ["sheep", "ship", "shop"], pl: "owca", emoji: "🐑" },
      { answer: "tree", options: ["tree", "three", "free"], pl: "drzewo", emoji: "🌳" },
      { answer: "feet", options: ["feet", "fit", "felt"], pl: "stopy", emoji: "👣" },
      { answer: "week", options: ["week", "wick", "weep"], pl: "tydzień", emoji: "📅" },
    ],
    redWords: ["you", "his"],
  },

  igh: {
    soundId: "igh",
    heroId: "speed",
    chant: "fly high!",
    parentIntro:
      'TRZY litery, jeden dźwięk „aj”. Podkreśl to dziecku — „gh” tutaj w ogóle nie brzmi, ' +
      "trzyma się „i” jak dwaj cisi ochroniarze.",
    listen: [
      { word: "night", hasTarget: true, pl: "noc", emoji: "🌙" },
      { word: "top", hasTarget: false, pl: "góra", emoji: "🔝" },
      { word: "light", hasTarget: true, pl: "światło", emoji: "💡" },
      { word: "truck", hasTarget: false, pl: "ciężarówka", emoji: "🚚" },
      { word: "high", hasTarget: true, pl: "wysoki", emoji: "🏔️" },
      { word: "van", hasTarget: false, pl: "furgonetka", emoji: "🚐" },
      { word: "right", hasTarget: true, pl: "w prawo", emoji: "➡️" },
      { word: "web", hasTarget: false, pl: "pajęczyna", emoji: "🕸️" },
    ],
    blend: [
      { word: "high", graphemes: ["h", "igh"], targetIndex: 1, pl: "wysoki", emoji: "🏔️" },
      { word: "light", graphemes: ["l", "igh", "t"], targetIndex: 1, pl: "światło", emoji: "💡" },
      { word: "night", graphemes: ["n", "igh", "t"], targetIndex: 1, pl: "noc", emoji: "🌙" },
      { word: "right", graphemes: ["r", "igh", "t"], targetIndex: 1, pl: "w prawo", emoji: "➡️" },
      { word: "sigh", graphemes: ["s", "igh"], targetIndex: 1, pl: "westchnienie", emoji: "😌" },
    ],
    choice: [
      { answer: "night", options: ["night", "light", "right"], pl: "noc", emoji: "🌙" },
      { answer: "light", options: ["light", "night", "list"], pl: "światło", emoji: "💡" },
      { answer: "high", options: ["high", "hit", "hill"], pl: "wysoki", emoji: "🏔️" },
      { answer: "right", options: ["right", "rich", "ring"], pl: "w prawo", emoji: "➡️" },
    ],
    redWords: ["are", "they"],
  },

  "ow-blow": {
    soundId: "ow-blow",
    heroId: "speed",
    chant: "blow the snow!",
    parentIntro:
      'To „oł” jak w „blow”. UWAGA: te same litery „ow” czytamy inaczej w „brown” (Set 3) — ' +
      "na razie ćwiczymy tylko tę pierwszą wersję, żeby nie mieszać.",
    listen: [
      { word: "snow", hasTarget: true, pl: "śnieg", emoji: "❄️" },
      { word: "zip", hasTarget: false, pl: "zamek", emoji: "🤐" },
      { word: "blow", hasTarget: true, pl: "dmuchać", emoji: "💨" },
      { word: "bat", hasTarget: false, pl: "nietoperz", emoji: "🦇" },
      { word: "show", hasTarget: true, pl: "pokaz", emoji: "🎬" },
      { word: "bed", hasTarget: false, pl: "łóżko", emoji: "🛏️" },
      { word: "grow", hasTarget: true, pl: "rosnąć", emoji: "🌱" },
      { word: "box", hasTarget: false, pl: "pudełko", emoji: "📦" },
    ],
    blend: [
      { word: "snow", graphemes: ["s", "n", "ow"], targetIndex: 2, pl: "śnieg", emoji: "❄️" },
      { word: "blow", graphemes: ["b", "l", "ow"], targetIndex: 2, pl: "dmuchać", emoji: "💨" },
      { word: "show", graphemes: ["sh", "ow"], targetIndex: 1, pl: "pokaz", emoji: "🎬" },
      { word: "grow", graphemes: ["g", "r", "ow"], targetIndex: 2, pl: "rosnąć", emoji: "🌱" },
      { word: "slow", graphemes: ["s", "l", "ow"], targetIndex: 2, pl: "powolny", emoji: "🐌" },
    ],
    choice: [
      { answer: "snow", options: ["snow", "slow", "show"], pl: "śnieg", emoji: "❄️" },
      { answer: "blow", options: ["blow", "glow", "brow"], pl: "dmuchać", emoji: "💨" },
      { answer: "show", options: ["show", "shop", "snow"], pl: "pokaz", emoji: "🎬" },
      { answer: "grow", options: ["grow", "glow", "grab"], pl: "rosnąć", emoji: "🌱" },
    ],
    redWords: ["his", "be"],
  },

  "oo-zoo": {
    soundId: "oo-zoo",
    heroId: "speed",
    chant: "poo at the zoo!",
    parentIntro:
      'Długie „uuu”, usta w dziobek. To ta głośniejsza wersja „oo” — jak w „zoo”. ' +
      'Druga wersja („look”) będzie zaraz potem, więc warto je zestawić.',
    listen: [
      { word: "moon", hasTarget: true, pl: "księżyc", emoji: "🌕" },
      { word: "bus", hasTarget: false, pl: "autobus", emoji: "🚌" },
      { word: "zoo", hasTarget: true, pl: "zoo", emoji: "🦁" },
      { word: "cat", hasTarget: false, pl: "kot", emoji: "🐱" },
      { word: "food", hasTarget: true, pl: "jedzenie", emoji: "🍔" },
      { word: "clock", hasTarget: false, pl: "zegar", emoji: "🕐" },
      { word: "boot", hasTarget: true, pl: "but", emoji: "👢" },
      { word: "cup", hasTarget: false, pl: "kubek", emoji: "☕" },
    ],
    blend: [
      { word: "zoo", graphemes: ["z", "oo"], targetIndex: 1, pl: "zoo", emoji: "🦁" },
      { word: "moon", graphemes: ["m", "oo", "n"], targetIndex: 1, pl: "księżyc", emoji: "🌕" },
      { word: "food", graphemes: ["f", "oo", "d"], targetIndex: 1, pl: "jedzenie", emoji: "🍔" },
      { word: "boot", graphemes: ["b", "oo", "t"], targetIndex: 1, pl: "but", emoji: "👢" },
      { word: "room", graphemes: ["r", "oo", "m"], targetIndex: 1, pl: "pokój", emoji: "🚪" },
    ],
    choice: [
      { answer: "moon", options: ["moon", "mood", "man"], pl: "księżyc", emoji: "🌕" },
      { answer: "food", options: ["food", "foot", "fond"], pl: "jedzenie", emoji: "🍔" },
      { answer: "boot", options: ["boot", "book", "boat"], pl: "but", emoji: "👢" },
      { answer: "room", options: ["room", "root", "ram"], pl: "pokój", emoji: "🚪" },
    ],
    redWords: ["they", "have"],
  },

  "oo-look": {
    soundId: "oo-look",
    heroId: "moon",
    chant: "look at a book!",
    parentIntro:
      'Te same dwie litery, ale dźwięk KRÓTKI — jak w „look”. Zestaw z poprzednią lekcją: ' +
      '„food” (długie) kontra „foot” (krótkie). To jedna z pierwszych pułapek angielskiej pisowni.',
    listen: [
      { word: "book", hasTarget: true, pl: "książka", emoji: "📖" },
      { word: "desk", hasTarget: false, pl: "biurko", emoji: "📚" },
      { word: "look", hasTarget: true, pl: "patrzeć", emoji: "👀" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
      { word: "foot", hasTarget: true, pl: "stopa", emoji: "🦶" },
      { word: "doll", hasTarget: false, pl: "lalka", emoji: "🎎" },
      { word: "good", hasTarget: true, pl: "dobry", emoji: "👍" },
      { word: "duck", hasTarget: false, pl: "kaczka", emoji: "🦆" },
    ],
    blend: [
      { word: "look", graphemes: ["l", "oo", "k"], targetIndex: 1, pl: "patrzeć", emoji: "👀" },
      { word: "book", graphemes: ["b", "oo", "k"], targetIndex: 1, pl: "książka", emoji: "📖" },
      { word: "cook", graphemes: ["c", "oo", "k"], targetIndex: 1, pl: "gotować", emoji: "🍳" },
      { word: "foot", graphemes: ["f", "oo", "t"], targetIndex: 1, pl: "stopa", emoji: "🦶" },
      { word: "good", graphemes: ["g", "oo", "d"], targetIndex: 1, pl: "dobry", emoji: "👍" },
    ],
    choice: [
      { answer: "book", options: ["book", "boot", "back"], pl: "książka", emoji: "📖" },
      { answer: "foot", options: ["foot", "food", "fit"], pl: "stopa", emoji: "🦶" },
      { answer: "look", options: ["look", "lock", "lick"], pl: "patrzeć", emoji: "👀" },
      { answer: "good", options: ["good", "goat", "gold"], pl: "dobry", emoji: "👍" },
    ],
    redWords: ["be", "one"],
  },

  ar: {
    soundId: "ar",
    heroId: "moon",
    chant: "start the car!",
    parentIntro:
      'Długie „aaar” — jak pirat. W brytyjskim angielskim „r” na końcu prawie nie słychać, ' +
      "liczy się długie „a”.",
    listen: [
      { word: "car", hasTarget: true, pl: "samochód", emoji: "🚗" },
      { word: "fox", hasTarget: false, pl: "lis", emoji: "🦊" },
      { word: "star", hasTarget: true, pl: "gwiazda", emoji: "⭐" },
      { word: "frog", hasTarget: false, pl: "żaba", emoji: "🐸" },
      { word: "farm", hasTarget: true, pl: "gospodarstwo", emoji: "🚜" },
      { word: "hat", hasTarget: false, pl: "czapka", emoji: "🎩" },
      { word: "park", hasTarget: true, pl: "park", emoji: "🌳" },
      { word: "hen", hasTarget: false, pl: "kura", emoji: "🐔" },
    ],
    blend: [
      { word: "car", graphemes: ["c", "ar"], targetIndex: 1, pl: "samochód", emoji: "🚗" },
      { word: "star", graphemes: ["s", "t", "ar"], targetIndex: 2, pl: "gwiazda", emoji: "⭐" },
      { word: "farm", graphemes: ["f", "ar", "m"], targetIndex: 1, pl: "gospodarstwo", emoji: "🚜" },
      { word: "park", graphemes: ["p", "ar", "k"], targetIndex: 1, pl: "park", emoji: "🌳" },
      { word: "dark", graphemes: ["d", "ar", "k"], targetIndex: 1, pl: "ciemny", emoji: "🌑" },
    ],
    choice: [
      { answer: "car", options: ["car", "cat", "cart"], pl: "samochód", emoji: "🚗" },
      { answer: "star", options: ["star", "stir", "start"], pl: "gwiazda", emoji: "⭐" },
      { answer: "farm", options: ["farm", "form", "far"], pl: "gospodarstwo", emoji: "🚜" },
      { answer: "park", options: ["park", "pack", "part"], pl: "park", emoji: "🌳" },
    ],
    redWords: ["have", "the"],
  },

  or: {
    soundId: "or",
    heroId: "spark",
    chant: "shut the door!",
    parentIntro: 'Długie „ooor”, usta zaokrąglone. Jak zdziwione „oo!”, tylko dłuższe.',
    listen: [
      { word: "fork", hasTarget: true, pl: "widelec", emoji: "🍴" },
      { word: "jam", hasTarget: false, pl: "dżem", emoji: "🍓" },
      { word: "corn", hasTarget: true, pl: "kukurydza", emoji: "🌽" },
      { word: "kid", hasTarget: false, pl: "dzieciak", emoji: "🧒" },
      { word: "horn", hasTarget: true, pl: "róg", emoji: "📯" },
      { word: "lamp", hasTarget: false, pl: "lampa", emoji: "💡" },
      { word: "storm", hasTarget: true, pl: "burza", emoji: "⛈️" },
      { word: "leg", hasTarget: false, pl: "noga", emoji: "🦵" },
    ],
    blend: [
      { word: "fork", graphemes: ["f", "or", "k"], targetIndex: 1, pl: "widelec", emoji: "🍴" },
      { word: "corn", graphemes: ["c", "or", "n"], targetIndex: 1, pl: "kukurydza", emoji: "🌽" },
      { word: "horn", graphemes: ["h", "or", "n"], targetIndex: 1, pl: "róg", emoji: "📯" },
      { word: "storm", graphemes: ["s", "t", "or", "m"], targetIndex: 2, pl: "burza", emoji: "⛈️" },
      { word: "sport", graphemes: ["s", "p", "or", "t"], targetIndex: 2, pl: "sport", emoji: "⚽" },
    ],
    choice: [
      { answer: "fork", options: ["fork", "fort", "far"], pl: "widelec", emoji: "🍴" },
      { answer: "corn", options: ["corn", "cord", "car"], pl: "kukurydza", emoji: "🌽" },
      { answer: "horn", options: ["horn", "harm", "hood"], pl: "róg", emoji: "📯" },
      { answer: "storm", options: ["storm", "stork", "star"], pl: "burza", emoji: "⛈️" },
    ],
    redWords: ["one", "we"],
  },

  air: {
    soundId: "air",
    heroId: "spark",
    chant: "that's not fair!",
    parentIntro: 'Jak polskie „e” przechodzące w krótkie „a” — „ea”. Trzy litery, jeden dźwięk.',
    listen: [
      { word: "hair", hasTarget: true, pl: "włosy", emoji: "💇" },
      { word: "log", hasTarget: false, pl: "kłoda", emoji: "🌳" },
      { word: "chair", hasTarget: true, pl: "krzesło", emoji: "💺" },
      { word: "man", hasTarget: false, pl: "mężczyzna", emoji: "🧑" },
      { word: "pair", hasTarget: true, pl: "para", emoji: "👯" },
      { word: "milk", hasTarget: false, pl: "mleko", emoji: "🥛" },
      { word: "fair", hasTarget: true, pl: "uczciwy", emoji: "⚖️" },
      { word: "mug", hasTarget: false, pl: "kubek", emoji: "🍺" },
    ],
    blend: [
      { word: "hair", graphemes: ["h", "air"], targetIndex: 1, pl: "włosy", emoji: "💇" },
      { word: "chair", graphemes: ["ch", "air"], targetIndex: 1, pl: "krzesło", emoji: "💺" },
      { word: "pair", graphemes: ["p", "air"], targetIndex: 1, pl: "para", emoji: "👯" },
      { word: "fair", graphemes: ["f", "air"], targetIndex: 1, pl: "uczciwy", emoji: "⚖️" },
      // Liczba pojedyncza: w "stairs" końcowe "s" brzmi /z/, a kafelek gra /s/.
      { word: "stair", graphemes: ["s", "t", "air"], targetIndex: 2, pl: "schodek", emoji: "⬆️" },
    ],
    choice: [
      { answer: "hair", options: ["hair", "chair", "pair"], pl: "włosy", emoji: "💇" },
      { answer: "chair", options: ["chair", "hair", "fair"], pl: "krzesło", emoji: "💺" },
      { answer: "pair", options: ["pair", "par", "pain"], pl: "para", emoji: "👯" },
      // "stares" odpadło: w brytyjskiej wymowie to dokładny homofon "stairs".
      { answer: "stairs", options: ["stairs", "stars", "starts"], pl: "schody", emoji: "⬆️" },
    ],
    redWords: ["we", "there"],
  },

  ir: {
    soundId: "ir",
    heroId: "spark",
    chant: "whirl and twirl!",
    parentIntro:
      'Coś pomiędzy polskim „e” a „y”, długie — jak zamyślone „yyy”. W brytyjskim „r” tu nie brzmi.',
    listen: [
      { word: "bird", hasTarget: true, pl: "ptak", emoji: "🐦" },
      { word: "net", hasTarget: false, pl: "siatka", emoji: "🥅" },
      { word: "girl", hasTarget: true, pl: "dziewczynka", emoji: "👧" },
      { word: "pen", hasTarget: false, pl: "długopis", emoji: "🖊️" },
      { word: "shirt", hasTarget: true, pl: "koszula", emoji: "👕" },
      { word: "pig", hasTarget: false, pl: "świnia", emoji: "🐷" },
      { word: "third", hasTarget: true, pl: "trzeci", emoji: "🥉" },
      { word: "plant", hasTarget: false, pl: "roślina", emoji: "🌱" },
    ],
    blend: [
      { word: "bird", graphemes: ["b", "ir", "d"], targetIndex: 1, pl: "ptak", emoji: "🐦" },
      { word: "girl", graphemes: ["g", "ir", "l"], targetIndex: 1, pl: "dziewczynka", emoji: "👧" },
      { word: "shirt", graphemes: ["sh", "ir", "t"], targetIndex: 1, pl: "koszula", emoji: "👕" },
      { word: "third", graphemes: ["th", "ir", "d"], targetIndex: 1, pl: "trzeci", emoji: "🥉" },
      { word: "first", graphemes: ["f", "ir", "s", "t"], targetIndex: 1, pl: "pierwszy", emoji: "🥇" },
    ],
    choice: [
      { answer: "bird", options: ["bird", "bind", "bard"], pl: "ptak", emoji: "🐦" },
      { answer: "girl", options: ["girl", "grill", "gill"], pl: "dziewczynka", emoji: "👧" },
      { answer: "shirt", options: ["shirt", "short", "shot"], pl: "koszula", emoji: "👕" },
      { answer: "first", options: ["first", "fist", "fast"], pl: "pierwszy", emoji: "🥇" },
    ],
    redWords: ["there", "her"],
  },

  ou: {
    soundId: "ou",
    heroId: "spark",
    chant: "shout it out!",
    parentIntro: 'Jak „ał” — dźwięk, który robisz, gdy się uderzysz. „Ouch!”',
    listen: [
      { word: "out", hasTarget: true, pl: "na zewnątrz", emoji: "🚪" },
      { word: "pot", hasTarget: false, pl: "garnek", emoji: "🍲" },
      { word: "cloud", hasTarget: true, pl: "chmura", emoji: "☁️" },
      { word: "rug", hasTarget: false, pl: "dywanik", emoji: "🧶" },
      { word: "mouth", hasTarget: true, pl: "usta", emoji: "👄" },
      { word: "sock", hasTarget: false, pl: "skarpetka", emoji: "🧦" },
      { word: "shout", hasTarget: true, pl: "krzyczeć", emoji: "📢" },
      { word: "sun", hasTarget: false, pl: "słońce", emoji: "☀️" },
    ],
    blend: [
      { word: "out", graphemes: ["ou", "t"], targetIndex: 0, pl: "na zewnątrz", emoji: "🚪" },
      { word: "cloud", graphemes: ["c", "l", "ou", "d"], targetIndex: 2, pl: "chmura", emoji: "☁️" },
      { word: "mouth", graphemes: ["m", "ou", "th"], targetIndex: 1, pl: "usta", emoji: "👄" },
      { word: "shout", graphemes: ["sh", "ou", "t"], targetIndex: 1, pl: "krzyczeć", emoji: "📢" },
      { word: "round", graphemes: ["r", "ou", "n", "d"], targetIndex: 1, pl: "okrągły", emoji: "⭕" },
    ],
    choice: [
      { answer: "cloud", options: ["cloud", "cold", "clod"], pl: "chmura", emoji: "☁️" },
      { answer: "mouth", options: ["mouth", "moth", "month"], pl: "usta", emoji: "👄" },
      { answer: "shout", options: ["shout", "short", "shot"], pl: "krzyczeć", emoji: "📢" },
      { answer: "round", options: ["round", "rod", "rind"], pl: "okrągły", emoji: "⭕" },
    ],
    redWords: ["her", "all"],
  },

  oy: {
    soundId: "oy",
    heroId: "spark",
    chant: "toy for a boy!",
    parentIntro: 'Jak polskie „oj”. Ostatni dźwięk z Set 2 — po nim cała dwunastka jest przerobiona!',
    listen: [
      { word: "boy", hasTarget: true, pl: "chłopiec", emoji: "👦" },
      { word: "tap", hasTarget: false, pl: "kran", emoji: "🚰" },
      { word: "toy", hasTarget: true, pl: "zabawka", emoji: "🧸" },
      { word: "top", hasTarget: false, pl: "góra", emoji: "🔝" },
      { word: "joy", hasTarget: true, pl: "radość", emoji: "😄" },
      { word: "truck", hasTarget: false, pl: "ciężarówka", emoji: "🚚" },
      { word: "enjoy", hasTarget: true, pl: "cieszyć się", emoji: "🎉" },
      { word: "van", hasTarget: false, pl: "furgonetka", emoji: "🚐" },
    ],
    blend: [
      { word: "boy", graphemes: ["b", "oy"], targetIndex: 1, pl: "chłopiec", emoji: "👦" },
      { word: "toy", graphemes: ["t", "oy"], targetIndex: 1, pl: "zabawka", emoji: "🧸" },
      { word: "joy", graphemes: ["j", "oy"], targetIndex: 1, pl: "radość", emoji: "😄" },
      { word: "enjoy", graphemes: ["e", "n", "j", "oy"], targetIndex: 3, pl: "cieszyć się", emoji: "🎉" },
    ],
    choice: [
      { answer: "boy", options: ["boy", "toy", "joy"], pl: "chłopiec", emoji: "👦" },
      { answer: "toy", options: ["toy", "top", "toe"], pl: "zabawka", emoji: "🧸" },
      { answer: "joy", options: ["joy", "jog", "jaw"], pl: "radość", emoji: "😄" },
      { answer: "enjoy", options: ["enjoy", "employ", "enjoys"], pl: "cieszyć się", emoji: "🎉" },
    ],
    redWords: ["all", "were"],
  },

  // --- Set 3 ---------------------------------------------------------------

  ea: {
    soundId: "ea",
    heroId: "spark",
    chant: "cup of tea!",
    parentIntro:
      'Długie „iii” — brzmi tak samo jak „ee” z Set 2, ale pisze się „ea”. To pierwszy raz, ' +
      "gdy dziecko widzi DWA zapisy tego samego dźwięku — powiedz to wprost, to nie pomyłka.",
    listen: [
      { word: "tea", hasTarget: true, pl: "herbata", emoji: "🍵" },
      { word: "web", hasTarget: false, pl: "pajęczyna", emoji: "🕸️" },
      { word: "sea", hasTarget: true, pl: "morze", emoji: "🌊" },
      { word: "zip", hasTarget: false, pl: "zamek", emoji: "🤐" },
      { word: "read", hasTarget: true, pl: "czytać", emoji: "📖" },
      { word: "bat", hasTarget: false, pl: "nietoperz", emoji: "🦇" },
      { word: "leaf", hasTarget: true, pl: "liść", emoji: "🍃" },
      { word: "bed", hasTarget: false, pl: "łóżko", emoji: "🛏️" },
    ],
    blend: [
      { word: "tea", graphemes: ["t", "ea"], targetIndex: 1, pl: "herbata", emoji: "🍵" },
      { word: "sea", graphemes: ["s", "ea"], targetIndex: 1, pl: "morze", emoji: "🌊" },
      { word: "eat", graphemes: ["ea", "t"], targetIndex: 0, pl: "jeść", emoji: "🍽️" },
      { word: "read", graphemes: ["r", "ea", "d"], targetIndex: 1, pl: "czytać", emoji: "📖" },
      { word: "leaf", graphemes: ["l", "ea", "f"], targetIndex: 1, pl: "liść", emoji: "🍃" },
    ],
    choice: [
      { answer: "tea", options: ["tea", "toe", "tie"], pl: "herbata", emoji: "🍵" },
      // "see" odpadło: homofon "sea" — zadanie nie miałoby jednej odpowiedzi.
      { answer: "sea", options: ["sea", "seed", "say"], pl: "morze", emoji: "🌊" },
      { answer: "read", options: ["read", "red", "road"], pl: "czytać", emoji: "📖" },
      { answer: "leaf", options: ["leaf", "loaf", "left"], pl: "liść", emoji: "🍃" },
    ],
    redWords: ["were", "do"],
  },

  oi: {
    soundId: "oi",
    heroId: "spark",
    chant: "spoil the boy!",
    parentIntro:
      'Jak polskie „oj” — ten sam dźwięk co „oy” z Set 2, ale w środku słowa pisze się „oi”. ' +
      "Zasada: „oi” w środku, „oy” na końcu.",
    listen: [
      { word: "oil", hasTarget: true, pl: "olej", emoji: "🛢️" },
      { word: "box", hasTarget: false, pl: "pudełko", emoji: "📦" },
      { word: "coin", hasTarget: true, pl: "moneta", emoji: "💰" },
      { word: "bus", hasTarget: false, pl: "autobus", emoji: "🚌" },
      { word: "boil", hasTarget: true, pl: "gotować się", emoji: "♨️" },
      { word: "cat", hasTarget: false, pl: "kot", emoji: "🐱" },
      { word: "join", hasTarget: true, pl: "dołączyć", emoji: "🤝" },
      { word: "clock", hasTarget: false, pl: "zegar", emoji: "🕐" },
    ],
    blend: [
      { word: "oil", graphemes: ["oi", "l"], targetIndex: 0, pl: "olej", emoji: "🛢️" },
      { word: "boil", graphemes: ["b", "oi", "l"], targetIndex: 1, pl: "gotować się", emoji: "♨️" },
      { word: "soil", graphemes: ["s", "oi", "l"], targetIndex: 1, pl: "gleba", emoji: "🌱" },
      { word: "coin", graphemes: ["c", "oi", "n"], targetIndex: 1, pl: "moneta", emoji: "💰" },
      { word: "join", graphemes: ["j", "oi", "n"], targetIndex: 1, pl: "dołączyć", emoji: "🤝" },
    ],
    choice: [
      { answer: "coin", options: ["coin", "corn", "cone"], pl: "moneta", emoji: "💰" },
      { answer: "oil", options: ["oil", "owl", "all"], pl: "olej", emoji: "🛢️" },
      { answer: "boil", options: ["boil", "ball", "bowl"], pl: "gotować się", emoji: "♨️" },
      { answer: "join", options: ["join", "jam", "jog"], pl: "dołączyć", emoji: "🤝" },
    ],
    redWords: ["do", "what"],
  },

  "a-e": {
    soundId: "a-e",
    heroId: "gleam",
    chant: "make a cake!",
    parentIntro:
      'Czarodziejskie „e”! Stoi na końcu słowa, samo nie brzmi, ale zmienia „a” w środku na ' +
      '„ej”: „cak” → „cake”. Pokaż na parze słów: „can” vs „cane”. To wielki moment w nauce.',
    listen: [
      { word: "cake", hasTarget: true, pl: "ciasto", emoji: "🎂" },
      { word: "cup", hasTarget: false, pl: "kubek", emoji: "☕" },
      { word: "lake", hasTarget: true, pl: "jezioro", emoji: "🏞️" },
      { word: "desk", hasTarget: false, pl: "biurko", emoji: "📚" },
      { word: "gate", hasTarget: true, pl: "brama", emoji: "🚪" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
      { word: "snake", hasTarget: true, pl: "wąż", emoji: "🐍" },
      { word: "doll", hasTarget: false, pl: "lalka", emoji: "🎎" },
    ],
    blend: [
      { word: "cake", graphemes: ["c", "a-e", "k"], targetIndex: 1, pl: "ciasto", emoji: "🎂" },
      { word: "lake", graphemes: ["l", "a-e", "k"], targetIndex: 1, pl: "jezioro", emoji: "🏞️" },
      { word: "gate", graphemes: ["g", "a-e", "t"], targetIndex: 1, pl: "brama", emoji: "🚪" },
      { word: "name", graphemes: ["n", "a-e", "m"], targetIndex: 1, pl: "imię", emoji: "📛" },
      { word: "game", graphemes: ["g", "a-e", "m"], targetIndex: 1, pl: "gra", emoji: "🎮" },
    ],
    choice: [
      { answer: "cake", options: ["cake", "cat", "kick"], pl: "ciasto", emoji: "🎂" },
      { answer: "snake", options: ["snake", "snack", "shake"], pl: "wąż", emoji: "🐍" },
      { answer: "gate", options: ["gate", "get", "goat"], pl: "brama", emoji: "🚪" },
      { answer: "name", options: ["name", "game", "nine"], pl: "imię", emoji: "📛" },
    ],
    redWords: ["what", "come"],
  },

  "i-e": {
    soundId: "i-e",
    heroId: "gleam",
    chant: "nice smile!",
    parentIntro:
      'Znowu czarodziejskie „e” — tym razem zmienia „i” na „aj”: „bit” → „bite”. ' +
      'Ten sam dźwięk co „igh”, trzeci zapis „aj” w kolekcji dziecka.',
    listen: [
      { word: "smile", hasTarget: true, pl: "uśmiech", emoji: "😊" },
      { word: "duck", hasTarget: false, pl: "kaczka", emoji: "🦆" },
      { word: "time", hasTarget: true, pl: "czas", emoji: "⏰" },
      { word: "fox", hasTarget: false, pl: "lis", emoji: "🦊" },
      { word: "bike", hasTarget: true, pl: "rower", emoji: "🚲" },
      { word: "frog", hasTarget: false, pl: "żaba", emoji: "🐸" },
      { word: "five", hasTarget: true, pl: "pięć", emoji: "5️⃣" },
      { word: "hat", hasTarget: false, pl: "czapka", emoji: "🎩" },
    ],
    blend: [
      { word: "time", graphemes: ["t", "i-e", "m"], targetIndex: 1, pl: "czas", emoji: "⏰" },
      { word: "bike", graphemes: ["b", "i-e", "k"], targetIndex: 1, pl: "rower", emoji: "🚲" },
      { word: "five", graphemes: ["f", "i-e", "v"], targetIndex: 1, pl: "pięć", emoji: "5️⃣" },
      { word: "nine", graphemes: ["n", "i-e", "n"], targetIndex: 1, pl: "dziewięć", emoji: "9️⃣" },
      { word: "smile", graphemes: ["s", "m", "i-e", "l"], targetIndex: 2, pl: "uśmiech", emoji: "😊" },
    ],
    choice: [
      { answer: "smile", options: ["smile", "small", "mile"], pl: "uśmiech", emoji: "😊" },
      { answer: "bike", options: ["bike", "back", "beak"], pl: "rower", emoji: "🚲" },
      { answer: "five", options: ["five", "fine", "fun"], pl: "pięć", emoji: "5️⃣" },
      { answer: "time", options: ["time", "team", "tame"], pl: "czas", emoji: "⏰" },
    ],
    redWords: ["come", "some"],
  },

  "o-e": {
    soundId: "o-e",
    heroId: "gleam",
    chant: "phone home!",
    parentIntro:
      'Czarodziejskie „e” zmienia „o” na „oł”: „hop” → „hope”. Ten sam dźwięk co „ow” z „blow”.',
    listen: [
      { word: "home", hasTarget: true, pl: "dom", emoji: "🏠" },
      { word: "hen", hasTarget: false, pl: "kura", emoji: "🐔" },
      { word: "bone", hasTarget: true, pl: "kość", emoji: "🦴" },
      { word: "jam", hasTarget: false, pl: "dżem", emoji: "🍓" },
      { word: "nose", hasTarget: true, pl: "nos", emoji: "👃" },
      { word: "kid", hasTarget: false, pl: "dzieciak", emoji: "🧒" },
      { word: "rope", hasTarget: true, pl: "lina", emoji: "➰" },
      { word: "lamp", hasTarget: false, pl: "lampa", emoji: "💡" },
    ],
    blend: [
      { word: "home", graphemes: ["h", "o-e", "m"], targetIndex: 1, pl: "dom", emoji: "🏠" },
      { word: "bone", graphemes: ["b", "o-e", "n"], targetIndex: 1, pl: "kość", emoji: "🦴" },
      { word: "rope", graphemes: ["r", "o-e", "p"], targetIndex: 1, pl: "lina", emoji: "➰" },
      { word: "note", graphemes: ["n", "o-e", "t"], targetIndex: 1, pl: "notatka", emoji: "📝" },
      { word: "stone", graphemes: ["s", "t", "o-e", "n"], targetIndex: 2, pl: "kamień", emoji: "🗿" },
    ],
    choice: [
      { answer: "home", options: ["home", "ham", "hum"], pl: "dom", emoji: "🏠" },
      { answer: "bone", options: ["bone", "bin", "ban"], pl: "kość", emoji: "🦴" },
      { answer: "nose", options: ["nose", "nice", "noise"], pl: "nos", emoji: "👃" },
      { answer: "stone", options: ["stone", "stun", "stop"], pl: "kamień", emoji: "🗿" },
    ],
    redWords: ["some", "who"],
  },

  "u-e": {
    soundId: "u-e",
    heroId: "gleam",
    chant: "huge brute!",
    parentIntro:
      'Czarodziejskie „e” zmienia „u” na „ju”: „cub” → „cube”. Ostatnie z czterech ' +
      "czarodziejskich „e” — dziecko zna już cały mechanizm.",
    listen: [
      { word: "huge", hasTarget: true, pl: "ogromny", emoji: "🐘" },
      { word: "leg", hasTarget: false, pl: "noga", emoji: "🦵" },
      { word: "cube", hasTarget: true, pl: "kostka", emoji: "🎲" },
      { word: "log", hasTarget: false, pl: "kłoda", emoji: "🌳" },
      { word: "tube", hasTarget: true, pl: "rurka", emoji: "🧪" },
      { word: "man", hasTarget: false, pl: "mężczyzna", emoji: "🧑" },
      { word: "cute", hasTarget: true, pl: "słodki", emoji: "🐰" },
      { word: "milk", hasTarget: false, pl: "mleko", emoji: "🥛" },
    ],
    blend: [
      { word: "cube", graphemes: ["c", "u-e", "b"], targetIndex: 1, pl: "kostka", emoji: "🎲" },
      { word: "tube", graphemes: ["t", "u-e", "b"], targetIndex: 1, pl: "rurka", emoji: "🧪" },
      { word: "cute", graphemes: ["c", "u-e", "t"], targetIndex: 1, pl: "słodki", emoji: "🐰" },
      { word: "tune", graphemes: ["t", "u-e", "n"], targetIndex: 1, pl: "melodia", emoji: "🎵" },
    ],
    choice: [
      { answer: "cube", options: ["cube", "cub", "cab"], pl: "kostka", emoji: "🎲" },
      { answer: "cute", options: ["cute", "cut", "cat"], pl: "słodki", emoji: "🐰" },
      { answer: "huge", options: ["huge", "hug", "hedge"], pl: "ogromny", emoji: "🐘" },
      { answer: "tube", options: ["tube", "tub", "tab"], pl: "rurka", emoji: "🧪" },
    ],
    redWords: ["who", "no"],
  },

  aw: {
    soundId: "aw",
    heroId: "flame",
    chant: "yawn at dawn!",
    parentIntro:
      'Długie „ooo” — dokładnie ten sam dźwięk co „or” z Set 2, kolejny drugi zapis. ' +
      "Usta zaokrąglone, jak przy zachwycie „ooo!”.",
    listen: [
      { word: "saw", hasTarget: true, pl: "piła", emoji: "🧰" },
      { word: "mug", hasTarget: false, pl: "kubek", emoji: "🍺" },
      { word: "paw", hasTarget: true, pl: "łapa", emoji: "🐾" },
      { word: "net", hasTarget: false, pl: "siatka", emoji: "🥅" },
      { word: "draw", hasTarget: true, pl: "rysować", emoji: "🎨" },
      { word: "pen", hasTarget: false, pl: "długopis", emoji: "🖊️" },
      { word: "yawn", hasTarget: true, pl: "ziewać", emoji: "😪" },
      { word: "pig", hasTarget: false, pl: "świnia", emoji: "🐷" },
    ],
    blend: [
      { word: "saw", graphemes: ["s", "aw"], targetIndex: 1, pl: "piła", emoji: "🧰" },
      { word: "paw", graphemes: ["p", "aw"], targetIndex: 1, pl: "łapa", emoji: "🐾" },
      { word: "draw", graphemes: ["d", "r", "aw"], targetIndex: 2, pl: "rysować", emoji: "🎨" },
      { word: "claw", graphemes: ["c", "l", "aw"], targetIndex: 2, pl: "szczypce", emoji: "🦀" },
      { word: "yawn", graphemes: ["y", "aw", "n"], targetIndex: 1, pl: "ziewać", emoji: "😪" },
    ],
    choice: [
      { answer: "paw", options: ["paw", "pow", "pea"], pl: "łapa", emoji: "🐾" },
      // "drew" i "door" wymagały dźwięków spoza tego etapu. Wspólny nagłos "dr"
      // zostaje, więc dziecko rozróżnia po samej samogłosce: /ɔː/ vs /ɒ/ vs /ʌ/.
      { answer: "draw", options: ["draw", "drop", "drum"], pl: "rysować", emoji: "🎨" },
      { answer: "claw", options: ["claw", "clay", "crow"], pl: "szczypce", emoji: "🦀" },
      { answer: "yawn", options: ["yawn", "yarn", "lawn"], pl: "ziewać", emoji: "😪" },
    ],
    redWords: ["no", "go"],
  },

  are: {
    soundId: "are",
    heroId: "flame",
    chant: "share and care!",
    parentIntro:
      'Brzmi jak „ea” — ten sam dźwięk co „air” z Set 2. Uwaga: słowo „are” (jesteśmy) ' +
      "to red word i czyta się inaczej — „ar”!",
    listen: [
      { word: "share", hasTarget: true, pl: "dzielić się", emoji: "🤲" },
      { word: "plant", hasTarget: false, pl: "roślina", emoji: "🌱" },
      { word: "care", hasTarget: true, pl: "opiekować się", emoji: "❤️" },
      { word: "pot", hasTarget: false, pl: "garnek", emoji: "🍲" },
      { word: "scare", hasTarget: true, pl: "straszyć", emoji: "👻" },
      { word: "rug", hasTarget: false, pl: "dywanik", emoji: "🧶" },
      { word: "hare", hasTarget: true, pl: "zając", emoji: "🐇" },
      { word: "sock", hasTarget: false, pl: "skarpetka", emoji: "🧦" },
    ],
    blend: [
      { word: "care", graphemes: ["c", "are"], targetIndex: 1, pl: "opiekować się", emoji: "❤️" },
      { word: "dare", graphemes: ["d", "are"], targetIndex: 1, pl: "odważyć się", emoji: "💪" },
      { word: "share", graphemes: ["sh", "are"], targetIndex: 1, pl: "dzielić się", emoji: "🤲" },
      { word: "hare", graphemes: ["h", "are"], targetIndex: 1, pl: "zając", emoji: "🐇" },
      { word: "scare", graphemes: ["s", "c", "are"], targetIndex: 2, pl: "straszyć", emoji: "👻" },
    ],
    choice: [
      { answer: "share", options: ["share", "shore", "sharp"], pl: "dzielić się", emoji: "🤲" },
      // "hair" odpadło (homofon "hare"), "here" też (grafem "ere" spoza programu).
      { answer: "hare", options: ["hare", "harm", "horn"], pl: "zając", emoji: "🐇" },
      { answer: "scare", options: ["scare", "score", "stare"], pl: "straszyć", emoji: "👻" },
      { answer: "care", options: ["care", "car", "core"], pl: "opiekować się", emoji: "❤️" },
    ],
    redWords: ["go", "so"],
  },

  ur: {
    soundId: "ur",
    heroId: "flame",
    chant: "nurse with a purse!",
    parentIntro:
      'Ten sam dźwięk co „ir” z „bird” — trzeci zapis „yyy”. Dziecko może już samo zauważyć ' +
      "wzór: angielski lubi zapisywać jeden dźwięk na kilka sposobów.",
    listen: [
      { word: "hurt", hasTarget: true, pl: "boleć", emoji: "🤕" },
      { word: "sun", hasTarget: false, pl: "słońce", emoji: "☀️" },
      { word: "burn", hasTarget: true, pl: "palić się", emoji: "🔥" },
      { word: "tap", hasTarget: false, pl: "kran", emoji: "🚰" },
      { word: "turn", hasTarget: true, pl: "skręcać", emoji: "🔄" },
      { word: "top", hasTarget: false, pl: "góra", emoji: "🔝" },
      { word: "purse", hasTarget: true, pl: "portmonetka", emoji: "👛" },
      { word: "truck", hasTarget: false, pl: "ciężarówka", emoji: "🚚" },
    ],
    blend: [
      { word: "burn", graphemes: ["b", "ur", "n"], targetIndex: 1, pl: "palić się", emoji: "🔥" },
      { word: "turn", graphemes: ["t", "ur", "n"], targetIndex: 1, pl: "skręcać", emoji: "🔄" },
      { word: "hurt", graphemes: ["h", "ur", "t"], targetIndex: 1, pl: "boleć", emoji: "🤕" },
      { word: "curl", graphemes: ["c", "ur", "l"], targetIndex: 1, pl: "lok", emoji: "🌀" },
      { word: "surf", graphemes: ["s", "ur", "f"], targetIndex: 1, pl: "surfować", emoji: "🏄" },
    ],
    choice: [
      { answer: "burn", options: ["burn", "barn", "born"], pl: "palić się", emoji: "🔥" },
      { answer: "turn", options: ["turn", "torn", "ten"], pl: "skręcać", emoji: "🔄" },
      { answer: "hurt", options: ["hurt", "heart", "hat"], pl: "boleć", emoji: "🤕" },
      { answer: "curl", options: ["curl", "call", "cool"], pl: "lok", emoji: "🌀" },
    ],
    redWords: ["so", "my"],
  },

  er: {
    soundId: "er",
    heroId: "burn",
    chant: "a better letter!",
    parentIntro:
      'Krótkie, ciche „e” na końcu dłuższych słów: let-ter, din-ner. To pierwsze lekcje ' +
      "z DWUSYLABOWYMI słowami — klaskajcie sylaby przed sklejaniem!",
    listen: [
      // Negatywy TEŻ dwusylabowe. Z jednosylabowymi ("van", "zip") zadanie dawało
      // się rozwiązać w 100% licząc sylaby, bez wsłuchiwania się w końcówkę.
      { word: "letter", hasTarget: true, pl: "list", emoji: "✉️" },
      { word: "rabbit", hasTarget: false, pl: "królik", emoji: "🐰" },
      { word: "dinner", hasTarget: true, pl: "kolacja", emoji: "🍽️" },
      { word: "apple", hasTarget: false, pl: "jabłko", emoji: "🍎" },
      { word: "summer", hasTarget: true, pl: "lato", emoji: "🌞" },
      { word: "monkey", hasTarget: false, pl: "małpa", emoji: "🐒" },
      { word: "winter", hasTarget: true, pl: "zima", emoji: "⛄" },
      { word: "basket", hasTarget: false, pl: "koszyk", emoji: "🧺" },
    ],
    blend: [
      { word: "letter", graphemes: ["l", "e", "tt", "er"], targetIndex: 3, pl: "list", emoji: "✉️" },
      { word: "dinner", graphemes: ["d", "i", "nn", "er"], targetIndex: 3, pl: "kolacja", emoji: "🍽️" },
      { word: "summer", graphemes: ["s", "u", "mm", "er"], targetIndex: 3, pl: "lato", emoji: "🌞" },
      { word: "winter", graphemes: ["w", "i", "n", "t", "er"], targetIndex: 4, pl: "zima", emoji: "⛄" },
      { word: "corner", graphemes: ["c", "or", "n", "er"], targetIndex: 3, pl: "róg", emoji: "📐" },
    ],
    choice: [
      { answer: "letter", options: ["letter", "ladder", "litter"], pl: "list", emoji: "✉️" },
      // "diner" odpadło: różni się od "dinner" pierwszą samogłoską (/ɪ/ vs /aɪ/),
      // a nie ćwiczonym "er" — zadanie nie uczyło tego, co miało.
      { answer: "dinner", options: ["dinner", "corner", "winner"], pl: "kolacja", emoji: "🍽️" },
      { answer: "summer", options: ["summer", "simmer", "super"], pl: "lato", emoji: "🌞" },
      { answer: "winter", options: ["winter", "winner", "water"], pl: "zima", emoji: "⛄" },
    ],
    redWords: ["my", "by"],
  },

  "ow-brown": {
    soundId: "ow-brown",
    heroId: "burn",
    chant: "brown cow!",
    parentIntro:
      'Te same litery „ow”, ale dźwięk „ał” — jak w „brown”. Zestaw z „blow” z Set 2: ' +
      '„snow” (oł) kontra „cow” (ał). Które jak brzmi, mówi słowo, nie zapis — trzeba osłuchać.',
    listen: [
      { word: "cow", hasTarget: true, pl: "krowa", emoji: "🐄" },
      { word: "bed", hasTarget: false, pl: "łóżko", emoji: "🛏️" },
      { word: "brown", hasTarget: true, pl: "brązowy", emoji: "🐻" },
      { word: "box", hasTarget: false, pl: "pudełko", emoji: "📦" },
      { word: "owl", hasTarget: true, pl: "sowa", emoji: "🦉" },
      { word: "bus", hasTarget: false, pl: "autobus", emoji: "🚌" },
      { word: "clown", hasTarget: true, pl: "klaun", emoji: "🤡" },
      { word: "cat", hasTarget: false, pl: "kot", emoji: "🐱" },
    ],
    blend: [
      { word: "cow", graphemes: ["c", "ow"], targetIndex: 1, pl: "krowa", emoji: "🐄" },
      { word: "owl", graphemes: ["ow", "l"], targetIndex: 0, pl: "sowa", emoji: "🦉" },
      { word: "down", graphemes: ["d", "ow", "n"], targetIndex: 1, pl: "w dół", emoji: "⬇️" },
      { word: "town", graphemes: ["t", "ow", "n"], targetIndex: 1, pl: "miasteczko", emoji: "🏘️" },
      { word: "brown", graphemes: ["b", "r", "ow", "n"], targetIndex: 2, pl: "brązowy", emoji: "🐻" },
    ],
    choice: [
      { answer: "cow", options: ["cow", "crow", "car"], pl: "krowa", emoji: "🐄" },
      { answer: "owl", options: ["owl", "oil", "old"], pl: "sowa", emoji: "🦉" },
      { answer: "brown", options: ["brown", "blow", "crown"], pl: "brązowy", emoji: "🐻" },
      { answer: "clown", options: ["clown", "crown", "cloud"], pl: "klaun", emoji: "🤡" },
    ],
    redWords: ["by", "the"],
  },

  ai: {
    soundId: "ai",
    heroId: "burn",
    chant: "snail in the rain!",
    parentIntro:
      'Znów „ej” — jak „ay” i „a-e”, trzeci zapis. Zasada z grubsza: „ai” w środku słowa, ' +
      '„ay” na końcu.',
    listen: [
      { word: "rain", hasTarget: true, pl: "deszcz", emoji: "🌧️" },
      { word: "clock", hasTarget: false, pl: "zegar", emoji: "🕐" },
      { word: "snail", hasTarget: true, pl: "ślimak", emoji: "🐌" },
      { word: "cup", hasTarget: false, pl: "kubek", emoji: "☕" },
      { word: "train", hasTarget: true, pl: "pociąg", emoji: "🚂" },
      { word: "desk", hasTarget: false, pl: "biurko", emoji: "📚" },
      // Było "tail" z emoji całego psa — a w tej samej lekcji "dog 🐶" jest
      // przykładem NIE. Dziecko widziało dwa niemal identyczne psy o różnym opisie.
      { word: "chain", hasTarget: true, pl: "łańcuch", emoji: "⛓️" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
    ],
    blend: [
      { word: "rain", graphemes: ["r", "ai", "n"], targetIndex: 1, pl: "deszcz", emoji: "🌧️" },
      { word: "chain", graphemes: ["ch", "ai", "n"], targetIndex: 1, pl: "łańcuch", emoji: "⛓️" },
      { word: "snail", graphemes: ["s", "n", "ai", "l"], targetIndex: 2, pl: "ślimak", emoji: "🐌" },
      { word: "train", graphemes: ["t", "r", "ai", "n"], targetIndex: 2, pl: "pociąg", emoji: "🚂" },
      { word: "paint", graphemes: ["p", "ai", "n", "t"], targetIndex: 1, pl: "malować", emoji: "🖌️" },
    ],
    choice: [
      // "rein" odpadło: homofon "rain". "rail" zawiera ćwiczone "ai".
      { answer: "rain", options: ["rain", "ran", "rail"], pl: "deszcz", emoji: "🌧️" },
      { answer: "train", options: ["train", "tray", "brain"], pl: "pociąg", emoji: "🚂" },
      { answer: "snail", options: ["snail", "nail", "sail"], pl: "ślimak", emoji: "🐌" },
      { answer: "paint", options: ["paint", "pant", "point"], pl: "malować", emoji: "🖌️" },
    ],
    redWords: ["put", "very"],
  },

  oa: {
    soundId: "oa",
    heroId: "burn",
    chant: "goat in a boat!",
    parentIntro: 'Jeszcze jedno „oł” — jak „ow” z „blow” i „o-e” z „home”. Zapis „oa”, np. „goat”.',
    listen: [
      { word: "goat", hasTarget: true, pl: "koza", emoji: "🐐" },
      { word: "doll", hasTarget: false, pl: "lalka", emoji: "🎎" },
      { word: "boat", hasTarget: true, pl: "łódka", emoji: "⛵" },
      { word: "duck", hasTarget: false, pl: "kaczka", emoji: "🦆" },
      { word: "coat", hasTarget: true, pl: "płaszcz", emoji: "🧥" },
      { word: "fox", hasTarget: false, pl: "lis", emoji: "🦊" },
      { word: "road", hasTarget: true, pl: "droga", emoji: "🛣️" },
      { word: "frog", hasTarget: false, pl: "żaba", emoji: "🐸" },
    ],
    blend: [
      { word: "goat", graphemes: ["g", "oa", "t"], targetIndex: 1, pl: "koza", emoji: "🐐" },
      { word: "boat", graphemes: ["b", "oa", "t"], targetIndex: 1, pl: "łódka", emoji: "⛵" },
      { word: "coat", graphemes: ["c", "oa", "t"], targetIndex: 1, pl: "płaszcz", emoji: "🧥" },
      { word: "road", graphemes: ["r", "oa", "d"], targetIndex: 1, pl: "droga", emoji: "🛣️" },
      { word: "soap", graphemes: ["s", "oa", "p"], targetIndex: 1, pl: "mydło", emoji: "🧼" },
    ],
    choice: [
      { answer: "goat", options: ["goat", "gate", "got"], pl: "koza", emoji: "🐐" },
      { answer: "boat", options: ["boat", "bat", "boot"], pl: "łódka", emoji: "⛵" },
      { answer: "coat", options: ["coat", "cot", "cat"], pl: "płaszcz", emoji: "🧥" },
      { answer: "soap", options: ["soap", "soup", "sap"], pl: "mydło", emoji: "🧼" },
    ],
    redWords: ["very", "any"],
  },

  ew: {
    soundId: "ew",
    heroId: "burn",
    chant: "chew the stew!",
    parentIntro:
      'Długie „uu” jak „oo” z „zoo”, zapis „ew”: „chew”, „flew”, „grew”. Uwaga: po „n”, ' +
      '„st” i „f” Brytyjczycy dodają „j” — „new” = „nju”, „stew” = „stju”, „few” = „fju”. ' +
      'Samo „nu” to wymowa amerykańska.',
    listen: [
      { word: "new", hasTarget: true, pl: "nowy", emoji: "✨" },
      { word: "hat", hasTarget: false, pl: "czapka", emoji: "🎩" },
      { word: "chew", hasTarget: true, pl: "żuć", emoji: "🍬" },
      { word: "hen", hasTarget: false, pl: "kura", emoji: "🐔" },
      { word: "flew", hasTarget: true, pl: "poleciał", emoji: "🕊️" },
      { word: "jam", hasTarget: false, pl: "dżem", emoji: "🍓" },
      { word: "stew", hasTarget: true, pl: "gulasz", emoji: "🍲" },
      { word: "kid", hasTarget: false, pl: "dzieciak", emoji: "🧒" },
    ],
    blend: [
      // Kafelek "ew" gra /uː/. Odpadły "new" i "stew": po "n" i "st" brytyjskie
      // nagranie dokłada jotę (/njuː/, /stjuː/), więc sklejenie n + /uː/ dałoby
      // amerykańskie „nuu" — dokładnie to, przed czym ostrzega wskazówka wyżej.
      // Oba zostają w słuchaniu i wyborze, gdzie gra całe nagranie.
      { word: "chew", graphemes: ["ch", "ew"], targetIndex: 1, pl: "żuć", emoji: "🍬" },
      { word: "flew", graphemes: ["f", "l", "ew"], targetIndex: 2, pl: "poleciał", emoji: "🕊️" },
      { word: "grew", graphemes: ["g", "r", "ew"], targetIndex: 2, pl: "urósł", emoji: "🌱" },
      { word: "drew", graphemes: ["d", "r", "ew"], targetIndex: 2, pl: "narysował", emoji: "🖍️" },
    ],
    choice: [
      { answer: "new", options: ["new", "now", "nose"], pl: "nowy", emoji: "✨" },
      { answer: "chew", options: ["chew", "chop", "cheek"], pl: "żuć", emoji: "🍬" },
      { answer: "flew", options: ["flew", "flow", "few"], pl: "poleciał", emoji: "🕊️" },
      { answer: "grew", options: ["grew", "grow", "green"], pl: "urósł", emoji: "🌱" },
    ],
    redWords: ["any", "many"],
  },

  ire: {
    soundId: "ire",
    heroId: "burn",
    chant: "fire, fire!",
    parentIntro: '„Aj-e” — dwa dźwięki płynnie połączone: „fire” = „fa-je”. Trzy litery razem.',
    listen: [
      { word: "fire", hasTarget: true, pl: "ogień", emoji: "🔥" },
      { word: "lamp", hasTarget: false, pl: "lampa", emoji: "💡" },
      { word: "wire", hasTarget: true, pl: "kabel", emoji: "🔌" },
      { word: "leg", hasTarget: false, pl: "noga", emoji: "🦵" },
      { word: "tired", hasTarget: true, pl: "zmęczony", emoji: "😴" },
      { word: "log", hasTarget: false, pl: "kłoda", emoji: "🌳" },
      { word: "hire", hasTarget: true, pl: "wynająć", emoji: "💼" },
      { word: "man", hasTarget: false, pl: "mężczyzna", emoji: "🧑" },
    ],
    blend: [
      { word: "fire", graphemes: ["f", "ire"], targetIndex: 1, pl: "ogień", emoji: "🔥" },
      { word: "wire", graphemes: ["w", "ire"], targetIndex: 1, pl: "kabel", emoji: "🔌" },
      { word: "hire", graphemes: ["h", "ire"], targetIndex: 1, pl: "wynająć", emoji: "💼" },
      { word: "tired", graphemes: ["t", "ire", "d"], targetIndex: 1, pl: "zmęczony", emoji: "😴" },
    ],
    choice: [
      { answer: "fire", options: ["fire", "fair", "far"], pl: "ogień", emoji: "🔥" },
      { answer: "wire", options: ["wire", "wore", "wear"], pl: "kabel", emoji: "🔌" },
      { answer: "tired", options: ["tired", "tried", "tore"], pl: "zmęczony", emoji: "😴" },
      { answer: "hire", options: ["hire", "hare", "here"], pl: "wynająć", emoji: "💼" },
    ],
    redWords: ["many", "would"],
  },

  ear: {
    soundId: "ear",
    heroId: "burn",
    chant: "hear with your ear!",
    parentIntro:
      '„I-je” — jak w „hear”. Samo słowo „ear” (ucho) też tak brzmi — łatwo zapamiętać: ' +
      "słuchamy uchem.",
    listen: [
      { word: "hear", hasTarget: true, pl: "słyszeć", emoji: "👂" },
      { word: "milk", hasTarget: false, pl: "mleko", emoji: "🥛" },
      { word: "year", hasTarget: true, pl: "rok", emoji: "📅" },
      { word: "mug", hasTarget: false, pl: "kubek", emoji: "🍺" },
      { word: "near", hasTarget: true, pl: "blisko", emoji: "📍" },
      { word: "net", hasTarget: false, pl: "siatka", emoji: "🥅" },
      { word: "beard", hasTarget: true, pl: "broda", emoji: "🧔" },
      { word: "pen", hasTarget: false, pl: "długopis", emoji: "🖊️" },
    ],
    blend: [
      { word: "hear", graphemes: ["h", "ear"], targetIndex: 1, pl: "słyszeć", emoji: "👂" },
      { word: "year", graphemes: ["y", "ear"], targetIndex: 1, pl: "rok", emoji: "📅" },
      { word: "near", graphemes: ["n", "ear"], targetIndex: 1, pl: "blisko", emoji: "📍" },
      { word: "fear", graphemes: ["f", "ear"], targetIndex: 1, pl: "strach", emoji: "😨" },
      { word: "beard", graphemes: ["b", "ear", "d"], targetIndex: 1, pl: "broda", emoji: "🧔" },
    ],
    choice: [
      { answer: "hear", options: ["hear", "hair", "her"], pl: "słyszeć", emoji: "👂" },
      { answer: "year", options: ["year", "your", "yes"], pl: "rok", emoji: "📅" },
      { answer: "near", options: ["near", "never", "nor"], pl: "blisko", emoji: "📍" },
      { answer: "beard", options: ["beard", "bird", "board"], pl: "broda", emoji: "🧔" },
    ],
    redWords: ["would", "should"],
  },

  ure: {
    soundId: "ure",
    heroId: "burn",
    chant: "sure it's pure!",
    parentIntro:
      'Ostatni dźwięk całego programu! „ure” brzmi „jue” — jak w „pure” i „cure”. ' +
      'Uwaga na „sure”: tam „ju” znika i całość brzmi „szua”, a „s” czyta się jak „sz” — ' +
      'to wyjątek, powiedz dziecku wprost, że „sure” czyta się w całości.',
    listen: [
      { word: "sure", hasTarget: true, pl: "pewny", emoji: "✔️" },
      { word: "pig", hasTarget: false, pl: "świnia", emoji: "🐷" },
      { word: "pure", hasTarget: true, pl: "czysty", emoji: "💧" },
      { word: "plant", hasTarget: false, pl: "roślina", emoji: "🌱" },
      { word: "cure", hasTarget: true, pl: "lekarstwo", emoji: "💊" },
      { word: "pot", hasTarget: false, pl: "garnek", emoji: "🍲" },
      // "picture" celowo NIE: końcówka -ture brzmi "czə", nie "jʊə" — to dobry
      // dystraktor uczący, że nie każdy zapis "ure" to ten dźwięk.
      { word: "picture", hasTarget: false, pl: "obrazek", emoji: "🖼️" },
      { word: "rug", hasTarget: false, pl: "dywanik", emoji: "🧶" },
    ],
    blend: [
      { word: "pure", graphemes: ["p", "ure"], targetIndex: 1, pl: "czysty", emoji: "💧" },
      { word: "cure", graphemes: ["c", "ure"], targetIndex: 1, pl: "lekarstwo", emoji: "💊" },
      { word: "lure", graphemes: ["l", "ure"], targetIndex: 1, pl: "przynęta", emoji: "🎣" },
    ],
    choice: [
      { answer: "sure", options: ["sure", "sore", "sun"], pl: "pewny", emoji: "✔️" },
      { answer: "pure", options: ["pure", "poor", "pair"], pl: "czysty", emoji: "💧" },
      { answer: "cure", options: ["cure", "care", "core"], pl: "lekarstwo", emoji: "💊" },
      { answer: "picture", options: ["picture", "pitcher", "pasture"], pl: "obrazek", emoji: "🖼️" },
    ],
    redWords: ["should", "put"],
  },
};

export function getLesson(soundId: string): Lesson | undefined {
  return LESSONS[soundId];
}

export function hasLesson(soundId: string): boolean {
  return soundId in LESSONS;
}

/**
 * Wszystkie red words programu — pula dystraktorów dla ćwiczenia rozpoznawania.
 * Dystraktorem red worda jest inny red word: wszystkie czyta się w całości,
 * więc wybór naprawdę sprawdza pamięć wzrokową, a nie technikę sklejania.
 */
export function allRedWords(): string[] {
  const words = new Set<string>();
  for (const lesson of Object.values(LESSONS)) {
    lesson.redWords.forEach((word) => words.add(word));
  }
  return [...words].sort();
}

/** Ile pytań ma sesja — potrzebne do paska postępu i do statystyk. */
export function lessonLength(lesson: Lesson): number {
  return lesson.listen.length + lesson.blend.length + lesson.choice.length;
}

/**
 * Wszystkie słowa występujące w przygotowanych lekcjach.
 * Jedno źródło prawdy dla generatora nagrań i dla panelu rodzica.
 */
export function lessonWords(): string[] {
  const words = new Set<string>();
  for (const lesson of Object.values(LESSONS)) {
    lesson.listen.forEach((item) => words.add(item.word));
    lesson.blend.forEach((card) => words.add(card.word));
    lesson.choice.forEach((round) => round.options.forEach((option) => words.add(option)));
    lesson.redWords.forEach((word) => words.add(word));
  }
  return [...words].sort();
}

/**
 * Zamienia napis na kafelku na identyfikator dźwięku do odtworzenia.
 *
 * Problem, który to rozwiązuje: „oo” brzmi inaczej w „zoo” (długie) i w „look”
 * (krótkie), a „ow” inaczej w „blow” i w „brown” — napis na kafelku jest ten
 * sam, dźwięk nie. Gdy kafelek pokazuje grafem ćwiczonego dźwięku, gra plik
 * wariantu tej lekcji (np. `oo-zoo`); pozostałe kafelki grają dosłownie.
 */
export function chipSoundId(grapheme: string, soundId: string): string {
  const target = getSound(soundId);
  return target && grapheme === target.grapheme ? soundId : grapheme;
}

/** Wszystkie identyfikatory dźwięków, które dziecko może usłyszeć z kafelków. */
export function lessonGraphemes(): string[] {
  const graphemes = new Set<string>();
  for (const lesson of Object.values(LESSONS)) {
    graphemes.add(lesson.soundId);
    lesson.blend.forEach((card) =>
      card.graphemes.forEach((g) => graphemes.add(chipSoundId(g, lesson.soundId))),
    );
  }
  return [...graphemes].sort();
}
