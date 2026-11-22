/**
 * Nagrania lektorów ElevenLabs — dwa głosy (lib/voices.ts): Alice i George.
 *
 * Pliki: public/audio/<głos>/words|phrases/<slug>.mp3 — slug z audioSlug, tej
 * samej funkcji, której używa aplikacja (lib/audio.ts → voiceClipPath).
 * Dawne nagrania (public/audio/words|phrases) zostają zapasem.
 *
 * Co nagrywamy (budżet znaków — patrz lib/voices.ts):
 *  - słowa, zwroty lekcji, zdania z ćwiczeń — oba głosy;
 *  - zdania przykładowe słów — jeden głos, na zmianę według kolejności;
 *  - kwestie scenek — głos roli (sceneLineVoice);
 *  - książeczki (strony i pytania) — głos książeczki (bookVoice).
 *
 * Klucz: plik %USERPROFILE%\.elevenlabs\api-key.txt (poza repozytorium i
 * poza dyskiem Google). Skrypt go nie wypisuje.
 *
 * Uruchomienie:
 *   npm run audio:eleven -- --dry               # tylko policz znaki, bez API
 *   npm run audio:eleven -- --sample            # mała próbka do odsłuchu
 *   npm run audio:eleven -- --only words        # words | phrases | scenes | examples | books
 *   npm run audio:eleven -- --max-chars 20000   # zatrzymaj się po tylu znakach
 * Gotowe pliki są pomijane (bez ponownego zużycia znaków).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lessonWords } from "../lib/curriculum/lessons.ts";
import { audioSlug, vocabPhrases, vocabWords } from "../lib/curriculum/vocab.ts";
import { allScenes, allWordExamples } from "../lib/curriculum/vocabParent.ts";
import { sceneLineVoice } from "../lib/curriculum/scenes.ts";
import { sentenceTexts } from "../lib/curriculum/sentences.ts";
import { BOOKS, bookVoice, bookWords } from "../lib/curriculum/books.ts";
import { ELEVEN_VOICE_IDS, VOICES, voiceByIndex } from "../lib/voices.ts";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const sample = args.includes("--sample");
const onlyArg = args.indexOf("--only");
const only = onlyArg >= 0 ? args[onlyArg + 1] : null;
const maxArg = args.indexOf("--max-chars");
const maxChars = maxArg >= 0 ? Number(args[maxArg + 1]) : Infinity;

/** Tempo 0,8 — wolniej niż domyślne; resztę reguluje suwak w aplikacji. */
const SPEED = 0.8;
const MODEL = "eleven_multilingual_v2";
/** 64 kb/s mono wystarcza na mowę, a pliki są o połowę mniejsze niż przy 128. */
const FORMAT = "mp3_44100_64";
const PARALLEL = 3;

/**
 * ElevenLabs często przelatuje przez przecinek („Look, like this” brzmiało
 * jak „look like this”). Znacznik pauzy 0,3 s po każdym przecinku — wybór
 * rodzica z porównania 2026-11-22 (lepszy niż wielokropek czy myślnik).
 * Przecinek w liczbie („1,000”) nie ma spacji, więc go nie dotyczy.
 */
const spoken = (text) => text.replace(/,\s+/g, ', <break time="0.3s" /> ');

const root = fileURLToPath(new URL("../", import.meta.url));
const audioDir = path.join(root, "public", "audio");

// --- Lista zadań -----------------------------------------------------------------

/** @type {Map<string, {voice: string, kind: string, text: string, group: string}>} */
const jobs = new Map();
function add(group, kind, voice, text) {
  const key = `${voice}/${kind}/${audioSlug(text)}`;
  if (!jobs.has(key)) jobs.set(key, { voice, kind, text, group });
}

const SAMPLE_WORDS = ["ship", "cake", "frog", "week", "rain", "night"];
const SAMPLE_PHRASES = ["I don't understand.", "Can I go to the toilet, please?"];

const words = [...new Set([...lessonWords(), ...vocabWords(), ...bookWords()])].sort();
const bothPhrases = [...new Set([...vocabPhrases(), ...sentenceTexts()])].sort();
const scenes = allScenes();

