/**
 * Audyt kompletności lekcji — sprawdzenia mechaniczne, deterministyczne.
 *
 * Wyłapuje to, co da się sprawdzić bez oceniania: brakujące lekcje, niespójne
 * dane, literówki w rozbiciu na grafemy, brakujące nagrania. Ocena językowa
 * (czy słowo naprawdę zawiera dany dźwięk, czy tłumaczenie jest trafne) to
 * osobna sprawa — tego skrypt nie próbuje rozstrzygać.
 *
 * Uruchomienie: npm run audit
 */

import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LESSONS, chipSoundId } from "../lib/curriculum/lessons.ts";
import { SOUNDS, getSound } from "../lib/curriculum/sounds.ts";
import { HEROES_BY_ID } from "../lib/heroes.ts";
import { TOPICS, audioSlug, vocabPhrases, vocabWords } from "../lib/curriculum/vocab.ts";
import { parentPhrases, phraseScene, wordExample } from "../lib/curriculum/vocabParent.ts";
import { allSentences, sentenceTexts } from "../lib/curriculum/sentences.ts";

const root = path.join(fileURLToPath(new URL("../", import.meta.url)));
const wordsDir = path.join(root, "public", "audio", "words");
const phrasesDir = path.join(root, "public", "audio", "phrases");
const phonemesDir = path.join(root, "public", "audio", "phonemes");

const problems = [];
const note = (severity, area, message) => problems.push({ severity, area, message });

/**
 * Odtwarza pisownię z rozbicia na grafemy. Dzielone dwuznaki ("a-e") wnoszą
 * pierwszą literę w swoim miejscu, a drugą na sam koniec słowa — tak działa
 * czarodziejskie "e" w cake / smile / home.
 */
function spellFromGraphemes(graphemes) {
  let core = "";
  let tail = "";
  for (const grapheme of graphemes) {
    if (grapheme.includes("-")) {
      const [head, end] = grapheme.split("-");
      core += head;
      tail = end;
    } else {
      core += grapheme;
    }
  }
  return core + tail;
}

// --- 1. Czy każdy dźwięk wymagający lekcji ją ma? ---------------------------

const needsLesson = SOUNDS.filter((sound) => sound.kind !== "single-letter");
const missingLessons = needsLesson.filter((sound) => !(sound.id in LESSONS));
for (const sound of missingLessons) {
  note("BŁĄD", "brak lekcji", `dźwięk "${sound.id}" (Set ${sound.set}) nie ma lekcji`);
}

const orphanLessons = Object.keys(LESSONS).filter((id) => !getSound(id));
for (const id of orphanLessons) {
  note("BŁĄD", "sierota", `lekcja "${id}" nie odpowiada żadnemu dźwiękowi w sounds.ts`);
}

// --- 2. Spójność wewnętrzna każdej lekcji ----------------------------------

const allWords = new Set();
const allChips = new Set();

