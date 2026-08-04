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
      { word: "sun", hasTarget: false, pl: "słońce", emoji: "☀️" },
      { word: "fish", hasTarget: true, pl: "ryba", emoji: "🐟" },
      { word: "dog", hasTarget: false, pl: "pies", emoji: "🐶" },
      { word: "shell", hasTarget: true, pl: "muszla", emoji: "🐚" },
      { word: "cat", hasTarget: false, pl: "kot", emoji: "🐱" },
      { word: "brush", hasTarget: true, pl: "pędzel", emoji: "🖌️" },
      { word: "pen", hasTarget: false, pl: "długopis", emoji: "🖊️" },
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
      { word: "top", hasTarget: false, pl: "góra", emoji: "🔝" },
      { word: "chair", hasTarget: true, pl: "krzesło", emoji: "💺" },
      { word: "bed", hasTarget: false, pl: "łóżko", emoji: "🛏️" },
      { word: "lunch", hasTarget: true, pl: "obiad", emoji: "🍱" },
      { word: "sun", hasTarget: false, pl: "słońce", emoji: "☀️" },
      { word: "cheese", hasTarget: true, pl: "ser", emoji: "🧀" },
      { word: "milk", hasTarget: false, pl: "mleko", emoji: "🥛" },
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
      { answer: "chair", options: ["chair", "hair", "chain"], pl: "krzesło", emoji: "💺" },
      { answer: "chop", options: ["chip", "chop", "shop"], pl: "siekać", emoji: "🔪" },
      { answer: "much", options: ["much", "mush", "match"], pl: "dużo", emoji: "📦" },
    ],
    redWords: ["the", "was"],
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

/** Wszystkie grafemy, które dziecko może stuknąć podczas sklejania słów. */
export function lessonGraphemes(): string[] {
  const graphemes = new Set<string>();
  for (const lesson of Object.values(LESSONS)) {
    graphemes.add(lesson.soundId);
    lesson.blend.forEach((card) => card.graphemes.forEach((g) => graphemes.add(g)));
  }
  return [...graphemes].sort();
}
