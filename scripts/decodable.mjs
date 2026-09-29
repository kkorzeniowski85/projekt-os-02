/**
 * Dekodowalność wg pozycji w sekwencji RWI — wspólny kawałek audytu
 * (scripts/audit-lessons.mjs) i sprawdzarki pojedynczej książeczki
 * (scripts/check-book.mjs).
 *
 * Tekst „po lekcji N" może używać WYŁĄCZNIE grafemów dźwięków 1..N oraz red
 * words poznanych do lekcji N włącznie. Dekodowalność liczymy programowaniem
 * dynamicznym po dozwolonych grafemach, z jedną poprawką: split digraph (a-e w
 * "cake") rozpoznajemy wzorcem samogłoska-spółgłoska-e i ściągamy kończące "e"
 * przed rozkładem. Podwojone litery (ll, ss) i "ck" składają się z pojedynczych
 * liter — świadomy kompromis, ten sam co w sentences.ts.
 */
import { LESSONS } from "../lib/curriculum/lessons.ts";
import { SOUNDS } from "../lib/curriculum/sounds.ts";

/** Kolejność dźwięków = kolejność lekcji. */
export const ORDER = SOUNDS.map((sound) => sound.id);

/**
 * Etap po każdej lekcji: { graphemes, red } narastająco. stages[i] to stan po
 * lekcji ORDER[i].
 */
export const STAGES = (() => {
  const stages = [];
  let graphemes = [];
  const red = new Set();
  for (const soundId of ORDER) {
    graphemes = [
      ...graphemes,
      ...SOUNDS.filter((s) => s.id === soundId).map((s) => s.grapheme.toLowerCase()),
    ];
    for (const word of LESSONS[soundId]?.redWords ?? []) red.add(word.toLowerCase());
    stages.push({ soundId, graphemes: [...new Set(graphemes)], red: new Set(red) });
  }
  return stages;
})();

export function stageAfter(soundId) {
  const index = ORDER.indexOf(soundId);
  return index < 0 ? null : STAGES[index];
}

function canCompose(word, tokens) {
  const n = word.length;
  const dp = new Array(n + 1).fill(false);
  dp[0] = true;
  for (let i = 0; i < n; i++) {
    if (!dp[i]) continue;
    for (const token of tokens) {
      if (word.startsWith(token, i)) dp[i + token.length] = true;
    }
  }
  return dp[n];
}