for (const [id, lesson] of Object.entries(LESSONS)) {
  const sound = getSound(id);
  const grapheme = sound?.grapheme ?? id;

  if (lesson.soundId !== id) {
    note("BŁĄD", "spójność", `lekcja "${id}" ma w środku soundId="${lesson.soundId}"`);
  }
  if (!HEROES_BY_ID[lesson.heroId]) {
    note("BŁĄD", "postać", `lekcja "${id}" wskazuje nieistniejącą postać "${lesson.heroId}"`);
  }

  // Ćwiczenie 1: rozpoznawanie ze słuchu
  const withTarget = lesson.listen.filter((item) => item.hasTarget).length;
  const withoutTarget = lesson.listen.length - withTarget;
  if (withTarget === 0 || withoutTarget === 0) {
    note("BŁĄD", "słuchanie", `"${id}": brak równowagi TAK/NIE (${withTarget}/${withoutTarget})`);
  }
  if (lesson.listen.length < 6) {
    note("UWAGA", "słuchanie", `"${id}": tylko ${lesson.listen.length} pozycji (norma 8)`);
  }
  // Słowo oznaczone jako zawierające dźwięk powinno mieć w zapisie ten grafem.
  // Wyjątek: dzielone dwuznaki (a-e) i warianty (oo-zoo → "oo").
  //
  // ŚWIADOME WYJĄTKI (pisownia zawiera grafem, ale dźwięk jest inny — flaga
  // hasTarget opisuje DŹWIĘK, potwierdzone przeglądem fonetycznym):
  const SPELLING_EXCEPTIONS = new Set([
    "ure:picture", // -ture brzmi "czə", nie "juə" — celowy dystraktor
    // Lekcje pojedynczych liter uczą wprost, że LITERA to nie DŹWIĘK. Poniższe
    // słowa są w nich rdzeniem ćwiczenia, a nie pomyłką:
    "h:cheese", "h:bath", // "ch" i "th" to osobne dźwięki, "h" w nich nie brzmi
    "r:car", "r:star", "r:dinner", // brytyjskie (nierotyczne) — końcowe "r" nie brzmi
    "y:happy", "y:baby", // "y" na końcu to samogłoska, nie /j/
    "y:toy", // "oy" to jeden dźwięk
    "w:two", // nieme "w"
    "w:snow", "w:yellow", "w:cow", // "ow" to jeden dźwięk, nie /w/
    "z:nose", // dźwięk /z/ zapisany literą "s"
    "x:socks", // dźwięk /ks/ zapisany jako "cks"
    "b:thumb", // nieme "b"
    "l:walk", "l:talk", // nieme "l"
    "f:phone", // dźwięk /f/ zapisany jako "ph"
    "h:fish", // "sh" to jeden dźwięk
    "e:tree", "e:cake", "e:summer", // "ee", nieme "e", oraz "er" na końcu
    "a:car", "a:water", "a:cake", // "ar", "wa" i nieme "e" zmieniają dźwięk
    "s:nose", "s:shop", // końcowe "s" brzmi /z/; "sh" to jeden dźwięk
    "s:pencil", // w drugą stronę: /s/ zapisane literą "c"
    "d:walked", // końcówka "-ed" po bezdźwięcznej brzmi /t/
    "t:listen", "t:castle", // nieme "t"
    "i:night", // "igh" to jeden dźwięk
    "p:elephant", // "ph" to /f/
    "g:giraffe", // "g" przed "i" brzmi /dʒ/
    "o:boat", "o:rainbow", "o:book", // "oa", "ow", "oo" to osobne dźwięki
    "c:city", // "c" przed "i" brzmi /s/
    "k:knife", // nieme "k"
    "u:blue", // "ue" to długie /uː/
  ]);
  const plain = grapheme.replace("-", "");
  for (const item of lesson.listen) {
    const looksLikeTarget = grapheme.includes("-")
      ? new RegExp(`${grapheme[0]}[a-z]${grapheme[2]}`).test(item.word)
      : item.word.includes(plain);
    if (item.hasTarget && !looksLikeTarget && !SPELLING_EXCEPTIONS.has(`${id}:${item.word}`)) {
      note("UWAGA", "słuchanie", `"${id}": "${item.word}" oznaczone TAK, ale nie widać "${grapheme}"`);
    }
    if (!item.hasTarget && looksLikeTarget && !SPELLING_EXCEPTIONS.has(`${id}:${item.word}`)) {
      note("UWAGA", "słuchanie", `"${id}": "${item.word}" oznaczone NIE, a zawiera "${grapheme}"`);
    }
    allWords.add(item.word);
  }

  // Ćwiczenie 2: sklejanie
  if (lesson.blend.length < 3) {
    note("UWAGA", "sklejanie", `"${id}": tylko ${lesson.blend.length} słów (norma 5)`);
  }
  for (const card of lesson.blend) {
    const spelled = spellFromGraphemes(card.graphemes);
    if (spelled !== card.word) {
      note(
        "BŁĄD",
        "sklejanie",
        `"${id}": kawałki [${card.graphemes.join("+")}] składają się w "${spelled}", nie w "${card.word}"`,
      );
    }
    if (card.targetIndex < 0 || card.targetIndex >= card.graphemes.length) {
      note("BŁĄD", "sklejanie", `"${id}": "${card.word}" ma targetIndex poza zakresem`);
    } else {
      // Podwojona litera to w RWI wciąż ta sama głoska ("ll" w bell to /l/,
      // "zz" w buzz to /z/), więc jej podświetlenie jest poprawne.
      const wskazany = card.graphemes[card.targetIndex];
      const dopuszczalne = [grapheme, grapheme + grapheme];
      if (grapheme === "k" || grapheme === "c") dopuszczalne.push("ck");
      if (!dopuszczalne.includes(wskazany)) {
        note(
          "BŁĄD",
          "sklejanie",
          `"${id}": "${card.word}" podświetla "${wskazany}" zamiast "${grapheme}"`,
        );
      }
      if (!card.graphemes.some((g) => dopuszczalne.includes(g))) {
        note("BŁĄD", "sklejanie", `"${id}": "${card.word}" w ogóle nie zawiera ćwiczonego "${grapheme}"`);
      }
    }
    allWords.add(card.word);
    card.graphemes.forEach((g) => allChips.add(chipSoundId(g, id)));
  }

  // Ćwiczenie 3: wybór słowa
  if (lesson.choice.length < 3) {
    note("UWAGA", "wybór", `"${id}": tylko ${lesson.choice.length} rund (norma 4)`);
  }
  for (const round of lesson.choice) {
    if (!round.options.includes(round.answer)) {
      note("BŁĄD", "wybór", `"${id}": odpowiedź "${round.answer}" nie występuje wśród opcji`);
    }
    if (new Set(round.options).size !== round.options.length) {
      note("BŁĄD", "wybór", `"${id}": runda "${round.answer}" ma powtórzoną opcję`);
    }
    if (round.options.length < 3) {
      note("UWAGA", "wybór", `"${id}": runda "${round.answer}" ma tylko ${round.options.length} opcje`);
    }
    round.options.forEach((option) => allWords.add(option));
  }

  if (lesson.redWords.length === 0) {
    note("UWAGA", "red words", `"${id}": brak red words`);
  }
  lesson.redWords.forEach((word) => allWords.add(word));

  if (!lesson.chant || !lesson.parentIntro) {
    note("BŁĄD", "treść", `"${id}": brak zawołania lub wskazówki dla rodzica`);
  }
}

