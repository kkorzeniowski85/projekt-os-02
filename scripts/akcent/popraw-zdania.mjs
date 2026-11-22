/**
 * Poprawka akcentu w zdaniach (2026-11-22): zdania lektora, w których test głosek
 * (scripts/akcent/akcent.py) słyszy amerykańskie miękkie „t” albo wyraźne „r”
 * częściej niż w tym samym zdaniu z dawnego brytyjskiego nagrania (Edge en-GB).
 *
 *   node scripts/akcent/popraw-zdania.mjs plan.json PYTHON AKCENT_PY
 *
 * plan.json: { switchable: [{url}], single: [{url, text}] }
 *  - switchable: drugi głos ma to zdanie bez zastrzeżeń → plik usuwamy i
 *    wpisujemy do scripts/eleven-pominiete.json (gra drugi głos);
 *  - single: nagrywamy ponownie (Akademia — drugim lektorem, bo tam głos jest
 *    „na zmianę”; Dźwięki — tym samym, bo to rola w scence albo głos
 *    książeczki), najwyżej 2 próby; zostaje wersja bez znaczników, a gdy
 *    żadna nie przejdzie — ta z najmniejszą liczbą znaczników.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const PUB = path.join(root, "public");
const [planFile, PY, AKCENT] = process.argv.slice(2);
const plan = JSON.parse(readFileSync(planFile, "utf8"));
const key = readFileSync(path.join(homedir(), ".elevenlabs", "api-key.txt"), "utf8").trim();
const VOICE_IDS = { alice: "Xb7hH8MSUJpSbSDYk0k2", george: "JBFqnCBsd6RMkjVDRZzb" };
const skipFile = path.join(root, "scripts", "eleven-pominiete.json");
const skip = JSON.parse(readFileSync(skipFile, "utf8"));
const fileOf = (url) => path.join(PUB, ...url.split("/").filter(Boolean));
const edgeOf = (url) => fileOf(url.replace(/\/(alice|george)\//, "/"));

// 1. Przełączenie na drugi głos.
for (const item of plan.switchable) {
  if (existsSync(fileOf(item.url))) unlinkSync(fileOf(item.url));
  if (!skip.pliki.includes(item.url)) skip.pliki.push(item.url);
}

// 2. Ponowne nagrania.
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function numberWords(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ""}`;
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` and ${numberWords(n % 100)}` : ""}`;
  return String(n);
}
const spoken = (t) => t.replace(/\b\d{1,3}\b/g, (n) => numberWords(Number(n))).replace(/,\s+/g, ', <break time="0.3s" /> ');
const STYLES = [
  { model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.8, similarity_boost: 0.85, speed: 0.8 } },
  { model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.9, speed: 0.8 } },
];
const work = path.join(tmpdir(), `liga-akcent-${Date.now()}`);
mkdirSync(work, { recursive: true });

function measure(entries) {
  // entries: [{id, path, text}] → wynik akcent.py
  writeFileSync(path.join(work, "in.json"), JSON.stringify(entries));
  execFileSync(PY, ["-B", AKCENT, path.join(work, "in.json"), path.join(work, "out.json")], { stdio: "ignore", timeout: 30 * 60 * 1000 });
  return new Map(JSON.parse(readFileSync(path.join(work, "out.json"), "utf8")).map((r) => [r.id, r]));
}
const marks = (r, e) => Math.max(0, (r.flap ?? 0) - (e.flap ?? 0)) + Math.max(0, (r.rStrong ?? 0) - (e.rStrong ?? 0) - 1);

let spent = 0;
const best = new Map(); // url → { file, voice, marks }
let todo = plan.single.filter((item) => existsSync(fileOf(item.url)));
for (let attempt = 0; attempt < STYLES.length && todo.length > 0; attempt++) {
  const cands = [];
  for (const item of todo) {
    const own = item.url.match(/\/(alice|george)\//)[1];
    const voice = item.url.startsWith("/audio/akademia/") && attempt === 0 ? (own === "alice" ? "george" : "alice") : own;
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS[voice]}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: spoken(item.text), ...STYLES[attempt] }),
    });
    if (!res.ok) {
      console.log("błąd", res.status, (await res.text()).slice(0, 120));
      if (res.status === 401 || res.status === 429) break;
      continue;
    }
    const file = path.join(work, `${attempt}-${cands.length}.mp3`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    spent += item.text.length;
    cands.push({ item, file, voice });
  }
  const entries = [];
  cands.forEach((c, i) => {
    entries.push({ id: `c${i}`, path: c.file, text: c.item.text });
    entries.push({ id: `e${i}`, path: edgeOf(c.item.url), text: c.item.text });
  });
  const result = measure(entries.filter((e) => existsSync(e.path)));
  const still = [];
  cands.forEach((c, i) => {
    const r = result.get(`c${i}`);
    const e = result.get(`e${i}`);
    if (!r || !e || r.heard === undefined) return;
    const m = marks(r, e);
    const prev = best.get(c.item.url);
    if (!prev || m < prev.marks) best.set(c.item.url, { file: c.file, voice: c.voice, marks: m });
    if (m > 0) still.push(c.item);
  });
  todo = still;
  console.log(`próba ${attempt + 1}: ${cands.length} nagrań, nadal ze znacznikami: ${still.length}`);
}

// Zapis: nowa wersja trafia pod adres swojego głosu (Akademia może zmienić lektora).
let replaced = 0;
const report = [];
for (const item of plan.single) {
  const b = best.get(item.url);
  if (!b) continue;
  const own = item.url.match(/\/(alice|george)\//)[1];
  const target = item.url.replace(`/${own}/`, `/${b.voice}/`);
  if (b.voice !== own && existsSync(fileOf(item.url))) unlinkSync(fileOf(item.url));
  copyFileSync(b.file, fileOf(target));
  replaced += 1;
  report.push(`${target} «${item.text}» — znaczników: ${b.marks}`);
}
writeFileSync(skipFile, JSON.stringify(skip, null, 2) + "\n");
rmSync(work, { recursive: true, force: true });
console.log(`przełączone na drugi głos: ${plan.switchable.length}, nagrane ponownie: ${replaced}, zużyte znaki: ${spent}`);
console.log(report.filter((r) => !r.endsWith(": 0")).join("\n") || "wszystkie bez znaczników");