/** Gołe słowo: małe litery, bez interpunkcji. Puste = nic do sprawdzenia. */
export function bare(word) {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

/** Czy słowo (bez red words) składa się z dozwolonych grafemów. */
export function composable(rawWord, stage) {
  const word = bare(rawWord);
  if (!word) return true;
  // Tokeny ciągłe: grafemy bez split digraphów (te mają myślnik).
  const plain = stage.graphemes.filter((g) => !g.includes("-"));
  if (canCompose(word, plain)) return true;
  // Split digraph: ...V C e -> ściągnij "e", wymagaj tokenu "V-e".
  const m = word.match(/^(.*)([aiou])([bcdfghjklmnprstvwz])e$/);
  if (m && stage.graphemes.includes(`${m[2]}-e`)) {
    return canCompose(`${m[1]}${m[2]}${m[3]}`, plain);
  }
  return false;
}

/** Czy słowo da się przeczytać na tym etapie: red word albo złożenie grafemów. */
export function decodable(rawWord, stage) {
  const word = bare(rawWord);
  if (!word) return true;
  if (stage.red.has(word)) return true;
  return composable(rawWord, stage);
}

const words = (text) => text.split(/\s+/).filter((w) => bare(w));

/**
 * Sprawdzenie jednej książeczki. Zwraca listę { severity: "BŁĄD" | "UWAGA",
 * message }. `files` (opcjonalne): { wordFiles, phraseFiles, audioSlug } do
 * kontroli nagrań.
 */
export function checkBook(book, files) {
  const out = [];
  const err = (message) => out.push({ severity: "BŁĄD", message });
  const warn = (message) => out.push({ severity: "UWAGA", message });
  const id = book.id ?? "?";

  for (const field of ["id", "titleEn", "titlePl", "emoji", "afterSoundId"]) {
    if (typeof book[field] !== "string" || !book[field]) err(`"${id}": brak pola ${field}`);
  }
  if (book.id && !/^[a-z0-9-]+$/.test(book.id)) err(`"${id}": id tylko z małych liter, cyfr i myślników`);
  const stage = stageAfter(book.afterSoundId);
  if (!stage) {
    err(`"${id}": nieznany dźwięk bramki "${book.afterSoundId}"`);
    return out;
  }
  const pages = Array.isArray(book.pages) ? book.pages : [];
  if (pages.length < 6 || pages.length > 12) warn(`"${id}": ${pages.length} stron (zwykle 8–12)`);

  // Strony: każde słowo dekodowalne na tym etapie.
  const usedRed = new Set();
  const usedWords = new Set();
  let pagesWithGate = 0;
  const gate = SOUNDS.find((s) => s.id === book.afterSoundId)?.grapheme.toLowerCase() ?? "";
  pages.forEach((page, index) => {
    const n = index + 1;
    if (!page || typeof page.en !== "string" || !page.en.trim()) {
      err(`"${id}": strona ${n} bez tekstu`);
      return;
    }
    if (typeof page.pl !== "string" || !page.pl.trim()) err(`"${id}": strona ${n} bez tłumaczenia`);
    if (typeof page.emoji !== "string" || !page.emoji) warn(`"${id}": strona ${n} bez emoji`);
    if (/['’]/.test(page.en)) warn(`"${id}": strona ${n} ma apostrof („${page.en}”) — unikaj skrótów i dopełniacza`);
    const ws = words(page.en);
    if (ws.length > 14) warn(`"${id}": strona ${n} ma ${ws.length} słów (za dużo na jedną stronę)`);
    const sentences = page.en.split(/[.!?]+/).filter((s) => s.trim()).length;
    if (sentences > 2) warn(`"${id}": strona ${n} ma ${sentences} zdania (max 2)`);
    if (gate && ws.some((w) => bare(w).includes(gate.replace("-", "")))) pagesWithGate += 1;
    for (const w of ws) {
      const b = bare(w);
      usedWords.add(b);
      if (stage.red.has(b) && !composable(w, stage)) usedRed.add(b);
      if (!decodable(w, stage)) {
        err(`"${id}": strona ${n}: słowo "${w}" wyprzedza sekwencję (niedekodowalne po lekcji "${book.afterSoundId}")`);
      }
    }
  });
  if (pages.length > 0 && pagesWithGate < 3) {
    warn(`"${id}": dźwięk bramki "${gate}" pojawia się tylko na ${pagesWithGate} stronach (książeczka ma go ćwiczyć)`);
  }

  // Zielone słowa: dekodowalne bez red words i naprawdę użyte w tekście.
  const green = Array.isArray(book.greenWords) ? book.greenWords : [];
  if (green.length < 6 || green.length > 14) warn(`"${id}": ${green.length} zielonych słów (zwykle 8–12)`);
  for (const w of green) {
    const b = bare(w);
    if (b !== w) err(`"${id}": zielone słowo "${w}" — tylko małe litery, bez znaków`);
    if (!composable(w, stage)) err(`"${id}": zielone słowo "${w}" nie składa się z poznanych dźwięków`);
    if (stage.red.has(b) && !composable(w, stage)) err(`"${id}": zielone słowo "${w}" to red word — należy do czerwonych`);
    if (!usedWords.has(b)) warn(`"${id}": zielone słowo "${w}" nie występuje na żadnej stronie`);
  }

  // Czerwone słowa: poznane do tej lekcji, użyte, i żadne użyte nie pominięte.
  const red = Array.isArray(book.redWords) ? book.redWords : [];
  for (const w of red) {
    const b = bare(w);
    if (b !== w) err(`"${id}": czerwone słowo "${w}" — tylko małe litery`);
    if (!stage.red.has(b)) err(`"${id}": czerwone słowo "${w}" nie jest jeszcze poznane po lekcji "${book.afterSoundId}"`);
    if (!usedWords.has(b)) warn(`"${id}": czerwone słowo "${w}" nie występuje na żadnej stronie`);
  }
  for (const b of usedRed) {
    if (!red.includes(b)) err(`"${id}": red word "${b}" jest w tekście, ale nie na liście redWords (okładka musi je pokazać)`);
  }

  // Dźwięki do rozgrzewki: poznane; bramka wśród nich.
  const focus = Array.isArray(book.focusGraphemes) ? book.focusGraphemes : [];
  if (focus.length < 2 || focus.length > 8) warn(`"${id}": ${focus.length} dźwięków rozgrzewki (zwykle 3–6)`);
  for (const g of focus) {
    if (!stage.graphemes.includes(g)) err(`"${id}": dźwięk rozgrzewki "${g}" nie jest jeszcze poznany`);
  }
  if (gate && !focus.includes(gate)) warn(`"${id}": dźwięk bramki "${gate}" nie jest wśród dźwięków rozgrzewki`);

  const questions = Array.isArray(book.questions) ? book.questions : [];
  if (questions.length < 2 || questions.length > 4) warn(`"${id}": ${questions.length} pytań (zwykle 3)`);
  questions.forEach((q, i) => {
    if (!q || typeof q.en !== "string" || !q.en.trim()) err(`"${id}": pytanie ${i + 1} bez treści`);
    if (!q || typeof q.pl !== "string" || !q.pl.trim()) err(`"${id}": pytanie ${i + 1} bez polskiej wersji`);
  });

  if (files) {
    const missingWords = [...green, ...red].filter((w) => !files.wordFiles.has(bare(w)));
    if (missingWords.length > 0) warn(`"${id}": ${missingWords.length} słów rozgrzewki bez nagrania: ${missingWords.slice(0, 6).join(", ")}`);
    const texts = [...pages.map((p) => p?.en ?? ""), ...questions.map((q) => q?.en ?? "")].filter(Boolean);
    const missingTexts = texts.filter((t) => !files.phraseFiles.has(files.audioSlug(t)));
    if (missingTexts.length > 0) warn(`"${id}": ${missingTexts.length} stron/pytań bez nagrania — uruchom: npm run audio`);
  }

  return out;
}
