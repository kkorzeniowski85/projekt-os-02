/**
 * Nagrania lektorów ElevenLabs dla Akademii (2026-11-22) — dwa głosy z
 * lib/voices.ts, obok dawnych nagrań Edge (te zostają zapasem).
 *
 * Pliki: public/audio/akademia/<głos>/numbers|facts|phrases/… — te same nazwy
 * co dawne (lib/akademia/audio.ts szuka najpierw nagrania lektora).
 *
 * Kto czyta co (ustalenia z rodzicem):
 *  - liczby, fakty tabliczki i liczenie skokami — jeden głos (Alice): przy
 *    liczeniu po kolei zmiana głosu co liczbę brzmiałaby dziwnie;
 *  - polecenia nauczyciela (Język klasy) — George („głos nauczyciela”);
 *  - Czytanie — cała historia jednym głosem, kolejna drugim;
 *  - reszta (matematyka, zegar) — na zmianę, każde zdanie jednym głosem.
 *
 * Liczby cyframi zamieniamy przed wysłaniem na brytyjski zapis słowny
 * („350” → „three hundred and fifty”, „£10” → „ten pounds”) — inaczej lektor
 * potrafi przeczytać po amerykańsku. Nazwa pliku zostaje z oryginału.
 *
 *   npm run audio:akademia:eleven -- --dry        # policz znaki
 *   npm run audio:akademia:eleven -- --max-chars 70000
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { numbersWithAudio, numberToWords } from "../../lib/akademia/curriculum/numbers.ts";
import { audioSlug } from "../../lib/akademia/curriculum/slug.ts";
import { TABLES } from "../../lib/akademia/curriculum/tables.ts";
import { mathsPhrases } from "../../lib/akademia/curriculum/maths.ts";
import { READING_TEXTS } from "../../lib/akademia/curriculum/reading.ts";
import { classroomPhrases } from "../../lib/akademia/curriculum/classroom.ts";
import { countingPhrases } from "../../lib/akademia/tables/sessions.ts";
import { ELEVEN_VOICE_IDS } from "../../lib/voices.ts";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const maxArg = args.indexOf("--max-chars");
const maxChars = maxArg >= 0 ? Number(args[maxArg + 1]) : Infinity;
const PARALLEL = 3;
const FORMAT = "mp3_44100_64";
const SPEED = 0.8;

const root = fileURLToPath(new URL("../../", import.meta.url));
const base = path.join(root, "public", "audio", "akademia");

/** Brytyjski zapis słowny liczb w zdaniu (nazwa pliku zostaje z oryginału). */
function spoken(text) {
  return text
    .replace(/£(\d+)/g, (_, n) => `${numberToWords(Number(n))} pound${Number(n) === 1 ? "" : "s"}`)
    .replace(/(\d+)p\b/g, (_, n) => `${numberToWords(Number(n))} p`)
    .replace(/\b\d{1,6}\b/g, (n) => numberToWords(Number(n)))
    .replace(/,\s+/g, ', <break time="0.3s" /> ');
}

/** @type {Map<string, {voice: string, dir: string, name: string, text: string, single: boolean, group: string}>} */
const jobs = new Map();
function add(group, voice, dir, name, text, single = false) {
  const key = `${dir}/${name}`; // jeden głos na plik — pierwszy przydział wygrywa
  if (!jobs.has(key)) jobs.set(key, { voice, dir, name, text, single, group });
}

for (const n of numbersWithAudio()) add("liczby", "alice", "numbers", `${n}`, numberToWords(n), true);
for (const a of TABLES) for (const b of TABLES) {
  add("tabliczka", "alice", "facts", `${a}x${b}`, `${numberToWords(a)} times ${numberToWords(b)} is ${numberToWords(a * b)}`);
}
for (const text of new Set(countingPhrases())) add("liczenie", "alice", "phrases", audioSlug(text), text);
for (const text of new Set(classroomPhrases())) add("polecenia", "george", "phrases", audioSlug(text), text);
READING_TEXTS.forEach((story, index) => {
  const voice = index % 2 === 0 ? "alice" : "george";
  const texts = [...story.sentences.map((s) => s.en)];
  for (const question of story.questions) {
    texts.push(question.en);
    if (question.type === "choice") texts.push(...question.options);
    if (question.type === "order") texts.push(...question.events);
  }
  for (const text of texts) add("czytanie", voice, "phrases", audioSlug(text), text);
});
add("czytanie", "alice", "phrases", audioSlug("True"), "True", true);
add("czytanie", "george", "phrases", audioSlug("False"), "False", true);
[...new Set(mathsPhrases())].sort().forEach((text, index) => {
  add("matematyka", index % 2 === 0 ? "alice" : "george", "phrases", audioSlug(text), text);
});

