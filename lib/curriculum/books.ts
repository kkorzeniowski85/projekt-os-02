/**
 * Książeczki do czytania (decodable readers) — cała historyjka na kilka
 * stron, którą dziecko czyta SAMO, na tablecie albo wydrukowaną.
 *
 * PO CO: mini-czytanka na końcu lekcji to jedno zdanie. Między nią a prawdziwą
 * książką jest przepaść — i dokładnie tę przepaść w brytyjskiej szkole
 * wypełniają „decodable readers” (RWI Ditty/Storybooks, Letters and Sounds,
 * Floppy's Phonics). Przepis jest wszędzie ten sam i tu go powtarzamy:
 *  1. „Zanim przeczytasz”: dźwięki z tej książeczki, słowa do rozgrzewki
 *     (zielone — do sklejenia) i słowa-łobuzy (czerwone — w całości);
 *  2. historyjka: 8–12 stron, na stronie jedno, dwa krótkie zdania;
 *  3. „Porozmawiajcie”: kilka pytań, w tym jedno „spoza tekstu”.
 *
 * ŻELAZNA ZASADA (jak w sentences.ts): książeczka „po dźwięku N” używa
 * WYŁĄCZNIE grafemów dźwięków 1..N sekwencji RWI plus red words poznanych do
 * lekcji N włącznie. Pilnuje tego mechanicznie audyt (scripts/audit-lessons.mjs
 * przez scripts/decodable.mjs) — słowo wyprzedzające sekwencję to BŁĄD, nie
 * uwaga. Pytania na końcu tej zasadzie NIE podlegają: czyta je rodzic albo
 * gra nagranie.
 *
 * Ilustracje: na ekranie emoji (sprzed Unicode 12, jak w lekcjach), na wydruku
 * pusta ramka — dziecko rysuje, co przeczytało. To nie jest prowizorka:
 * rysunek po przeczytaniu strony pokazuje, czy tekst został zrozumiany.
 *
 * Bez importów — generator nagrań i audyt czytają ten plik z Node.
 */

export type BookPage = {
  en: string;
  pl: string;
  /** Obrazek strony na ekranie (emoji sprzed Unicode 12). */
  emoji: string;
};

export type BookQuestion = {
  en: string;
  pl: string;
};

export type Book = {
  /** Slug w URL i w danych postępu (Attempt.item = "<id>/<strona>"). Stabilny. */
  id: string;
  titleEn: string;
  titlePl: string;
  /** Okładka. */
  emoji: string;
  /** Po tej lekcji da się przeczytać całą książeczkę. */
  afterSoundId: string;
  /** Dźwięki do rozgrzewki na okładce (podzbiór już poznanych). */
  focusGraphemes: string[];
  /** Zielone słowa do rozgrzewki — z książeczki, do sklejenia z dźwięków. */
  greenWords: string[];
  /** Słowa-łobuzy użyte w książeczce — wszystkie już poznane. */
  redWords: string[];
  pages: BookPage[];
  /** „Porozmawiajcie” — pytania po angielsku z podpowiedzią dla rodzica. */
  questions: BookQuestion[];
};