// --- 3. Pokrycie nagraniami -------------------------------------------------

const wordFiles = new Set(
  existsSync(wordsDir) ? readdirSync(wordsDir).map((f) => f.replace(/\.[^.]+$/, "").toLowerCase()) : [],
);
const phonemeFiles = new Set(
  existsSync(phonemesDir) ? readdirSync(phonemesDir).map((f) => f.replace(/\.[^.]+$/, "")) : [],
);

const missingWordAudio = [...allWords].filter((w) => !wordFiles.has(audioSlug(w))).sort();
for (const word of missingWordAudio) {
  note("BŁĄD", "audio słów", `brak nagrania dla "${word}"`);
}

const missingChipAudio = [...allChips].filter((c) => !phonemeFiles.has(c)).sort();
for (const chip of missingChipAudio) {
  note("BŁĄD", "audio głosek", `brak nagrania głoski "${chip}" (kafelek w sklejaniu)`);
}

const lessonSoundsWithoutPhoneme = Object.keys(LESSONS).filter((id) => !phonemeFiles.has(id));
for (const id of lessonSoundsWithoutPhoneme) {
  note("BŁĄD", "audio głosek", `brak nagrania głoski "${id}" (ekran wprowadzenia)`);
}

// --- 4. Emoji: tylko sprzed Unicode 12 (starsze tablety) --------------------

/*
 * Tylko emoji z Unicode 12 (2019) i nowszych — te potrafią być pustym
 * prostokątem na starszym tablecie. Zakresy sprawdzone po numerach: emoji z
 * Unicode 8-11 (🧀 U+1F9C0, 🦑 U+1F991, 🧸 U+1F9F8…) są bezpieczne i celowo
 * NIE są tu zgłaszane.
 */
const RISKY =
  /[\u{1FA70}-\u{1FAFF}\u{1F6D5}-\u{1F6DF}\u{1F7E0}-\u{1F7EB}\u{1F9A3}-\u{1F9AF}\u{1F9BB}-\u{1F9BF}\u{1F9CB}-\u{1F9CF}]|\u{1F90C}|\u{1F90F}|\u{1F971}|\u{1F97B}/u;
for (const [id, lesson] of Object.entries(LESSONS)) {
  const all = [...lesson.listen, ...lesson.blend, ...lesson.choice];
  for (const item of all) {
    if (RISKY.test(item.emoji)) {
      note("UWAGA", "emoji", `"${id}": "${item.emoji}" może się nie wyświetlić na starszym tablecie`);
    }
  }
}


// --- 5. Tor 2: tematy słownictwa -------------------------------------------
//
// Te same zasady co dla lekcji: sprawdzamy to, co da się sprawdzić bez
// oceniania. Czy kolokacja ma dokładnie jedną lukę, czy dystraktor nie jest
// przypadkiem poprawną odpowiedzią, czy jest z czego zbudować wybór.