const target = (job) => path.join(base, job.voice, job.dir, `${job.name}.mp3`);
const all = [...jobs.values()];
const todo = all.filter((job) => !existsSync(target(job)));
const byGroup = {};
for (const job of all) {
  const g = (byGroup[job.group] ??= { files: 0, chars: 0, todo: 0 });
  g.files += 1;
  g.chars += job.text.length;
  if (!existsSync(target(job))) g.todo += 1;
}
for (const [group, g] of Object.entries(byGroup)) console.log(`${group.padEnd(11)} plików ${String(g.files).padStart(5)}, znaków ${String(g.chars).padStart(6)}, do zrobienia ${g.todo}`);
console.log(`RAZEM do zrobienia: ${todo.length} plików, ${todo.reduce((a, j) => a + j.text.length, 0)} znaków`);
if (args.includes("--list")) {
  writeFileSync(args[args.indexOf("--list") + 1], JSON.stringify(all.map((job) => ({ url: `/audio/akademia/${job.voice}/${job.dir}/${job.name}.mp3`, text: job.text }))));
}
if (dry) process.exit(0);

const key = readFileSync(path.join(homedir(), ".elevenlabs", "api-key.txt"), "utf8").trim();
for (const voice of ["alice", "george"]) for (const dir of ["numbers", "facts", "phrases"]) mkdirSync(path.join(base, voice, dir), { recursive: true });

let spent = 0;
let created = 0;
let stop = null;
const errors = [];
let next = 0;
async function worker() {
  while (!stop) {
    const job = todo[next++];
    if (!job) return;
    if (spent + job.text.length > maxChars) {
      stop = `limit uruchomienia (${maxChars} znaków)`;
      return;
    }
    spent += job.text.length;
    // Pojedyncze słowa/liczby z angielskim kontekstem — stabilniejsza intonacja (próba „zebry”, 2026-11-22).
    const body = job.single
      ? {
          text: job.text.charAt(0).toUpperCase() + job.text.slice(1) + ".",
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.75, similarity_boost: 0.8, speed: SPEED },
          previous_text: "Listen carefully and say each number after me.",
          next_text: "Well done. Now the next one.",
        }
      : { text: spoken(job.text), model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.6, similarity_boost: 0.8, speed: SPEED } };
    let ok = false;
    for (let attempt = 1; attempt <= 4 && !ok && !stop; attempt++) {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_IDS[job.voice]}?output_format=${FORMAT}`, {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        writeFileSync(target(job), Buffer.from(await response.arrayBuffer()));
        created += 1;
        ok = true;
        if (created % 100 === 0) console.log(`  … ${created} plików, ${spent} znaków`);
      } else {
        const msg = (await response.text()).slice(0, 160);
        if (response.status === 401 || /quota|limit_exceeded|insufficient/i.test(msg)) stop = `${response.status} ${msg}`;
        else if (response.status === 429 || response.status >= 500) await new Promise((r) => setTimeout(r, 1500 * attempt));
        else {
          errors.push(`${job.dir}/${job.name}: ${response.status} ${msg}`);
          break;
        }
      }
    }
    if (!ok) spent -= job.text.length;
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker));
console.log(`\nGotowe: ${created} nowych plików, zużyte znaki: ${spent}.`);
if (stop) console.log(`Zatrzymano: ${stop}`);
console.log(errors.length ? `BŁĘDY (${errors.length}):\n${errors.join("\n")}` : "bez błędów");
