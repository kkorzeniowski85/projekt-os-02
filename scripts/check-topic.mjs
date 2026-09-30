/**
 * Sprawdzarka jednego nowego tematu słownictwa z pliku JSON — do pracy nad
 * treścią, zanim trafi do lib/curriculum/vocab.ts i vocabParent.ts.
 *
 * Format pliku: { topic: Topic, examples: {słowo: {en, pl}},
 *                 scenes: {zwrot: [{kto, en, pl}]}, notes: {zwrot: tekst} }
 *
 * Uruchomienie:  npx tsx scripts/check-topic.mjs sciezka/tematu.json
 * Kod wyjścia 1 przy błędach.
 */
import { readFileSync } from "node:fs";
import { TOPICS, audioSlug } from "../lib/curriculum/vocab.ts";
import { phraseScene, wordExample } from "../lib/curriculum/vocabParent.ts";
import { HEROES_BY_ID } from "../lib/heroes.ts";

const file = process.argv[2];
if (!file) {
  console.error("Podaj ścieżkę do pliku JSON z tematem.");
  process.exit(2);
}
const data = JSON.parse(readFileSync(file, "utf8"));
const { topic, examples = {}, scenes = {}, notes = {} } = data;
const problems = [];
const err = (m) => problems.push(["BŁĄD", m]);
const warn = (m) => problems.push(["UWAGA", m]);