const phraseFiles = existsSync(phrasesDir)
  ? new Set(readdirSync(phrasesDir).map((file) => file.replace(/\.[^.]+$/, "")))
  : new Set();

const topicIds = new Set();
for (const topic of TOPICS) {
  if (topicIds.has(topic.id)) {
    note("BŁĄD", "temat", `powtórzony identyfikator tematu "${topic.id}"`);
  }
  topicIds.add(topic.id);

  if (!HEROES_BY_ID[topic.heroId]) {
    note("BŁĄD", "postać", `temat "${topic.id}" wskazuje nieistniejącą postać "${topic.heroId}"`);
  }

  // Wybór z mniej niż trzech opcji da się zbudować (dobieramy z innych tematów),
  // ale własny materiał zawsze myli sensowniej niż pożyczony.
  if (topic.words.length < 3) {
    note("UWAGA", "temat", `"${topic.id}": tylko ${topic.words.length} słów (norma 6-8)`);
  }
  if (topic.phrases.length < 3) {
    note("UWAGA", "temat", `"${topic.id}": tylko ${topic.phrases.length} zwrotów`);
  }
  if (topic.commands.length < 3) {
    note(
      "UWAGA",
      "temat",
      `"${topic.id}": ${topic.commands.length} poleceń — dystraktory pójdą z innych tematów`,
    );
  }

  const enWords = new Set();
  for (const word of topic.words) {
    if (enWords.has(word.en)) {
      note("BŁĄD", "słownictwo", `"${topic.id}": słowo "${word.en}" powtórzone w temacie`);
    }
    enWords.add(word.en);
    if (!word.pl?.trim()) {
      note("BŁĄD", "słownictwo", `"${topic.id}": słowo "${word.en}" bez tłumaczenia`);
    }
  }

  for (const phrase of [...topic.phrases, ...topic.commands]) {
    if (!audioSlug(phrase.en)) {
      note("BŁĄD", "zwrot", `"${topic.id}": zwrot "${phrase.en}" daje pustą nazwę pliku`);
    }
  }

  for (const collocation of topic.collocations) {
    const gaps = collocation.gap.split("___").length - 1;
    if (gaps !== 1) {
      note(
        "BŁĄD",
        "kolokacja",
        `"${topic.id}": "${collocation.en}" ma ${gaps} luk zamiast jednej`,
      );
    }
    // Odpowiedź musi być jednym słowem: tylko wtedy ma własne nagranie
    // w /audio/words i tylko wtedy przycisk wyboru daje się przeczytać.
    if (/\s/.test(collocation.answer)) {
      note(
        "BŁĄD",
        "kolokacja",
        `"${topic.id}": odpowiedź "${collocation.answer}" jest wielowyrazowa`,
      );
    }
    if (collocation.distractors.includes(collocation.answer)) {
      note(
        "BŁĄD",
        "kolokacja",
        `"${topic.id}": "${collocation.answer}" jest jednocześnie odpowiedzią i dystraktorem`,
      );
    }
    if (collocation.distractors.length < 2) {
      note("UWAGA", "kolokacja", `"${topic.id}": "${collocation.en}" ma mniej niż 2 dystraktory`);
    }
    // Wstawienie odpowiedzi w lukę musi dać dokładnie deklarowane wyrażenie —
    // inaczej dziecko zobaczy co innego, niż usłyszy.
    const zlozone = collocation.gap.replace("___", collocation.answer);
    if (zlozone.toLowerCase() !== collocation.en.toLowerCase()) {
      note(
        "BŁĄD",
        "kolokacja",
        `"${topic.id}": luka daje "${zlozone}", a wyrażenie to "${collocation.en}"`,
      );
    }
  }

  const emoji = [
    topic.emoji,
    ...topic.words.map((w) => w.emoji),
    ...topic.phrases.map((p) => p.emoji),
    ...topic.commands.map((c) => c.emoji),
    ...topic.collocations.map((c) => c.emoji),
  ];
  for (const znak of emoji) {
    if (RISKY.test(znak)) {
      note("UWAGA", "emoji", `"${topic.id}": "${znak}" może się nie wyświetlić na starszym tablecie`);
    }
  }
}

