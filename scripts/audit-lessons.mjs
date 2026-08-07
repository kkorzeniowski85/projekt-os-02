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

const root = path.join(fileURLToPath(new URL("../", import.meta.url)));
const wordsDir = path.join(root, "public", "audio", "words");
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

const missingWordAudio = [...allWords].filter((w) => !wordFiles.has(w.toLowerCase())).sort();
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