if (sample) {
  for (const word of SAMPLE_WORDS) for (const voice of VOICES) add("words", "words", voice, word);
  for (const text of SAMPLE_PHRASES) for (const voice of VOICES) add("phrases", "phrases", voice, text);
  // Scenka zwrotu „I don't understand.” i dwie pierwsze książeczki (Alice, George).
  const scene = scenes.find((lines) => lines.some((line) => line.en === "I don't understand."));
  for (const line of scene ?? []) add("scenes", "phrases", sceneLineVoice(scene, line), line.en);
  for (const book of BOOKS.slice(0, 2)) {
    for (const page of book.pages) add("books", "phrases", bookVoice(book), page.en);
  }
} else {
  if (!only || only === "words") {
    for (const word of words) for (const voice of VOICES) add("words", "words", voice, word);
  }
  if (!only || only === "phrases") {
    for (const text of bothPhrases) for (const voice of VOICES) add("phrases", "phrases", voice, text);
  }
  if (!only || only === "scenes") {
    for (const lines of scenes) {
      for (const line of lines) add("scenes", "phrases", sceneLineVoice(lines, line), line.en);
    }
  }
  if (!only || only === "examples") {
    allWordExamples().forEach((example, index) => add("examples", "phrases", voiceByIndex(index), example.en));
  }
  if (!only || only === "books") {
    for (const book of BOOKS) {
      for (const text of [...book.pages.map((page) => page.en), ...book.questions.map((q) => q.en)]) {
        add("books", "phrases", bookVoice(book), text);
      }
    }
  }
}

const target = (job) => path.join(audioDir, job.voice, job.kind, `${audioSlug(job.text)}.mp3`);
const todo = [...jobs.values()].filter((job) => !existsSync(target(job)));

// --- Podsumowanie ------------------------------------------------------------------

const byGroup = {};
for (const job of jobs.values()) {
  const entry = (byGroup[job.group] ??= { files: 0, chars: 0, todoFiles: 0, todoChars: 0 });
  entry.files += 1;
  entry.chars += job.text.length;
  if (!existsSync(target(job))) {
    entry.todoFiles += 1;
    entry.todoChars += job.text.length;
  }
}
const totalTodo = todo.reduce((sum, job) => sum + job.text.length, 0);
for (const [group, entry] of Object.entries(byGroup)) {
  console.log(
    `${group.padEnd(9)} plików ${String(entry.files).padStart(5)}, znaków ${String(entry.chars).padStart(6)} · do zrobienia ${entry.todoFiles} plików, ${entry.todoChars} znaków`,
  );
}
console.log(`RAZEM do zrobienia: ${todo.length} plików, ${totalTodo} znaków${Number.isFinite(maxChars) ? ` (limit tego uruchomienia: ${maxChars})` : ""}`);
if (dry) process.exit(0);

// --- Generowanie -------------------------------------------------------------------

const key = readFileSync(path.join(homedir(), ".elevenlabs", "api-key.txt"), "utf8").trim();
for (const voice of VOICES) for (const kind of ["words", "phrases"]) mkdirSync(path.join(audioDir, voice, kind), { recursive: true });

let spent = 0;
let created = 0;
let stopReason = null;
const errors = [];

async function synthesize(job) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_IDS[job.voice]}?output_format=${FORMAT}`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({
          text: spoken(job.text),
          model_id: MODEL,
          voice_settings: { stability: 0.6, similarity_boost: 0.8, speed: SPEED },
        }),
      },
    );
    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 1000) throw new Error(`podejrzanie mały plik (${buffer.length} B)`);
      return buffer;
    }
    const body = (await response.text()).slice(0, 200);
    // Limit klucza albo pakietu, zły klucz — dalej nie ma sensu próbować.
    if (response.status === 401 || /quota|limit_exceeded|insufficient/i.test(body)) {
      stopReason = `${response.status} ${body}`;
      return null;
    }
    if (response.status === 429 || response.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
      continue;
    }
    throw new Error(`${response.status} ${body}`);
  }
  throw new Error("za dużo prób (429/5xx)");
}

let next = 0;
async function worker() {
  while (!stopReason) {
    const job = todo[next++];
    if (!job) return;
    if (spent + job.text.length > maxChars) {
      stopReason = stopReason ?? `osiągnięty limit uruchomienia (${maxChars} znaków)`;
      return;
    }
    spent += job.text.length; // rezerwacja przed wysłaniem — równoległe zadania nie przekroczą limitu
    try {
      const buffer = await synthesize(job);
      if (!buffer) {
        spent -= job.text.length;
        return;
      }
      writeFileSync(target(job), buffer);
      created += 1;
      if (created % 50 === 0) console.log(`  … ${created} plików, ${spent} znaków`);
    } catch (error) {
      spent -= job.text.length;
      errors.push(`${job.voice}/${job.kind} „${job.text}”: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: PARALLEL }, worker));
console.log(`\nGotowe: ${created} nowych plików, zużyte znaki: ${spent}.`);
if (stopReason) console.log(`Zatrzymano: ${stopReason}`);
console.log(errors.length ? `BŁĘDY (${errors.length}):\n${errors.join("\n")}` : "bez błędów");