// Nagrania toru 2 nie są warunkiem działania (bez pliku czyta syntezator), więc
// ich brak to UWAGA, nie BŁĄD.
const vWords = vocabWords();
// Pula zwrotow obejmuje tez kwestie scenek i zdania przykladowe trybu
// z rodzicem - graja tym samym mechanizmem, wiec obowiazuje ta sama kontrola.
const vPhrases = [...new Set([...vocabPhrases(), ...parentPhrases()])].sort();
const brakSlow = vWords.filter((word) => !wordFiles.has(audioSlug(word)));
const brakZwrotow = vPhrases.filter((phrase) => !phraseFiles.has(audioSlug(phrase)));
if (brakSlow.length > 0) {
  note("UWAGA", "audio tor 2", `${brakSlow.length} słów bez nagrania: ${brakSlow.slice(0, 8).join(", ")}${brakSlow.length > 8 ? "…" : ""}`);
}
// --- Mini-czytanki: kontrola dekodowalnosci wg pozycji w sekwencji ----------
//
// Zdanie lekcji N moze uzywac WYLACZNIE grafemow dzwiekow 1..N oraz red words
// poznanych do lekcji N wlacznie. Zlamanie tej zasady to BLAD: dziecko
// dostaloby slowo, ktorego nie ma prawa umiec przeczytac.
//
// Dekodowalnosc liczymy programowaniem dynamicznym po dozwolonych grafemach,
// z jedna poprawka: split digraph (a-e w "cake") rozpoznajemy wzorcem
// samogloska-spolgloska-e i sciagamy konczace "e" przed rozkladem.
{
  const zdaniaWg = allSentences();
  const kolejnosc = SOUNDS.map((sound) => sound.id);
  const grafemyNarastajaco = [];
  const redNarastajaco = [];
  let dotychczasGrafemy = [];
  let dotychczasRed = new Set();
  for (const soundId of kolejnosc) {
    dotychczasGrafemy = [...dotychczasGrafemy, ...SOUNDS.filter((s) => s.id === soundId).map((s) => s.grapheme.toLowerCase())];
    for (const w of LESSONS[soundId]?.redWords ?? []) dotychczasRed.add(w.toLowerCase());
    grafemyNarastajaco.push([...new Set(dotychczasGrafemy)]);
    redNarastajaco.push(new Set(dotychczasRed));
  }

  const daSieZlozyc = (slowo, tokeny) => {
    const n = slowo.length;
    const dp = new Array(n + 1).fill(false);
    dp[0] = true;
    for (let i = 0; i < n; i++) {
      if (!dp[i]) continue;
      for (const token of tokeny) {
        if (slowo.startsWith(token, i)) dp[i + token.length] = true;
      }
    }
    return dp[n];
  };

  const dekodowalne = (surowe, grafemy, redy) => {
    const slowo = surowe.toLowerCase().replace(/[^a-z]/g, "");
    if (!slowo) return true;
    if (redy.has(slowo)) return true;
    // tokeny ciagle: grafemy bez split digraphow (te maja myslnik w id, ale
    // grapheme moze byc np. "a-e" — token ciagly to wersja bez myslnika nie
    // istnieje, wiec filtrujemy)
    const ciagle = grafemy.filter((g) => !g.includes("-"));
    if (daSieZlozyc(slowo, ciagle)) return true;
    // split digraph: ...V C e  -> sciagnij "e", wymagaj tokenu "V-e"
    const m = slowo.match(/^(.*)([aiou])([bcdfghjklmnprstvwz])e$/);
    if (m && grafemy.includes(`${m[2]}-e`)) {
      return daSieZlozyc(`${m[1]}${m[2]}${m[3]}`, ciagle);
    }
    return false;
  };

  for (const [soundId, zdania] of Object.entries(zdaniaWg)) {
    const pozycja = kolejnosc.indexOf(soundId);
    if (pozycja < 0) {
      note("BŁĄD", "czytanki", `zdanie dla nieznanego dźwięku "${soundId}"`);
      continue;
    }
    const grafemy = grafemyNarastajaco[pozycja];
    const redy = redNarastajaco[pozycja];
    for (const zdanie of zdania) {
      for (const slowo of zdanie.en.split(/\s+/)) {
        if (!dekodowalne(slowo, grafemy, redy)) {
          note(
            "BŁĄD",
            "czytanki",
            `lekcja "${soundId}": słowo "${slowo}" w zdaniu "${zdanie.en}" wyprzedza sekwencję (niedekodowalne na tym etapie)`,
          );
        }
      }
    }
  }

  const lekcjeBezCzytanki = kolejnosc.filter(
    (soundId) => LESSONS[soundId] && (zdaniaWg[soundId] ?? []).length === 0,
  );
  if (lekcjeBezCzytanki.length > 0) {
    note("UWAGA", "czytanki", `${lekcjeBezCzytanki.length} lekcji bez mini-czytanki: ${lekcjeBezCzytanki.slice(0, 8).join(", ")}`);
  }
  const zdanBezAudio = sentenceTexts().filter((t) => !phraseFiles.has(audioSlug(t)));
  if (zdanBezAudio.length > 0) {
    note("UWAGA", "czytanki", `${zdanBezAudio.length} zdań bez nagrania — uruchom: npm run audio`);
  }
}