// Emoji sprzed Unicode 12: odrzucamy znane nowsze zakresy (bloki dodane
// w 2019+). Nie jest to pełna tabela, ale łapie typowe wpadki.
const NEW_EMOJI = /[\u{1F6D5}-\u{1F6D7}\u{1F6FA}-\u{1F6FC}\u{1F7E0}-\u{1F7EB}\u{1F90C}\u{1F90D}\u{1F90E}\u{1F90F}\u{1F971}\u{1F972}\u{1F977}\u{1F978}\u{1F97B}\u{1F9A3}\u{1F9A4}\u{1F9A5}-\u{1F9AA}\u{1F9AB}-\u{1F9AD}\u{1F9AE}\u{1F9AF}\u{1F9BA}-\u{1F9BF}\u{1F9C3}-\u{1F9CA}\u{1F9CB}\u{1F9CD}-\u{1F9CF}\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;
const checkEmoji = (where, e) => {
  if (typeof e !== "string" || !e) err(`${where}: brak emoji`);
  else if (NEW_EMOJI.test(e)) err(`${where}: emoji „${e}” jest za nowe (po Unicode 11) — na starszych tabletach będzie pustym prostokątem`);
};
const str = (where, v) => {
  if (typeof v !== "string" || !v.trim()) err(`${where}: puste pole`);
};

if (!topic || typeof topic !== "object") {
  err("brak obiektu topic");
} else {
  for (const f of ["id", "titlePl", "goalPl", "emoji", "heroId", "parentIntroPl"]) str(`topic.${f}`, topic[f]);
  if (topic.id && !/^[a-z0-9-]+$/.test(topic.id)) err("topic.id: tylko małe litery, cyfry, myślniki");
  if (TOPICS.some((t) => t.id === topic.id)) err(`topic.id „${topic.id}” już istnieje`);
  if (topic.heroId && !HEROES_BY_ID[topic.heroId]) err(`nieznany heroId „${topic.heroId}”`);
  checkEmoji("topic", topic.emoji);

  const existingWords = new Set(TOPICS.flatMap((t) => t.words.map((w) => w.en.toLowerCase())));
  const existingPhrases = new Set(
    TOPICS.flatMap((t) => [
      ...t.phrases.map((p) => p.en),
      ...t.commands.map((c) => c.en),
      ...(t.situations ?? []).map((s) => s.en),
      ...t.collocations.map((c) => c.en),
    ]).map((s) => audioSlug(s)),
  );

  const words = topic.words ?? [];
  if (words.length < 10 || words.length > 12) warn(`${words.length} słów (ma być 10–12)`);
  const seen = new Set();
  for (const w of words) {
    str(`słowo`, w.en);
    str(`słowo „${w.en}”.pl`, w.pl);
    checkEmoji(`słowo „${w.en}”`, w.emoji);
    const k = (w.en ?? "").toLowerCase();
    if (seen.has(k)) err(`słowo „${w.en}” powtórzone`);
    seen.add(k);
    if (existingWords.has(k)) err(`słowo „${w.en}” jest już w innym temacie — wybierz inne`);
    if (wordExample(w.en)) err(`słowo „${w.en}” ma już zdanie przykładowe w innym temacie`);
    if (!examples[w.en]) err(`słowo „${w.en}”: brak zdania przykładowego w examples`);
    else {
      str(`przykład „${w.en}”.en`, examples[w.en].en);
      str(`przykład „${w.en}”.pl`, examples[w.en].pl);
      if (examples[w.en].en && !examples[w.en].en.toLowerCase().includes(k)) warn(`przykład dla „${w.en}” nie zawiera tego słowa`);
    }
  }

  const phrases = topic.phrases ?? [];
  if (phrases.length < 5 || phrases.length > 6) warn(`${phrases.length} zwrotów (ma być 5–6)`);
  for (const p of phrases) {
    str("zwrot", p.en);
    str(`zwrot „${p.en}”.pl`, p.pl);
    str(`zwrot „${p.en}”.situationPl`, p.situationPl);
    checkEmoji(`zwrot „${p.en}”`, p.emoji);
    if (existingPhrases.has(audioSlug(p.en ?? ""))) err(`zwrot „${p.en}” już istnieje w innym temacie`);
    if (phraseScene(p.en).length) err(`zwrot „${p.en}” ma już scenkę w innym temacie`);
    const scene = scenes[p.en];
    if (!Array.isArray(scene) || scene.length < 3 || scene.length > 5) err(`zwrot „${p.en}”: scenka musi mieć 3–5 kwestii`);
    else {
      if (!scene.some((l) => l.kto === "Ty" && l.en === p.en)) err(`scenka „${p.en}”: brak kwestii dziecka (kto: "Ty") z DOKŁADNIE tym zwrotem`);
      for (const l of scene) {
        str(`scenka „${p.en}” kto`, l.kto);
        str(`scenka „${p.en}” en`, l.en);
        str(`scenka „${p.en}” pl`, l.pl);
      }
    }
  }
  for (const k of Object.keys(scenes)) if (!phrases.some((p) => p.en === k)) err(`scenka dla „${k}”, którego nie ma w phrases`);
  for (const k of Object.keys(notes)) if (!phrases.some((p) => p.en === k)) err(`niuans dla „${k}”, którego nie ma w phrases`);
  for (const k of Object.keys(examples)) if (!words.some((w) => w.en === k)) err(`przykład dla „${k}”, którego nie ma w words`);

  const commands = topic.commands ?? [];
  if (commands.length < 3 || commands.length > 4) warn(`${commands.length} poleceń (ma być 3–4)`);
  for (const c of commands) {
    str("polecenie", c.en);
    str(`polecenie „${c.en}”.pl`, c.pl);
    str(`polecenie „${c.en}”.actionPl`, c.actionPl);
    checkEmoji(`polecenie „${c.en}”`, c.emoji);
    if (existingPhrases.has(audioSlug(c.en ?? ""))) err(`polecenie „${c.en}” już istnieje w innym temacie`);
  }

  for (const s of topic.situations ?? []) {
    str("sytuacja", s.en);
    if (s.en && !/^What do you do when /.test(s.en)) err(`sytuacja „${s.en}” musi zaczynać się od „What do you do when ”`);
    str(`sytuacja „${s.en}”.pl`, s.pl);
    str(`sytuacja „${s.en}”.actionPl`, s.actionPl);
    checkEmoji(`sytuacja „${s.en}”`, s.emoji);
  }

  const cols = topic.collocations ?? [];
  if (cols.length < 3 || cols.length > 4) warn(`${cols.length} kolokacji (ma być 3–4)`);
  for (const c of cols) {
    str("kolokacja", c.en);
    str(`kolokacja „${c.en}”.pl`, c.pl);
    checkEmoji(`kolokacja „${c.en}”`, c.emoji);
    if ((c.gap ?? "").split("___").length !== 2) err(`kolokacja „${c.en}”: gap musi mieć dokładnie jedno ___`);
    if (!/^[a-z]+$/.test(c.answer ?? "")) err(`kolokacja „${c.en}”: answer to jedno słowo małymi literami`);
    if ((c.gap ?? "").replace("___", c.answer ?? "") !== c.en) err(`kolokacja „${c.en}”: gap z answer nie daje en`);
    if (!Array.isArray(c.distractors) || c.distractors.length !== 2) err(`kolokacja „${c.en}”: dokładnie 2 dystraktory`);
    for (const d of c.distractors ?? []) if (!/^[a-z]+$/.test(d)) err(`kolokacja „${c.en}”: dystraktor „${d}” to jedno słowo małymi literami`);
    if (existingPhrases.has(audioSlug(c.en ?? ""))) err(`kolokacja „${c.en}” już istnieje w innym temacie`);
  }
}

for (const group of ["BŁĄD", "UWAGA"]) {
  const rows = problems.filter((p) => p[0] === group);
  if (!rows.length) continue;
  console.log(`\n--- ${group} (${rows.length}) ---`);
  for (const r of rows) console.log(`  ${r[1]}`);
}
const errors = problems.filter((p) => p[0] === "BŁĄD").length;
console.log(errors === 0 ? "\nOK — bez błędów." : `\n${errors} błędów.`);
process.exit(errors > 0 ? 1 : 0);
