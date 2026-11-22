/**
 * Kontrola i poprawki nagrań lektorów (punkt 1 z aplikacji OET rodzica, 2026-11-22).
 *
 *   node scripts/fix-eleven.mjs --check lista.json wynik.json   # tylko sprawdź (bez kosztu)
 *   node scripts/fix-eleven.mjs --fix lista.json                # popraw: najwyżej 3 płatne próby na plik
 *
 * lista.json: [{ "url": "/audio/alice/words/zebra.mp3", "text": "zebra" }, …]
 *
 * Sprawdzanie: rozpoznawanie mowy Whisper large-v3 z narzędzi projektu OET na
 * tym komputerze (D:\OET\OET-asr — ścieżki zmienisz zmiennymi OET_ASR_PY i
 * OET_ASR_TOOL). Nagranie „w porządku”, gdy Whisper słyszy ten sam tekst
 * (wielkość liter, interpunkcja, liczby cyframi i zlepki słów bez znaczenia)
 * i każde słowo ma pewność ≥ 0,5. To pomiar — nikt nie słuchał; akcentu
 * Whisper nie oceni.
 *
 * Poprawki: kolejne próby innym sposobem nagrania (słowa: z angielskim
 * kontekstem → bardziej stabilny głos → model tylko angielski; zdania:
 * stabilniej → Turbo v2.5 → domyślnie). Nowe nagranie zastępuje stare tylko,
 * gdy jest lepsze. Próby liczą się w scripts/eleven-proby.json (najwyżej 3 na
 * plik w ogóle, także między uruchomieniami).
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const PUBLIC = path.join(root, "public");
const ASR_PY = process.env.OET_ASR_PY ?? "D:\\OET\\OET-asr\\.venv\\Scripts\\python.exe";
const ASR_TOOL = process.env.OET_ASR_TOOL ?? "D:\\OET\\OET-bank\\tools\\audio\\asr_tool.py";
const TRIES_FILE = path.join(root, "scripts", "eleven-proby.json");
const MAX_TRIES = 3;
const VOICE_IDS = { alice: "Xb7hH8MSUJpSbSDYk0k2", george: "JBFqnCBsd6RMkjVDRZzb" };
const FORMAT = "mp3_44100_64";

const WORD_STYLES = [
  { model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.75, similarity_boost: 0.8, speed: 0.8 }, previous_text: "Listen and repeat each English word after me.", next_text: "Well done. Now the next word." },
  { model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.9, similarity_boost: 0.8, speed: 0.8 }, previous_text: "Listen and repeat each English word after me.", next_text: "Well done. Now the next word." },
  { model_id: "eleven_flash_v2", voice_settings: { stability: 0.75, similarity_boost: 0.8, speed: 0.8 } },
];
const PHRASE_STYLES = [
  { model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.75, similarity_boost: 0.8, speed: 0.8 } },
  { model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.6, similarity_boost: 0.8, speed: 0.8 } },
  { model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 0.8 } },
];

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
/** Brytyjski zapis słowny (z „and”): 105 → „one hundred and five”. */
function numberWords(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ""}`;
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` and ${numberWords(n % 100)}` : ""}`;
  if (n < 1_000_000) {
    const rest = n % 1000;
    return `${numberWords(Math.floor(n / 1000))} thousand${rest === 0 ? "" : rest < 100 ? ` and ${numberWords(rest)}` : `, ${numberWords(rest)}`}`;
  }
  return String(n);
}

/** Tekst do lektora: liczby słownie (Akademia), pauza po przecinku. */
const spoken = (text) =>
  text
    .replace(/£(\d+)/g, (_, n) => `${numberWords(Number(n))} pound${Number(n) === 1 ? "" : "s"}`)
    .replace(/(\d+)p\b/g, (_, n) => `${numberWords(Number(n))} p`)
    .replace(/\b\d{1,6}\b/g, (n) => numberWords(Number(n)))
    .replace(/,\s+/g, ', <break time="0.3s" /> ');