const slowaBezPrzykladu = [...new Set(TOPICS.flatMap((t) => t.words.map((w) => w.en)))].filter(
  (w) => !wordExample(w),
);
if (slowaBezPrzykladu.length > 0) {
  note("UWAGA", "tryb z rodzicem", `${slowaBezPrzykladu.length} słów bez zdania przykładowego: ${slowaBezPrzykladu.slice(0, 6).join(", ")}${slowaBezPrzykladu.length > 6 ? "…" : ""}`);
}
const zwrotyBezScenki = [...new Set(TOPICS.flatMap((t) => t.phrases.map((p) => p.en)))].filter(
  (p) => phraseScene(p).length === 0,
);
if (zwrotyBezScenki.length > 0) {
  note("UWAGA", "tryb z rodzicem", `${zwrotyBezScenki.length} zwrotów bez scenki: ${zwrotyBezScenki.slice(0, 6).join(", ")}${zwrotyBezScenki.length > 6 ? "…" : ""}`);
}
if (brakZwrotow.length > 0) {
  note("UWAGA", "audio tor 2", `${brakZwrotow.length} zwrotów bez nagrania (czyta syntezator) — uruchom: npm run audio`);
}

/*
 * Wspoldzielenie nagran przez slug.
 *
 * Ten sam slug moga dac tylko teksty rozniace sie wylacznie interpunkcja i
 * wielkoscia liter — czyli TA SAMA wypowiedz, np. polecenie "Tidy up." i
 * kolokacja "tidy up". Wspolny plik jest wtedy zamierzony, nie bledny: to jedno
 * zdanie i ma brzmiec tak samo. Zgłaszamy to jako informacje, zeby bylo widac,
 * ile plikow faktycznie powstanie, ale bledem to nie jest.
 */
const slugi = new Map();
let wspolne = 0;
for (const phrase of vPhrases) {
  const slug = audioSlug(phrase);
  if (!slug) {
    note("BŁĄD", "zwrot", `"${phrase}" daje pustą nazwę pliku`);
    continue;
  }
  if (slugi.has(slug)) wspolne++;
  else slugi.set(slug, phrase);
}

// --- raport -----------------------------------------------------------------

const lessonCount = Object.keys(LESSONS).length;
const errors = problems.filter((p) => p.severity === "BŁĄD");
const warnings = problems.filter((p) => p.severity === "UWAGA");

console.log("=".repeat(74));
console.log("AUDYT LEKCJI — sprawdzenia mechaniczne");
console.log("=".repeat(74));
console.log(`Lekcje:            ${lessonCount} (wymagane: ${needsLesson.length})`);
console.log(`Unikalne słowa:    ${allWords.size}   nagrania: ${wordFiles.size}`);
console.log(`Kafelki głosek:    ${allChips.size}   nagrania głosek: ${phonemeFiles.size}`);
console.log(`Tematy (tor 2):    ${TOPICS.length}   słowa: ${vWords.length}   zwroty: ${vPhrases.length}`);
console.log(`Pliki zwrotów:     ${slugi.size} do wygenerowania (${wspolne} wypowiedzi współdzieli plik)   są: ${phraseFiles.size}`);
console.log(`Błędy: ${errors.length}   Uwagi: ${warnings.length}`);
console.log("=".repeat(74));

for (const group of ["BŁĄD", "UWAGA"]) {
  const rows = problems.filter((p) => p.severity === group);
  if (rows.length === 0) continue;
  console.log(`\n--- ${group} (${rows.length}) ---`);
  for (const row of rows) console.log(`  [${row.area}] ${row.message}`);
}

if (problems.length === 0) console.log("\nBez zastrzeżeń mechanicznych.");
process.exit(errors.length > 0 ? 1 : 0);