/** W kolejności poziomów — od najłatwiejszej. */
export const BOOKS: Book[] = [
  {
    id: "damp-pip",
    titleEn: "Damp Pip",
    titlePl: "Mokry Pip",
    emoji: "🐶",
    afterSoundId: "o",
    focusGraphemes: ["o", "p", "d", "m", "a"],
    greenWords: ["dog", "pond", "damp", "pot", "spots", "tips", "mop", "nips", "sits", "mat", "stop", "naps"],
    redWords: ["the", "said"],
    pages: [
      { en: "Pip is a dog.", pl: "Pip to pies.", emoji: "🐶" },
      { en: "Pip is in the pond.", pl: "Pip jest w stawie.", emoji: "💦" },
      { en: "Pip is damp. Damp Pip spots the pot.", pl: "Pip jest mokry. Mokry Pip zauważa doniczkę.", emoji: "🌵" },
      { en: "Pip tips the pot. Pip spots the mop.", pl: "Pip przewraca doniczkę. Pip zauważa mopa.", emoji: "🧹" },
      { en: "Pip nips the mop. Pip sits on the mat.", pl: "Pip gryzie mopa. Pip siada na macie.", emoji: "🐕" },
      { en: "The mat is damp. Dad spots damp Pip.", pl: "Mata jest mokra. Tata zauważa mokrego Pipa.", emoji: "👀" },
      { en: "Dad said stop. Pip did not stop.", pl: "Tata powiedział: stop! Pip nie przestał.", emoji: "✋" },
      { en: "Pip sat on Dad. Dad is damp and mad.", pl: "Pip usiadł na tacie. Tata jest mokry i wściekły.", emoji: "😠" },
      { en: "Dad got the mop. Dad got the pot.", pl: "Tata wziął mopa. Tata wziął doniczkę.", emoji: "🧽" },
      { en: "Pip did not mop. Pip naps on the mat.", pl: "Pip nie sprzątał. Pip drzemie na macie.", emoji: "😴" },
    ],
    questions: [
      { en: "What did Pip tip?", pl: "Co przewrócił Pip?" },
      { en: "Did Pip stop when Dad said stop?", pl: "Czy Pip przestał, kiedy Tata powiedział stop?" },
      { en: "What would you do if a damp dog sat on you?", pl: "Co byś zrobił, gdyby mokry pies usiadł na tobie?" },
    ],
  },
  {
    id: "stuck-in-the-mud",
    titleEn: "Stuck in the Mud",
    titlePl: "Utknęli w błocie",
    emoji: "🦆",
    afterSoundId: "f",
    focusGraphemes: ["f", "u", "c", "k", "d", "b"],
    greenWords: ["duck", "stuck", "mud", "fog", "soft", "bun", "tugs", "kicks", "bobs", "tips", "picks", "bag"],
    redWords: ["the"],
    pages: [
      { en: "Fog on the pond.", pl: "Mgła nad stawem.", emoji: "🌫️" },
      { en: "A fat duck bobs on the pond.", pl: "Gruba kaczka kołysze się na stawie.", emoji: "🦆" },
      { en: "The duck dips in the soft mud. It is stuck!", pl: "Kaczka zanurza się w miękkim błocie. I utknęła!", emoji: "😬" },
      { en: "Sam is at the pond. Sam tugs the fat duck.", pl: "Sam jest nad stawem. Sam ciągnie grubą kaczkę.", emoji: "👦" },
      { en: "Sam tugs and tips! Sam sits in the soft mud.", pl: "Sam ciągnie i się przewraca! Sam siada w miękkim błocie.", emoji: "💦" },
      { en: "Sam is stuck. The fat duck is stuck.", pl: "Sam utknął. Gruba kaczka utknęła.", emoji: "😮" },
      { en: "Sam digs in a bag. Bun, duck, bun!", pl: "Sam szpera w plecaku. Bułka, kaczko, bułka!", emoji: "🎒" },
      { en: "The duck kicks and kicks. It picks up the bun!", pl: "Kaczka kopie i kopie. Podnosi bułkę!", emoji: "🍞" },
      { en: "The fat duck is not stuck. It tugs Sam up!", pl: "Gruba kaczka już nie tkwi w błocie. Ciągnie Sama do góry!", emoji: "💪" },
      { en: "Mud on Sam and the duck. Fun in the fog!", pl: "Błoto na Samie i na kaczce. Zabawa we mgle!", emoji: "😄" },
    ],
    questions: [
      { en: "Where is the duck stuck?", pl: "Gdzie utknęła kaczka?" },
      { en: "What does Sam find in the bag?", pl: "Co Sam znajduje w plecaku?" },
      { en: "What would you do to help a duck stuck in the mud?", pl: "Co byś zrobił, żeby pomóc kaczce, która utknęła w błocie?" },
    ],
  },
  {
    id: "the-red-hen-and-the-frog",
    titleEn: "The Red Hen and the Frog",
    titlePl: "Czerwona kura i żaba",
    emoji: "🐔",
    afterSoundId: "r",
    focusGraphemes: ["r", "f", "g", "h", "e"],
    greenWords: ["hen", "hat", "red", "run", "frog", "rock", "cross", "mud", "fell", "nest", "rag", "rub"],
    redWords: ["the", "my", "said", "of", "to", "so", "she"],
    pages: [
      { en: "A hen had a red hat. It got lost!", pl: "Kura miała czerwony kapelusz. I on się zgubił!", emoji: "🐔" },
      { en: "The hen ran up a hill. Run, hen, run!", pl: "Kura pobiegła na pagórek. Biegnij, kuro, biegnij!", emoji: "🏃" },
      { en: "A frog sat on a big rock at the top.", pl: "Na szczycie, na wielkim kamieniu, siedziała żaba.", emoji: "🐸" },
      { en: "The frog had a red hat on.", pl: "Żaba miała na głowie czerwony kapelusz.", emoji: "🎩" },
      { en: "\"My red hat!\" said the cross hen.", pl: "„Mój czerwony kapelusz!” — zawołała rozzłoszczona kura.", emoji: "😠" },
      { en: "The frog ran off. The hen ran and ran.", pl: "Żaba uciekła. Kura biegła i biegła.", emoji: "💨" },
      { en: "The frog fell. The hat fell in the mud.", pl: "Żaba upadła. Kapelusz wpadł w błoto.", emoji: "🤸" },
      { en: "The hen got the hat. Lots of mud on it!", pl: "Kura podniosła kapelusz. Cały w błocie!", emoji: "😮" },
      { en: "The hen ran to the nest. A red hat!", pl: "Kura pobiegła do gniazda. A tam czerwony kapelusz!", emoji: "🐣" },
      { en: "So the frog had its hat! The hen felt bad.", pl: "A więc to był kapelusz żaby! Kurze zrobiło się głupio.", emoji: "😳" },
      { en: "She got a rag. Rub, rub, rub the mud off.", pl: "Kura wzięła szmatkę. Szur, szur, szur i po błocie.", emoji: "✨" },
      { en: "The frog got its hat. The hen got a pal.", pl: "Żaba odzyskała kapelusz. A kura zyskała kumpla.", emoji: "🤝" },
    ],
    questions: [
      { en: "What did the frog have on its head?", pl: "Co żaba miała na głowie?" },
      { en: "Where did the hen find her own red hat?", pl: "Gdzie kura znalazła swój własny czerwony kapelusz?" },
      { en: "If you were the hen, what would you say to the frog at the end?", pl: "Gdybyś był kurą, co powiedziałbyś żabie na końcu?" },
    ],
  },
  {
    id: "the-lost-red-hat",
    titleEn: "The Lost Red Hat",
    titlePl: "Zgubiona czerwona czapka",
    emoji: "🧢",
    afterSoundId: "r",
    focusGraphemes: ["r", "h", "d", "b", "o"],
    greenWords: ["hat", "red", "lost", "bed", "rug", "dog", "bin", "bag", "rag", "damp", "lump", "nap"],
    redWords: ["the", "to", "no"],
    pages: [
      { en: "Dan has a red hat. It is his best hat.", pl: "Dan ma czerwoną czapkę. To jego najlepsza czapka.", emoji: "🧢" },
      { en: "The red hat is lost. Dan is sad.", pl: "Czerwona czapka zginęła. Dan jest smutny.", emoji: "😢" },
      { en: "Dan runs to the bed. No hat on the bed.", pl: "Dan biegnie do łóżka. Na łóżku czapki nie ma.", emoji: "🛏️" },
      { en: "Dan tugs the rug. No hat!", pl: "Dan szarpie dywanik. Czapki nie ma!", emoji: "🛋️" },
      { en: "Rob the dog runs in. Rob hunts and hunts.", pl: "Wbiega pies Rob. Rob szuka i szuka.", emoji: "🐶" },
      { en: "Rob gets a red bag. Not the hat, Rob!", pl: "Rob łapie czerwoną torbę. To nie czapka, Rob!", emoji: "👜" },
      { en: "Rob digs in the bin. Not a hat, a damp rag!", pl: "Rob grzebie w koszu. To nie czapka, tylko mokra ścierka!", emoji: "🗑️" },
      { en: "Dan is sad. Rob runs to his bed.", pl: "Dan jest smutny. Rob biegnie do swojego legowiska.", emoji: "🐾" },
      { en: "Rob sits on a lump. It is the red hat!", pl: "Rob siedzi na jakimś kłębku. To ta czerwona czapka!", emoji: "🔴" },
      { en: "Dan has his hat. Rob had a nap on it!", pl: "Dan ma swoją czapkę. Rob uciął sobie na niej drzemkę!", emoji: "🐕" },
    ],
    questions: [
      { en: "Where does Dan look for the hat?", pl: "Gdzie Dan szuka czapki? (dwa miejsca: łóżko i dywanik)" },
      { en: "What is Rob sitting on in his bed?", pl: "Na czym Rob siedzi w swoim legowisku? (na kłębku, czyli czerwonej czapce)" },
      { en: "Where would you look for a lost hat at home?", pl: "Gdzie ty szukałbyś zgubionej czapki w domu?" },
    ],
  },
  {
    id: "wet-pip",
    titleEn: "Wet Pip",
    titlePl: "Mokry Pip",
    emoji: "🐶",
    afterSoundId: "w",
    focusGraphemes: ["w", "u", "e", "d", "s"],
    greenWords: ["wet", "mud", "wind", "will", "runs", "stop", "cross", "tub", "rub", "wags", "jumps", "wins"],
    redWords: ["the", "to", "no"],
    pages: [
      { en: "It is wet. Pip is sad.", pl: "Jest mokro. Pip jest smutny.", emoji: "🌧️" },
      { en: "Pip gets in the mud.", pl: "Pip wchodzi w błoto.", emoji: "🐶" },
      { en: "Sam runs to get Pip. Pip will not stop.", pl: "Sam biegnie po Pipa. Ale Pip ani myśli się zatrzymać.", emoji: "🏃" },
      { en: "Pip runs in the wind. Sam runs in the mud.", pl: "Pip biegnie pod wiatr. Sam biegnie po błocie.", emoji: "💨" },
      { en: "Pip gets wet and Sam gets wet. Mud, mud, mud!", pl: "Pip moknie i Sam moknie. Błoto, błoto, błoto!", emoji: "💦" },
      { en: "Mum is cross. Mud on Sam, mud on Pip!", pl: "Mama jest zła. Błoto na Samie, błoto na Pipie!", emoji: "👩" },
      { en: "Sam gets Pip in the tub. Rub, rub, rub!", pl: "Sam pakuje Pipa do wanny. Szoruj, szoruj, szoruj!", emoji: "🛁" },
      { en: "No mud on Pip! Pip wags and wags.", pl: "Na Pipie ani śladu błota! Pip merda i merda ogonem.", emoji: "✨" },
      { en: "Wet Pip jumps in the mud. Mud on Sam and Mum!", pl: "Mokry Pip wskakuje w błoto. Błoto na Samie i na mamie!", emoji: "🐾" },
      { en: "Wet Pip, wet Sam, wet Mum. Pip wins!", pl: "Mokry Pip, mokry Sam, mokra mama. Pip wygrywa!", emoji: "🏆" },
    ],
    questions: [
      { en: "Where does Pip go at the start of the story?", pl: "Dokąd Pip wchodzi na początku historyjki?" },
      { en: "What does Sam do to get the mud off Pip?", pl: "Co robi Sam, żeby zmyć błoto z Pipa?" },
      { en: "What would you do if your dog jumped back into the mud?", pl: "Co byś zrobił, gdyby twój pies znowu wskoczył w błoto?" },
    ],
  },
  {
    id: "the-pink-ship",
    titleEn: "The Pink Ship",
    titlePl: "Różowy statek",
    emoji: "🚢",
    afterSoundId: "nk",
    focusGraphemes: ["nk", "sh", "th", "i", "u"],
    greenWords: ["bath", "ship", "pink", "duck", "sink", "thinks", "plunk", "junk", "winks", "splish", "splash", "then"],
    redWords: ["the", "he", "said"],
    pages: [
      { en: "Tim is in the bath. Mum is at the sink.", pl: "Tim siedzi w wannie. Mama stoi przy umywalce.", emoji: "🛁" },
      { en: "He has a pink ship.", pl: "Ma różowy statek.", emoji: "🚢" },
      { en: "The pink ship tips and dips. Splish splash!", pl: "Różowy statek przechyla się i nurkuje. Chlap, chlap!", emoji: "🌊" },
      { en: "Tim drops his big duck on the ship.", pl: "Tim stawia swoją dużą kaczkę na statku.", emoji: "🦆" },
      { en: "Plunk! The pink ship sinks with a big splash!", pl: "Plum! Różowy statek tonie z wielkim pluskiem!", emoji: "😮" },
      { en: "Tim lifts the duck up. Up pops the pink ship!", pl: "Tim podnosi kaczkę. Różowy statek wyskakuje na wierzch!", emoji: "🎉" },
      { en: "Tim drops the duck on the ship. Plunk, plunk, plunk!", pl: "Tim wrzuca kaczkę na statek. Plum, plum, plum!", emoji: "😄" },
      { en: "Then the duck sinks. Tim thinks ducks cannot sink!", pl: "Potem tonie kaczka. Tim myśli, że kaczki nie mogą tonąć!", emoji: "💦" },
      { en: "Mum said the duck is junk. It has a crack!", pl: "Mama powiedziała, że kaczka nadaje się do kosza. Ma pęknięcie!", emoji: "🔎" },
      { en: "Tim winks at Mum. The duck sits on the sink!", pl: "Tim mruga do mamy. Kaczka siedzi na umywalce!", emoji: "🚰" },
    ],
    questions: [
      { en: "What does Tim have in the bath?", pl: "Co Tim ma w wannie?" },
      { en: "Why does the duck sink?", pl: "Dlaczego kaczka tonie?" },
      { en: "What would you sink in the bath? Why?", pl: "Co ty byś zatopił w wannie? Dlaczego?" },
    ],
  },
];

export function getBook(id: string): Book | undefined {
  return BOOKS.find((book) => book.id === id);
}

/** Wszystkie wypowiedzi do nagrania (strony i pytania) — lądują w /audio/phrases. */
export function bookTexts(): string[] {
  const texts = new Set<string>();
  for (const book of BOOKS) {
    book.pages.forEach((page) => texts.add(page.en));
    book.questions.forEach((question) => texts.add(question.en));
  }
  return [...texts].sort();
}

/** Słowa rozgrzewki (zielone i czerwone) — nagrania w /audio/words. */
export function bookWords(): string[] {
  const words = new Set<string>();
  for (const book of BOOKS) {
    [...book.greenWords, ...book.redWords].forEach((word) => words.add(word.toLowerCase()));
  }
  return [...words].sort();
}
