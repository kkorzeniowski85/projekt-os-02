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
    redWords: ["the", "said"],
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
    redWords: ["the", "was"],
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
    redWords: ["the", "they"],
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
    redWords: ["the", "said"],
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
    redWords: ["the", "you"],
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
    redWords: ["the", "are"],
  },

  // --- Set 2: 12 "speed sounds" -------------------------------------------

  ay: {
    soundId: "ay",
    heroId: "thunder",
    chant: "ay — ay — ay!",
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
    redWords: ["the", "come"],
  },

  ee: {
    soundId: "ee",
    heroId: "thunder",
    chant: "ee — ee — ee!",
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
    redWords: ["the", "he"],
  },

  igh: {
    soundId: "igh",
    heroId: "speed",
    chant: "igh — igh — igh!",
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
    redWords: ["the", "my"],
  },

  "ow-blow": {
    soundId: "ow-blow",
    heroId: "speed",
    chant: "ow — ow — ow!",
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
    redWords: ["the", "so"],
  },

  "oo-zoo": {
    soundId: "oo-zoo",
    heroId: "speed",
    chant: "oo — oo — oo!",
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
    redWords: ["the", "do"],
  },

  "oo-look": {
    soundId: "oo-look",
    heroId: "moon",
    chant: "oo — oo — oo!",
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
    redWords: ["the", "could"],
  },

  ar: {
    soundId: "ar",
    heroId: "moon",
    chant: "ar — ar — ar!",
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
    redWords: ["the", "are"],
  },

  or: {
    soundId: "or",
    heroId: "spark",
    chant: "or — or — or!",
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
    redWords: ["the", "your"],
  },

  air: {
    soundId: "air",
    heroId: "spark",
    chant: "air — air — air!",
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
    redWords: ["the", "there"],
  },

  ir: {
    soundId: "ir",
    heroId: "spark",
    chant: "ir — ir — ir!",
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
    redWords: ["the", "her"],
  },

  ou: {
    soundId: "ou",
    heroId: "spark",
    chant: "ou — ou — ou!",
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
    redWords: ["the", "our"],
  },

  oy: {
    soundId: "oy",
    heroId: "spark",
    chant: "oy — oy — oy!",
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
    redWords: ["the", "one"],
  },

  // --- Set 3 ---------------------------------------------------------------

  ea: {
    soundId: "ea",
    heroId: "spark",
    chant: "ea — ea — ea!",
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
    redWords: ["the", "she"],
  },

  oi: {
    soundId: "oi",
    heroId: "spark",
    chant: "oi — oi — oi!",
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
    redWords: ["the", "want"],
  },

  "a-e": {
    soundId: "a-e",
    heroId: "gleam",
    chant: "a-e — a-e — a-e!",
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
    redWords: ["the", "some"],
  },

  "i-e": {
    soundId: "i-e",
    heroId: "gleam",
    chant: "i-e — i-e — i-e!",
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
    redWords: ["the", "I"],
  },

  "o-e": {
    soundId: "o-e",
    heroId: "gleam",
    chant: "o-e — o-e — o-e!",
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
    redWords: ["the", "come"],
  },

  "u-e": {
    soundId: "u-e",
    heroId: "gleam",
    chant: "u-e — u-e — u-e!",
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
    redWords: ["the", "you"],
  },

  aw: {
    soundId: "aw",
    heroId: "flame",
    chant: "aw — aw — aw!",
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
      { answer: "draw", options: ["draw", "drew", "door"], pl: "rysować", emoji: "🎨" },
      { answer: "claw", options: ["claw", "clay", "crow"], pl: "szczypce", emoji: "🦀" },
      { answer: "yawn", options: ["yawn", "yarn", "lawn"], pl: "ziewać", emoji: "😪" },
    ],
    redWords: ["the", "all"],
  },

  are: {
    soundId: "are",
    heroId: "flame",
    chant: "are — are — are!",
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
    redWords: ["are", "there"],
  },

  ur: {
    soundId: "ur",
    heroId: "flame",
    chant: "ur — ur — ur!",
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
    redWords: ["her", "were"],
  },

  er: {
    soundId: "er",
    heroId: "burn",
    chant: "er — er — er!",
    parentIntro:
      'Krótkie, ciche „e” na końcu dłuższych słów: let-ter, din-ner. To pierwsze lekcje ' +
      "z DWUSYLABOWYMI słowami — klaskajcie sylaby przed sklejaniem!",
    listen: [
      { word: "letter", hasTarget: true, pl: "list", emoji: "✉️" },
      { word: "van", hasTarget: false, pl: "furgonetka", emoji: "🚐" },
      { word: "dinner", hasTarget: true, pl: "kolacja", emoji: "🍽️" },
      { word: "web", hasTarget: false, pl: "pajęczyna", emoji: "🕸️" },
      { word: "summer", hasTarget: true, pl: "lato", emoji: "🌞" },
      { word: "zip", hasTarget: false, pl: "zamek", emoji: "🤐" },
      { word: "winter", hasTarget: true, pl: "zima", emoji: "⛄" },
      { word: "bat", hasTarget: false, pl: "nietoperz", emoji: "🦇" },
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
    redWords: ["the", "water"],
  },

  "ow-brown": {
    soundId: "ow-brown",
    heroId: "burn",
    chant: "ow — ow — ow!",
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
    redWords: ["the", "how"],
  },

  ai: {
    soundId: "ai",
    heroId: "burn",
    chant: "ai — ai — ai!",
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
      { word: "tail", hasTarget: true, pl: "ogon", emoji: "🐕" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
    ],
    blend: [
      { word: "rain", graphemes: ["r", "ai", "n"], targetIndex: 1, pl: "deszcz", emoji: "🌧️" },
      { word: "tail", graphemes: ["t", "ai", "l"], targetIndex: 1, pl: "ogon", emoji: "🐕" },
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
    redWords: ["the", "again"],
  },

  oa: {
    soundId: "oa",
    heroId: "burn",
    chant: "oa — oa — oa!",
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
    redWords: ["the", "go"],
  },

  ew: {
    soundId: "ew",
    heroId: "burn",
    chant: "ew — ew — ew!",
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
      { word: "new", graphemes: ["n", "ew"], targetIndex: 1, pl: "nowy", emoji: "✨" },
      { word: "chew", graphemes: ["ch", "ew"], targetIndex: 1, pl: "żuć", emoji: "🍬" },
      { word: "flew", graphemes: ["f", "l", "ew"], targetIndex: 2, pl: "poleciał", emoji: "🕊️" },
      { word: "grew", graphemes: ["g", "r", "ew"], targetIndex: 2, pl: "urósł", emoji: "🌱" },
      { word: "stew", graphemes: ["s", "t", "ew"], targetIndex: 2, pl: "gulasz", emoji: "🍲" },
    ],
    choice: [
      { answer: "new", options: ["new", "now", "nose"], pl: "nowy", emoji: "✨" },
      { answer: "chew", options: ["chew", "chop", "cheek"], pl: "żuć", emoji: "🍬" },
      { answer: "flew", options: ["flew", "flow", "few"], pl: "poleciał", emoji: "🕊️" },
      { answer: "grew", options: ["grew", "grow", "green"], pl: "urósł", emoji: "🌱" },
    ],
    redWords: ["the", "who"],
  },

  ire: {
    soundId: "ire",
    heroId: "burn",
    chant: "ire — ire — ire!",
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
    redWords: ["the", "what"],
  },

  ear: {
    soundId: "ear",
    heroId: "burn",
    chant: "ear — ear — ear!",
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
    redWords: ["the", "here"],
  },

  ure: {
    soundId: "ure",
    heroId: "burn",
    chant: "ure — ure — ure!",
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
    redWords: ["the", "where"],
  },
};

export function getLesson(soundId: string): Lesson | undefined {
  return LESSONS[soundId];
}

export function hasLesson(soundId: string): boolean {
  return soundId in LESSONS;
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
