/**
 * 🗣️ Rozmowa z bohaterem — lektor pyta, dziecko odpowiada na głos.
 *
 * Po co (prośba rodzica 2026-11-22; patrz pamięć „Priorytet: mówienie”): scenki
 * uczą powtarzać gotowe zwroty, a tu dziecko musi samo ułożyć odpowiedź na
 * pytanie — tak jak w szkole i na podwórku. Pytania są krótkie, z obrazkiem
 * tam, gdzie się da, a odpowiedź ma gotowy wzór.
 *
 * Aplikacja NIE słucha dziecka i nie ocenia wymowy. Rodzic stuka „Sam” albo
 * „Z pomocą”; w trybie samodzielnym dziecko stuka samo. Gdy dziecko nie wie,
 * dostaje podpowiedzi po kolei (components/talk/TalkRunner.tsx):
 *  1. pytanie jeszcze raz, wolniej, z polskim znaczeniem;
 *  2. początek odpowiedzi (`frame`) i obrazki do wyboru (`options`);
 *  3. gotowa odpowiedź (drugi lektor) do powtórzenia jak echo.
 *
 * `personal` — odpowiedź zależy od dziecka (imię, wiek): wzór jest przykładem,
 * dziecko mówi o sobie.
 *
 * Nagrania: pytanie i odpowiedź obydwoma głosami (lib/voices.ts) — pyta jeden
 * lektor, odpowiada drugi; opcje podpowiedzi jak słowa. Generator:
 * scripts/generate-eleven.mjs (grupa „talk”). Bez nagrania gra syntezator.
 *
 * Język: brytyjski, ze szkoły i z podwórka (Year 3–4).
 */

export type TalkOption = { en: string; emoji: string };

export type TalkQuestion = {
  id: string;
  q: string;
  qPl: string;
  /** Obrazek do pytania („What's this?” — 🍎). */
  emoji?: string;
  answer: string;
  answerPl: string;
  /** Początek odpowiedzi z luką „___” (podpowiedź 2). Bez niego — same opcje jako całe odpowiedzi. */
  frame?: string;
  /** Do wyboru w podpowiedzi 2: słowo do luki albo cała krótka odpowiedź. */
  options?: TalkOption[];
  personal?: boolean;
};

export type TalkSet = {
  id: string;
  titlePl: string;
  emoji: string;
  questions: TalkQuestion[];
};

/** Id sesji Rozmowy w dzienniku (tor „vocab”, jak Powtórka — bez stanu tematu). */
export const TALK_SESSION_ID = "rozmowa";