// --- ocena ----------------------------------------------------------------------------
const SAME = new Map([["okay", "ok"], ["mom", "mum"], ["color", "colour"], ["gray", "grey"], ["naan", "nan"], ["blue", "blew"], ["banned", "band"]]);
function words(text) {
  return (text || "")
    .toLowerCase()
    .replace(/(\d),(\d{3})\b/g, "$1$2")
    .replace(/£(\d+)/g, (_, n) => `${numberWords(Number(n))} pound${Number(n) === 1 ? "" : "s"}`)
    .replace(/\b(\d{1,6})\b/g, (_, n) => numberWords(Number(n)))
    .replace(/-/g, " ")
    .replace(/[’‘`]/g, "'")
    .replace(/[-–—]/g, " ")
    .replace(/[^a-z' ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .map((w) => SAME.get(w) ?? w);
}
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
/** Ocena jednego nagrania: ok, wer, minProb i liczba „punktów” do porównań (więcej = lepiej). */
function judge(text, result, url = "") {
  const ref = words(text);
  const hyp = words(result?.text);
  const wer = ref.join("") === hyp.join("") ? 0 : editDistance(ref, hyp) / Math.max(1, ref.length);
  const probs = (result?.words ?? []).map((w) => w[3]);
  const minProb = probs.length ? Math.min(...probs) : 0;
  const single = ref.length === 1;
  // Liczby i tabliczka: Whisper woli cyfry i słownym liczbom daje niską pewność,
  // choć słyszy dobrze — tu liczy się tylko zgodność tekstu.
  const numeric = /\/(numbers|facts)\//.test(url);
  const ok = (single ? wer === 0 : wer <= 0.15) && (numeric || minProb >= 0.5);
  return { ok, wer: +wer.toFixed(2), minProb: +minProb.toFixed(2), heard: result?.text ?? "", score: (wer === 0 ? 2 : wer <= 0.15 ? 1 : 0) + minProb };
}

/** Whisper (OET asr_tool) dla listy plików: { id → { text, words } }. */
function transcribe(files) {
  if (!existsSync(ASR_PY) || !existsSync(ASR_TOOL)) {
    throw new Error(`Brak narzędzia Whisper (${ASR_PY}). Ustaw OET_ASR_PY i OET_ASR_TOOL.`);
  }
  const work = path.join(tmpdir(), `liga-asr-${Date.now()}`);
  mkdirSync(work, { recursive: true });
  const manifest = files.map((file, i) => ({ id: String(i), path: file, s: null, e: null }));
  writeFileSync(path.join(work, "m.json"), JSON.stringify(manifest));
  execFileSync(ASR_PY, ["-B", ASR_TOOL, path.join(work, "m.json"), path.join(work, "r.json")], {
    stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env, TEMP: work, TMP: work },
    timeout: 3 * 60 * 60 * 1000,
  });
  const result = JSON.parse(readFileSync(path.join(work, "r.json"), "utf8"));
  rmSync(work, { recursive: true, force: true });
  return files.map((_, i) => result[String(i)]);
}

const fileOf = (url) => path.join(PUBLIC, ...url.split("/").filter(Boolean));

// --- uruchomienie ------------------------------------------------------------------------

const args = process.argv.slice(2);
const mode = args[0];
const list = JSON.parse(readFileSync(args[1], "utf8")).filter((item) => /^\/audio\/(akademia\/)?(alice|george)\//.test(item.url));
const voiceOf = (url) => url.match(/\/(alice|george)\//)[1];

if (mode === "--check") {
  const results = transcribe(list.map((item) => fileOf(item.url)));
  const out = list.map((item, i) => ({ ...item, ...judge(item.text, results[i], item.url) }));
  writeFileSync(args[2], JSON.stringify(out, null, 1));
  const bad = out.filter((item) => !item.ok);
  console.log(`sprawdzone: ${out.length}, do poprawy: ${bad.length}`);
  process.exit(0);
}

if (mode !== "--fix") {
  console.log("Użycie: --check lista.json wynik.json  albo  --fix lista.json");
  process.exit(1);
}

const key = readFileSync(path.join(homedir(), ".elevenlabs", "api-key.txt"), "utf8").trim();
const tries = existsSync(TRIES_FILE) ? JSON.parse(readFileSync(TRIES_FILE, "utf8")) : {};
const work = path.join(tmpdir(), `liga-fix-${Date.now()}`);
mkdirSync(work, { recursive: true });

// Stan wyjściowy: ocena obecnych plików.
let current = transcribe(list.map((item) => fileOf(item.url))).map((r, i) => ({ ...list[i], ...judge(list[i].text, r, list[i].url) }));
let spent = 0;
const report = [];

for (let round = 0; round < MAX_TRIES; round++) {
  const todo = current.filter((item) => !item.ok && (tries[item.url] ?? 0) < MAX_TRIES);
  if (todo.length === 0) break;
  console.log(`runda ${round + 1}: ${todo.length} nagrań`);
  const candidates = [];
  for (const item of todo) {
    const voice = voiceOf(item.url);
    const isWord = /\/(words|numbers)\//.test(item.url);
    const styles = isWord ? WORD_STYLES : PHRASE_STYLES;
    const style = styles[Math.min(tries[item.url] ?? 0, styles.length - 1)];
    const body = { text: isWord ? item.text.charAt(0).toUpperCase() + item.text.slice(1) + "." : spoken(item.text), ...style };
    if (isWord && /[.!?]$/.test(item.text)) body.text = item.text;
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS[voice]}?output_format=${FORMAT}`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify(body),
    });
    tries[item.url] = (tries[item.url] ?? 0) + 1;
    if (!response.ok) {
      const msg = (await response.text()).slice(0, 160);
      console.log(`  błąd ${response.status}: ${msg}`);
      if (response.status === 401 || /quota|limit/i.test(msg)) break;
      continue;
    }
    const file = path.join(work, `${candidates.length}.mp3`);
    writeFileSync(file, Buffer.from(await response.arrayBuffer()));
    spent += item.text.length;
    candidates.push({ item, file, style: `${style.model_id}/${style.voice_settings.stability}${style.previous_text ? "/kontekst" : ""}` });
  }
  writeFileSync(TRIES_FILE, JSON.stringify(tries, null, 1) + "\n");
  if (candidates.length === 0) break;
  const results = transcribe(candidates.map((c) => c.file));
  candidates.forEach((candidate, i) => {
    const verdict = judge(candidate.item.text, results[i], candidate.item.url);
    const before = current.find((item) => item.url === candidate.item.url);
    if (verdict.score > before.score + 0.02) {
      copyFileSync(candidate.file, fileOf(candidate.item.url));
      report.push(`${candidate.item.url} «${candidate.item.text}»: ${before.heard} (${before.minProb}) → ${verdict.heard} (${verdict.minProb}) ${candidate.style}`);
      Object.assign(before, verdict);
    }
  });
}

rmSync(work, { recursive: true, force: true });
const still = current.filter((item) => !item.ok);
const reportFile = path.join(tmpdir(), `liga-fix-raport-${new Date().toISOString().slice(0, 10)}.md`);
writeFileSync(
  reportFile,
  [`# Poprawki nagrań — ${new Date().toLocaleString("pl-PL")}`, "", `Zużyte znaki: ${spent}. Podmienione: ${report.length}. Nadal do odsłuchu: ${still.length}.`, "", "## Podmienione", ...report.map((r) => `- ${r}`), "", "## Nadal niepewne (Whisper)", ...still.map((s) => `- ${s.url} «${s.text}» — słyszy „${s.heard}” (${s.minProb})`)].join("\n"),
);
console.log(`zużyte znaki: ${spent}, podmienione: ${report.length}, nadal niepewne: ${still.length}`);
console.log(`raport: ${reportFile}`);