export const TALK_SETS: TalkSet[] = [
  {
    id: "about-me",
    titlePl: "Poznajmy się",
    emoji: "🙋",
    questions: [
      { id: "name", q: "What's your name?", qPl: "Jak masz na imię?", answer: "My name is Sam.", answerPl: "Mam na imię Sam.", frame: "My name is ___.", personal: true },
      { id: "age", q: "How old are you?", qPl: "Ile masz lat?", answer: "I'm seven.", answerPl: "Mam siedem lat.", frame: "I'm ___.", options: [{ en: "seven", emoji: "7️⃣" }, { en: "eight", emoji: "8️⃣" }], personal: true },
      { id: "from", q: "Where are you from?", qPl: "Skąd jesteś?", answer: "I'm from Poland.", answerPl: "Jestem z Polski.", frame: "I'm from ___.", options: [{ en: "Poland", emoji: "🇵🇱" }], personal: true },
      { id: "sibling", q: "Have you got a brother or a sister?", qPl: "Masz brata albo siostrę?", answer: "Yes, I've got a sister.", answerPl: "Tak, mam siostrę.", frame: "Yes, I've got a ___.", options: [{ en: "brother", emoji: "👦" }, { en: "sister", emoji: "👧" }], personal: true },
      { id: "colour", q: "What's your favourite colour?", qPl: "Jaki jest twój ulubiony kolor?", answer: "My favourite colour is blue.", answerPl: "Mój ulubiony kolor to niebieski.", frame: "My favourite colour is ___.", options: [{ en: "blue", emoji: "🔵" }, { en: "red", emoji: "🔴" }, { en: "green", emoji: "🟢" }], personal: true },
      { id: "pet", q: "Have you got a pet?", qPl: "Masz zwierzątko?", answer: "Yes, I've got a dog.", answerPl: "Tak, mam psa.", frame: "Yes, I've got a ___.", options: [{ en: "dog", emoji: "🐶" }, { en: "cat", emoji: "🐱" }, { en: "No, I haven't.", emoji: "🙅" }], personal: true },
      { id: "like-doing", q: "What do you like doing?", qPl: "Co lubisz robić?", answer: "I like playing football.", answerPl: "Lubię grać w piłkę.", frame: "I like ___.", options: [{ en: "playing football", emoji: "⚽" }, { en: "drawing", emoji: "🎨" }, { en: "reading", emoji: "📖" }], personal: true },
    ],
  },
  {
    id: "what-is-it",
    titlePl: "Co to jest?",
    emoji: "🔍",
    questions: [
      { id: "this-apple", q: "What's this?", qPl: "Co to jest?", emoji: "🍎", answer: "It's an apple.", answerPl: "To jabłko.", frame: "It's an ___.", options: [{ en: "apple", emoji: "🍎" }, { en: "orange", emoji: "🍊" }] },
      { id: "colour-banana", q: "What colour is it?", qPl: "Jakiego to koloru?", emoji: "🍌", answer: "It's yellow.", answerPl: "Jest żółty.", frame: "It's ___.", options: [{ en: "yellow", emoji: "🟡" }, { en: "red", emoji: "🔴" }, { en: "blue", emoji: "🔵" }] },
      { id: "how-many-cats", q: "How many cats can you see?", qPl: "Ile kotów widzisz?", emoji: "🐱🐱🐱", answer: "I can see three cats.", answerPl: "Widzę trzy koty.", frame: "I can see ___ cats.", options: [{ en: "two", emoji: "2️⃣" }, { en: "three", emoji: "3️⃣" }, { en: "four", emoji: "4️⃣" }] },
      { id: "big-small", q: "Is it big or small?", qPl: "Jest duży czy mały?", emoji: "🐘", answer: "It's big.", answerPl: "Jest duży.", frame: "It's ___.", options: [{ en: "big", emoji: "🐘" }, { en: "small", emoji: "🐭" }] },
      { id: "this-elephant", q: "What's this?", qPl: "Co to jest?", emoji: "🐘", answer: "It's an elephant.", answerPl: "To słoń.", frame: "It's an ___.", options: [{ en: "elephant", emoji: "🐘" }, { en: "animal", emoji: "🐾" }] },
      { id: "hot-cold", q: "Is it hot or cold?", qPl: "Jest gorąco czy zimno?", emoji: "❄️", answer: "It's cold.", answerPl: "Jest zimno.", frame: "It's ___.", options: [{ en: "hot", emoji: "🔥" }, { en: "cold", emoji: "❄️" }] },
      { id: "this-bus", q: "What's this?", qPl: "Co to jest?", emoji: "🚌", answer: "It's a bus.", answerPl: "To autobus.", frame: "It's a ___.", options: [{ en: "bus", emoji: "🚌" }, { en: "car", emoji: "🚗" }] },
    ],
  },
  {
    id: "school",
    titlePl: "W szkole",
    emoji: "🏫",
    questions: [
      { id: "are-you-ok", q: "Are you OK?", qPl: "Wszystko w porządku?", answer: "Yes, I'm OK, thank you.", answerPl: "Tak, wszystko dobrze, dziękuję.", options: [{ en: "Yes, I'm OK, thank you.", emoji: "🙂" }, { en: "No, I'm not.", emoji: "🙁" }] },
      { id: "need-help", q: "Do you need help?", qPl: "Potrzebujesz pomocy?", answer: "Yes, please.", answerPl: "Tak, poproszę.", options: [{ en: "Yes, please.", emoji: "🙋" }, { en: "No, thank you.", emoji: "👍" }] },
      { id: "finished", q: "Have you finished?", qPl: "Skończyłeś?", answer: "Not yet.", answerPl: "Jeszcze nie.", options: [{ en: "Yes, I have.", emoji: "✅" }, { en: "Not yet.", emoji: "⏳" }] },
      { id: "pencil", q: "Have you got a pencil?", qPl: "Masz ołówek?", emoji: "✏️", answer: "Yes, I have.", answerPl: "Tak, mam.", options: [{ en: "Yes, I have.", emoji: "✅" }, { en: "No, I haven't.", emoji: "🙅" }] },
      { id: "in-english", q: "What's this in English?", qPl: "Jak to jest po angielsku?", emoji: "📏", answer: "It's a ruler.", answerPl: "To linijka.", frame: "It's a ___.", options: [{ en: "ruler", emoji: "📏" }, { en: "pencil", emoji: "✏️" }] },
      { id: "tidy-up", q: "Can you help me tidy up?", qPl: "Pomożesz mi posprzątać?", answer: "Yes, of course.", answerPl: "Tak, oczywiście.", options: [{ en: "Yes, of course.", emoji: "👍" }] },
      { id: "understand", q: "Do you understand?", qPl: "Rozumiesz?", answer: "No, I don't understand.", answerPl: "Nie, nie rozumiem.", options: [{ en: "Yes, I do.", emoji: "👍" }, { en: "No, I don't understand.", emoji: "🤔" }] },
    ],
  },
  {
    id: "food",
    titlePl: "Jedzenie",
    emoji: "🍽️",
    questions: [
      { id: "hungry", q: "Are you hungry?", qPl: "Jesteś głodny?", answer: "Yes, I'm hungry.", answerPl: "Tak, jestem głodny.", options: [{ en: "Yes, I'm hungry.", emoji: "😋" }, { en: "No, I'm not.", emoji: "🙅" }] },
      { id: "like-pizza", q: "Do you like pizza?", qPl: "Lubisz pizzę?", emoji: "🍕", answer: "Yes, I do.", answerPl: "Tak, lubię.", options: [{ en: "Yes, I do.", emoji: "👍" }, { en: "No, I don't.", emoji: "👎" }] },
      { id: "water", q: "Would you like some water?", qPl: "Chcesz wody?", emoji: "💧", answer: "Yes, please.", answerPl: "Tak, poproszę.", options: [{ en: "Yes, please.", emoji: "👍" }, { en: "No, thank you.", emoji: "🙅" }] },
      { id: "fruit", q: "What fruit do you like?", qPl: "Jakie owoce lubisz?", answer: "I like bananas.", answerPl: "Lubię banany.", frame: "I like ___.", options: [{ en: "bananas", emoji: "🍌" }, { en: "apples", emoji: "🍎" }, { en: "strawberries", emoji: "🍓" }], personal: true },
      { id: "lunch", q: "What would you like for lunch?", qPl: "Co chcesz na obiad?", answer: "I'd like a sandwich, please.", answerPl: "Poproszę kanapkę.", frame: "I'd like ___, please.", options: [{ en: "a sandwich", emoji: "🥪" }, { en: "pasta", emoji: "🍝" }, { en: "soup", emoji: "🍲" }] },
      { id: "pass-bread", q: "Can you pass me the bread, please?", qPl: "Podasz mi chleb?", emoji: "🍞", answer: "Here you are.", answerPl: "Proszę bardzo.", options: [{ en: "Here you are.", emoji: "🤲" }] },
      { id: "yummy", q: "Did you like it?", qPl: "Smakowało ci?", answer: "Yes, it was yummy!", answerPl: "Tak, było pyszne!", options: [{ en: "Yes, it was yummy!", emoji: "😋" }, { en: "Not really.", emoji: "😕" }] },
    ],
  },
  {
    id: "doing",
    titlePl: "Co robi?",
    emoji: "🏃",
    questions: [
      { id: "he-running", q: "What is he doing?", qPl: "Co on robi?", emoji: "🏃‍♂️", answer: "He is running.", answerPl: "On biegnie.", frame: "He is ___.", options: [{ en: "running", emoji: "🏃‍♂️" }, { en: "swimming", emoji: "🏊" }, { en: "sleeping", emoji: "😴" }] },
      { id: "she-swimming", q: "What is she doing?", qPl: "Co ona robi?", emoji: "🏊‍♀️", answer: "She is swimming.", answerPl: "Ona pływa.", frame: "She is ___.", options: [{ en: "swimming", emoji: "🏊‍♀️" }, { en: "reading", emoji: "📖" }, { en: "eating", emoji: "🍽️" }] },
      { id: "dog-sleeping", q: "What is the dog doing?", qPl: "Co robi pies?", emoji: "🐕💤", answer: "The dog is sleeping.", answerPl: "Pies śpi.", frame: "The dog is ___.", options: [{ en: "sleeping", emoji: "💤" }, { en: "running", emoji: "🏃" }] },
      { id: "doing-now", q: "What are you doing now?", qPl: "Co teraz robisz?", answer: "I'm playing.", answerPl: "Bawię się.", frame: "I'm ___.", options: [{ en: "playing", emoji: "🧸" }, { en: "reading", emoji: "📖" }, { en: "drawing", emoji: "🎨" }], personal: true },
      { id: "can-swim", q: "Can you swim?", qPl: "Umiesz pływać?", emoji: "🏊", answer: "Yes, I can.", answerPl: "Tak, umiem.", options: [{ en: "Yes, I can.", emoji: "👍" }, { en: "No, I can't.", emoji: "🙅" }], personal: true },
      { id: "can-bike", q: "Can you ride a bike?", qPl: "Umiesz jeździć na rowerze?", emoji: "🚲", answer: "Yes, I can.", answerPl: "Tak, umiem.", options: [{ en: "Yes, I can.", emoji: "👍" }, { en: "No, I can't.", emoji: "🙅" }], personal: true },
      { id: "after-school", q: "Who do you play with after school?", qPl: "Z kim bawisz się po szkole?", answer: "I play with my friends.", answerPl: "Bawię się z kolegami.", frame: "I play with ___.", options: [{ en: "my friends", emoji: "👫" }, { en: "my brother", emoji: "👦" }, { en: "my dog", emoji: "🐶" }], personal: true },
    ],
  },
  {
    id: "feelings",
    titlePl: "Jak się czujesz?",
    emoji: "😊",
    questions: [
      { id: "how-are-you", q: "How are you?", qPl: "Jak się masz?", answer: "I'm fine, thank you.", answerPl: "Dobrze, dziękuję.", frame: "I'm ___, thank you.", options: [{ en: "fine", emoji: "🙂" }, { en: "great", emoji: "😃" }, { en: "tired", emoji: "😴" }] },
      { id: "happy", q: "Are you happy?", qPl: "Jesteś szczęśliwy?", emoji: "😃", answer: "Yes, I'm happy.", answerPl: "Tak, jestem szczęśliwy.", options: [{ en: "Yes, I'm happy.", emoji: "😃" }, { en: "No, I'm sad.", emoji: "😢" }] },
      { id: "whats-wrong", q: "What's wrong?", qPl: "Co się stało?", emoji: "🤕", answer: "I've hurt my knee.", answerPl: "Uderzyłem się w kolano.", frame: "I've hurt my ___.", options: [{ en: "knee", emoji: "🦵" }, { en: "hand", emoji: "✋" }, { en: "head", emoji: "🤕" }] },
      { id: "tired", q: "Are you tired?", qPl: "Jesteś zmęczony?", emoji: "😴", answer: "Yes, a little.", answerPl: "Tak, trochę.", options: [{ en: "Yes, a little.", emoji: "😴" }, { en: "No, I'm not.", emoji: "😃" }] },
      { id: "cold", q: "Are you cold?", qPl: "Jest ci zimno?", emoji: "🥶", answer: "Yes, I'm cold.", answerPl: "Tak, jest mi zimno.", options: [{ en: "Yes, I'm cold.", emoji: "🥶" }, { en: "No, I'm OK.", emoji: "🙂" }] },
      { id: "sick", q: "Do you feel sick?", qPl: "Niedobrze ci?", emoji: "🤢", answer: "Yes, I feel sick.", answerPl: "Tak, niedobrze mi.", options: [{ en: "Yes, I feel sick.", emoji: "🤢" }, { en: "No, I'm OK.", emoji: "🙂" }] },
      { id: "scared", q: "Are you scared?", qPl: "Boisz się?", emoji: "😨", answer: "No, I'm not scared.", answerPl: "Nie, nie boję się.", options: [{ en: "Yes, a little.", emoji: "😨" }, { en: "No, I'm not scared.", emoji: "💪" }] },
    ],
  },
  {
    id: "family",
    titlePl: "Dom i rodzina",
    emoji: "🏠",
    questions: [
      { id: "who-mum", q: "Who is this?", qPl: "Kto to jest?", emoji: "👩", answer: "This is my mum.", answerPl: "To moja mama.", frame: "This is my ___.", options: [{ en: "mum", emoji: "👩" }, { en: "dad", emoji: "👨" }, { en: "sister", emoji: "👧" }] },
      { id: "who-grandad", q: "Who is this?", qPl: "Kto to jest?", emoji: "👴", answer: "This is my grandad.", answerPl: "To mój dziadek.", frame: "This is my ___.", options: [{ en: "grandad", emoji: "👴" }, { en: "grandma", emoji: "👵" }] },
      { id: "where-live", q: "Where do you live?", qPl: "Gdzie mieszkasz?", answer: "I live in London.", answerPl: "Mieszkam w Londynie.", frame: "I live in ___.", options: [{ en: "London", emoji: "🏙️" }, { en: "Poland", emoji: "🇵🇱" }], personal: true },
      { id: "live-with", q: "Who do you live with?", qPl: "Z kim mieszkasz?", answer: "I live with my mum and dad.", answerPl: "Mieszkam z mamą i tatą.", frame: "I live with ___.", options: [{ en: "my mum and dad", emoji: "👨‍👩‍👦" }], personal: true },
      { id: "garden", q: "Have you got a garden?", qPl: "Masz ogród?", emoji: "🌳", answer: "Yes, I have.", answerPl: "Tak, mam.", options: [{ en: "Yes, I have.", emoji: "✅" }, { en: "No, I haven't.", emoji: "🙅" }], personal: true },
      { id: "toy", q: "What's your favourite toy?", qPl: "Jaka jest twoja ulubiona zabawka?", emoji: "🧸", answer: "My favourite toy is my teddy.", answerPl: "Moja ulubiona zabawka to miś.", frame: "My favourite toy is my ___.", options: [{ en: "teddy", emoji: "🧸" }, { en: "car", emoji: "🚗" }, { en: "ball", emoji: "⚽" }], personal: true },
      { id: "bedroom", q: "Have you got your own bedroom?", qPl: "Masz własny pokój?", emoji: "🛏️", answer: "Yes, I have.", answerPl: "Tak, mam.", options: [{ en: "Yes, I have.", emoji: "✅" }, { en: "No, I share it.", emoji: "👦👦" }], personal: true },
    ],
  },
  {
    id: "playground",
    titlePl: "Na podwórku",
    emoji: "🛝",
    questions: [
      { id: "want-play", q: "Do you want to play?", qPl: "Chcesz się pobawić?", answer: "Yes, please!", answerPl: "Tak, chętnie!", options: [{ en: "Yes, please!", emoji: "😃" }, { en: "Not now, thanks.", emoji: "🙅" }] },
      { id: "can-i-play", q: "Can I play with you?", qPl: "Mogę się z tobą bawić?", answer: "Yes, you can.", answerPl: "Tak, możesz.", options: [{ en: "Yes, you can.", emoji: "👍" }, { en: "Sorry, not now.", emoji: "🙅" }] },
      { id: "whose-turn", q: "Whose turn is it?", qPl: "Czyja kolej?", answer: "It's my turn.", answerPl: "Moja kolej.", options: [{ en: "It's my turn.", emoji: "🙋" }, { en: "It's your turn.", emoji: "👉" }] },
      { id: "best-friend", q: "Who is your best friend?", qPl: "Kto jest twoim najlepszym kolegą?", answer: "My best friend is Tom.", answerPl: "Mój najlepszy kolega to Tom.", frame: "My best friend is ___.", personal: true },
      { id: "like-football", q: "Do you like football?", qPl: "Lubisz piłkę nożną?", emoji: "⚽", answer: "Yes, I love it!", answerPl: "Tak, uwielbiam!", options: [{ en: "Yes, I love it!", emoji: "😍" }, { en: "Not really.", emoji: "😕" }], personal: true },
      { id: "catch", q: "Can you catch the ball?", qPl: "Złapiesz piłkę?", emoji: "🏐", answer: "Yes, I can.", answerPl: "Tak, złapię.", options: [{ en: "Yes, I can.", emoji: "👍" }] },
      { id: "hurt-yourself", q: "Did you hurt yourself?", qPl: "Zrobiłeś sobie krzywdę?", emoji: "🩹", answer: "No, I'm OK.", answerPl: "Nie, nic mi nie jest.", options: [{ en: "No, I'm OK.", emoji: "👍" }, { en: "Yes, my knee hurts.", emoji: "🦵" }] },
    ],
  },
  {
    id: "today",
    titlePl: "Dzisiaj",
    emoji: "🌦️",
    questions: [
      { id: "weather", q: "What's the weather like today?", qPl: "Jaka jest dziś pogoda?", emoji: "☀️", answer: "It's sunny.", answerPl: "Jest słonecznie.", options: [{ en: "It's sunny.", emoji: "☀️" }, { en: "It's raining.", emoji: "🌧️" }, { en: "It's windy.", emoji: "💨" }] },
      { id: "raining", q: "Is it raining?", qPl: "Pada deszcz?", emoji: "🌧️", answer: "Yes, it is.", answerPl: "Tak, pada.", options: [{ en: "Yes, it is.", emoji: "🌧️" }, { en: "No, it isn't.", emoji: "☀️" }] },
      { id: "what-day", q: "What day is it today?", qPl: "Jaki dziś dzień?", answer: "It's Monday.", answerPl: "Jest poniedziałek.", frame: "It's ___.", options: [{ en: "Monday", emoji: "📅" }, { en: "Saturday", emoji: "🎉" }], personal: true },
      { id: "like-snow", q: "Do you like snow?", qPl: "Lubisz śnieg?", emoji: "❄️", answer: "Yes, I love snow!", answerPl: "Tak, uwielbiam śnieg!", options: [{ en: "Yes, I love snow!", emoji: "⛄" }, { en: "No, it's too cold.", emoji: "🥶" }], personal: true },
      { id: "breakfast", q: "What did you have for breakfast?", qPl: "Co jadłeś na śniadanie?", answer: "I had cereal.", answerPl: "Jadłem płatki.", frame: "I had ___.", options: [{ en: "cereal", emoji: "🥣" }, { en: "toast", emoji: "🍞" }, { en: "eggs", emoji: "🍳" }], personal: true },
      { id: "sleep-well", q: "Did you sleep well?", qPl: "Dobrze spałeś?", emoji: "🛌", answer: "Yes, thank you.", answerPl: "Tak, dziękuję.", options: [{ en: "Yes, thank you.", emoji: "😊" }, { en: "Not really.", emoji: "🥱" }], personal: true },
      { id: "ready", q: "Are you ready?", qPl: "Jesteś gotowy?", answer: "Yes, I'm ready!", answerPl: "Tak, jestem gotowy!", options: [{ en: "Yes, I'm ready!", emoji: "💪" }, { en: "Not yet.", emoji: "⏳" }] },
    ],
  },
];

/** Klucz pytania w dzienniku prób: „zestaw/pytanie”. */
export function talkKey(set: TalkSet, question: TalkQuestion): string {
  return `${set.id}/${question.id}`;
}

export type TalkEntry = { set: TalkSet; question: TalkQuestion; key: string };

export const TALK_ENTRIES: TalkEntry[] = TALK_SETS.flatMap((set) =>
  set.questions.map((question) => ({ set, question, key: talkKey(set, question) })),
);

export function getTalkEntry(key: string): TalkEntry | undefined {
  return TALK_ENTRIES.find((entry) => entry.key === key);
}

export function getTalkSet(id: string): TalkSet | undefined {
  return TALK_SETS.find((set) => set.id === id);
}

/** Do generatora nagrań: pytania i odpowiedzi (zdania) oraz opcje podpowiedzi. */
export function talkTexts(): { phrases: string[]; options: string[] } {
  const phrases = new Set<string>();
  const options = new Set<string>();
  for (const { question } of TALK_ENTRIES) {
    phrases.add(question.q);
    phrases.add(question.answer);
    for (const option of question.options ?? []) options.add(option.en);
  }
  return { phrases: [...phrases], options: [...options] };
}
