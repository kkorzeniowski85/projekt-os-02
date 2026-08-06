/**
 * Wycinanie czystych głosek z nagrań całych słów.
 *
 * DLACZEGO TAK: usługa mowy nie chce wypowiedzieć samej głoski (odrzuca zapis
 * fonetyczny), ale głoska /ʃ/ jest przecież fizycznie obecna w nagraniu słowa
 * "ship". Zamiast prosić syntezator o coś, czego nie umie, wycinamy fragment z
 * prawdziwego nagrania: ten sam brytyjski głos, ta sama wymowa, zero zgadywania.
 *
 * JAK ZNAJDUJEMY GRANICE: bez ręcznego zaznaczania. Dla każdej ramki (~10 ms)
 * liczymy energię w paśmie niskim (<1 kHz) i wysokim (>1 kHz). Samogłoski są
 * głośne i zdominowane przez niskie częstotliwości; szczelinowe (sh, f) są
 * ciche i zdominowane przez wysokie. Z tego powstaje "samogłoskowość" każdej
 * ramki, a z niej granice:
 *   - spółgłoska nagłosowa = od początku mowy do początku samogłoski,
 *   - samogłoska = otoczenie najsilniejszego wierzchołka samogłoskowości.
 *
 * Uruchomienie:
 *   node scripts/extract-phonemes.mjs           # zapisuje pliki .wav
 *   node scripts/extract-phonemes.mjs --dry     # tylko analiza, bez zapisu
 *
 * WAŻNE: skrypt nie słyszy tego, co wycina — sprawdza tylko liczby (długość,
 * pasmo, głośność). Nagrania MUSZĄ zostać przesłuchane w trybie rodzica przed
 * pokazaniem dziecku. Zła głoska = skasuj plik, aplikacja wróci do "wymawia
 * rodzic".
 */

import { MPEGDecoder } from "mpg123-decoder";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(fileURLToPath(new URL("../", import.meta.url)));
const wordsDir = path.join(root, "public", "audio", "words");
const outDir = path.join(root, "public", "audio", "phonemes");
const dryRun = process.argv.includes("--dry");

/**
 * Skąd bierzemy każdą głoskę. Słowa dobrane tak, żeby cięcie było czyste:
 * krótkie wyrazy typu spółgłoska-samogłoska-spółgłoska, bez zbitek.
 * `kind` mówi, czego oczekujemy — służy też do kontroli jakości na końcu.
 */
const RECIPES = [
  // --- pojedyncze litery ---
  { id: "sh", word: "ship", cut: "onset", kind: "fricative" },
  { id: "f", word: "fish", cut: "onset", kind: "fricative" },
  { id: "ch", word: "chip", cut: "onset", kind: "affricate" },
  { id: "p", word: "pen", cut: "onset", kind: "plosive" },
  { id: "t", word: "top", cut: "onset", kind: "plosive" },
  { id: "d", word: "dish", cut: "onset", kind: "plosive" },
  { id: "m", word: "much", cut: "onset", kind: "sonorant" },
  { id: "w", word: "wish", cut: "onset", kind: "sonorant" },
  { id: "r", word: "rich", cut: "onset", kind: "sonorant" },
  { id: "b", word: "boy", cut: "onset", kind: "plosive" },
  { id: "c", word: "corn", cut: "onset", kind: "plosive" },
  { id: "k", word: "king", cut: "onset", kind: "plosive" },
  { id: "g", word: "goat", cut: "onset", kind: "plosive" },
  { id: "h", word: "horn", cut: "onset", kind: "plosive" },
  { id: "j", word: "join", cut: "onset", kind: "affricate" },
  { id: "l", word: "look", cut: "onset", kind: "sonorant" },
  { id: "n", word: "night", cut: "onset", kind: "sonorant" },
  { id: "s", word: "sing", cut: "onset", kind: "fricative" },
  { id: "z", word: "zoo", cut: "onset", kind: "fricative" },
  { id: "y", word: "year", cut: "onset", kind: "sonorant" },
  { id: "v", word: "five", cut: "coda", kind: "plosive" },
  { id: "a", word: "cat", cut: "vowel", kind: "vowel" },
  { id: "e", word: "bed", cut: "vowel", kind: "vowel" },
  { id: "i", word: "dish", cut: "vowel", kind: "vowel" },
  { id: "o", word: "top", cut: "vowel", kind: "vowel" },
  { id: "u", word: "sun", cut: "vowel", kind: "vowel" },

  // --- "special friends" Set 1 ---
  { id: "th", word: "this", cut: "onset", kind: "plosive" },
  { id: "qu", word: "quit", cut: "onset", kind: "plosive" },
  { id: "ng", word: "ring", cut: "coda", kind: "sonorant" },
  { id: "nk", word: "pink", cut: "coda", kind: "plosive" },

  // --- Set 2: zespoły samogłoskowe ---
  { id: "ay", word: "day", cut: "vowel", kind: "vowel" },
  { id: "ee", word: "see", cut: "vowel", kind: "vowel" },
  { id: "igh", word: "high", cut: "vowel", kind: "vowel" },
  { id: "ow-blow", word: "snow", cut: "vowel", kind: "vowel" },
  { id: "oo-zoo", word: "zoo", cut: "vowel", kind: "vowel" },
  { id: "oo-look", word: "look", cut: "vowel", kind: "vowel" },
  { id: "ar", word: "car", cut: "vowel", kind: "vowel" },
  { id: "or", word: "fork", cut: "vowel", kind: "vowel" },
  { id: "air", word: "hair", cut: "vowel", kind: "vowel" },
  { id: "ir", word: "bird", cut: "vowel", kind: "vowel" },
  { id: "ou", word: "out", cut: "vowel", kind: "vowel" },
  { id: "oy", word: "boy", cut: "vowel", kind: "vowel" },

  // --- Set 3 ---
  { id: "ea", word: "tea", cut: "vowel", kind: "vowel" },
  { id: "oi", word: "oil", cut: "vowel", kind: "vowel" },
  { id: "a-e", word: "lake", cut: "vowel", kind: "vowel" },
  { id: "i-e", word: "time", cut: "vowel", kind: "vowel" },
  { id: "o-e", word: "home", cut: "vowel", kind: "vowel" },
  { id: "u-e", word: "cube", cut: "vowel", kind: "vowel" },
  { id: "aw", word: "saw", cut: "vowel", kind: "vowel" },
  { id: "are", word: "hare", cut: "vowel", kind: "vowel" },
  { id: "ur", word: "burn", cut: "vowel", kind: "vowel" },
  { id: "er", word: "letter", cut: "coda", kind: "vowel" },
  { id: "ow-brown", word: "cow", cut: "vowel", kind: "vowel" },
  { id: "ai", word: "rain", cut: "vowel", kind: "vowel" },
  { id: "oa", word: "boat", cut: "vowel", kind: "vowel" },
  { id: "ew", word: "chew", cut: "vowel", kind: "vowel" },
  { id: "ire", word: "fire", cut: "vowel", kind: "vowel" },
  { id: "ear", word: "hear", cut: "vowel", kind: "vowel" },
  { id: "ure", word: "pure", cut: "vowel", kind: "vowel" },
];

/**
 * Podwójne litery w słowach dwusylabowych (le-tt-er) brzmią jak pojedyncza —
 * kopiujemy gotowy plik zamiast wycinać drugi raz to samo.
 */
const ALIASES = [
  { id: "tt", from: "t" },
  { id: "nn", from: "n" },
  { id: "mm", from: "m" },
];

// --- dekodowanie ------------------------------------------------------------

/**
 * Świeży dekoder na każdy plik. `reset()` jest asynchroniczny i mieszanie go z
 * kolejnym `decode()` kończy się błędem MPG123_ERR — osobna instancja jest
 * tańsza w utrzymaniu niż pilnowanie kolejności.
 */
async function decodeMp3(file) {
  const decoder = new MPEGDecoder();
  await decoder.ready;
  try {
    const bytes = new Uint8Array(readFileSync(file));
    const { channelData, sampleRate, samplesDecoded } = decoder.decode(bytes);
    if (!samplesDecoded || !channelData?.[0]?.length) return null;
    return { samples: channelData[0], sampleRate };
  } finally {
    decoder.free();
  }
}

// --- analiza sygnału --------------------------------------------------------

/** Ruchoma średnia = filtr dolnoprzepustowy; reszta sygnału to pasmo wysokie. */
function splitBands(samples, sampleRate) {
  const window = Math.max(4, Math.round(sampleRate / 2000)); // ~1 kHz
  const low = new Float32Array(samples.length);
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i];
    if (i >= window) sum -= samples[i - window];
    low[i] = sum / Math.min(i + 1, window);
  }
  const high = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) high[i] = samples[i] - low[i];
  return { low, high };
}

function frameRms(signal, start, length) {
  let sum = 0;
  const end = Math.min(start + length, signal.length);
  for (let i = start; i < end; i++) sum += signal[i] * signal[i];
  return Math.sqrt(sum / Math.max(1, end - start));
}

function analyse(samples, sampleRate) {
  const frame = Math.round(sampleRate * 0.01); // 10 ms
  const { low, high } = splitBands(samples, sampleRate);
  const frames = [];
  for (let start = 0; start + frame <= samples.length; start += frame) {
    const rms = frameRms(samples, start, frame);
    const lowRms = frameRms(low, start, frame);
    const highRms = frameRms(high, start, frame);
    frames.push({ start, rms, lowRatio: lowRms / (lowRms + highRms + 1e-9) });
  }
  const maxRms = Math.max(...frames.map((f) => f.rms), 1e-9);
  for (const f of frames) {
    f.loud = f.rms / maxRms;
    // Samogłoskowość: głośno ORAZ nisko — dokładnie tym różni się samogłoska
    // od szumu szczelinowego.
    f.vowelness = f.loud * f.lowRatio;
  }
  return { frames, frame, maxRms };
}

// --- wyznaczanie granic -----------------------------------------------------

function findSegment(frames, cut, frameMs) {
  // Niski próg mowy: /f/ jest bardzo cichą głoską i przy wyższym progu
  // wycinanie zaczynało się dopiero od samogłoski.
  const speechThreshold = 0.03;
  const first = frames.findIndex((f) => f.loud > speechThreshold);
  if (first < 0) return null;
  const last = frames.length - 1 - [...frames].reverse().findIndex((f) => f.loud > speechThreshold);

  let nucleus = 0;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].vowelness > frames[nucleus].vowelness) nucleus = i;
  }
  const peakVowelness = frames[nucleus].vowelness;
  const ms = (count) => Math.max(1, Math.round(count / frameMs));

  if (cut === "onset") {
    /*
     * Granicy spółgłoska→samogłoska szukamy przez "nowość": największą zmianę
     * cech między sąsiednimi ramkami. Sam próg głośności zawodzi przy
     * spółgłoskach dźwięcznych (m, w, r), które mają mocne niskie tony tak jak
     * samogłoska — ale przejście do samogłoski i tak jest najgwałtowniejszą
     * zmianą w całym nagłosie.
     */
    let boundary = first + 1;
    let best = -1;
    for (let i = first + 1; i <= nucleus; i++) {
      const change =
        Math.abs(frames[i].loud - frames[i - 1].loud) * 2 +
        Math.abs(frames[i].lowRatio - frames[i - 1].lowRatio);
      if (change > best) {
        best = change;
        boundary = i;
      }
    }

    // Zbyt krótki wynik to zwykle uciête przejście, nie prawdziwa głoska —
    // wydłużamy do sensownego minimum, ale nigdy poza jądro samogłoski.
    let to = boundary;
    if (to - first < ms(60)) to = Math.min(nucleus, first + ms(60));
    if (to - first > ms(200)) to = first + ms(200);
    return { fromFrame: first, toFrame: Math.max(first + 1, to) };
  }

  if (cut === "coda") {
    // Spółgłoska wygłosowa: od najgwałtowniejszej zmiany cech PO jądrze
    // samogłoski do końca mowy — lustrzane odbicie cięcia nagłosowego.
    let boundary = Math.min(nucleus + 1, last);
    let best = -1;
    for (let i = nucleus + 1; i <= last; i++) {
      const change =
        Math.abs(frames[i].loud - frames[i - 1].loud) * 2 +
        Math.abs(frames[i].lowRatio - frames[i - 1].lowRatio);
      if (change > best) {
        best = change;
        boundary = i;
      }
    }
    let from = boundary;
    if (last + 1 - from < ms(50)) from = Math.max(nucleus + 1, last + 1 - ms(60));
    if (last + 1 - from > ms(220)) from = last + 1 - ms(220);
    return { fromFrame: from, toFrame: last + 1 };
  }

  // Samogłoska: spójny obszar wokół jądra. Próg 0.4 zamiast 0.5 — przy krótkich
  // samogłoskach (jak w "bed") połowa szczytu odcinała prawie wszystko.
  let start = nucleus;
  let end = nucleus;
  while (start > first && frames[start - 1].vowelness > peakVowelness * 0.4) start--;
  while (end < last && frames[end + 1].vowelness > peakVowelness * 0.4) end++;

  // Minimum 80 ms, maksimum 300 ms — symetrycznie wokół jądra.
  while (end - start + 1 < ms(80) && (start > first || end < last)) {
    if (start > first) start--;
    if (end < last && end - start + 1 < ms(80)) end++;
  }
  const maxFrames = ms(300);
  if (end - start + 1 > maxFrames) {
    const half = Math.floor(maxFrames / 2);
    start = Math.max(first, nucleus - half);
    end = Math.min(last, start + maxFrames - 1);
  }
  return { fromFrame: start, toFrame: end + 1 };
}

// --- zapis WAV --------------------------------------------------------------

function toWav(samples, sampleRate) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

/** Wygładzenie brzegów (bez tego słychać trzask) + wyrównanie głośności. */
function polish(slice, sampleRate) {
  const out = Float32Array.from(slice);
  // Wygładzenie najwyżej 20% długości — przy krótkiej głosce (np. wybuch "d")
  // stałe 8 ms zjadłoby prawie cały dźwięk.
  const fade = Math.min(
    Math.round(sampleRate * 0.008),
    Math.max(1, Math.floor(out.length * 0.2)),
  );
  for (let i = 0; i < fade; i++) {
    const gain = i / fade;
    out[i] *= gain;
    out[out.length - 1 - i] *= gain;
  }
  let peak = 0;
  for (const value of out) peak = Math.max(peak, Math.abs(value));
  if (peak > 0) {
    const gain = 0.85 / peak;
    for (let i = 0; i < out.length; i++) out[i] *= gain;
  }
  return out;
}

// --- przebieg ---------------------------------------------------------------

if (!dryRun) mkdirSync(outDir, { recursive: true });

const report = [];

for (const recipe of RECIPES) {
  const source = path.join(wordsDir, `${recipe.word}.mp3`);
  if (!existsSync(source)) {
    report.push({ ...recipe, status: "BRAK ŹRÓDŁA" });
    continue;
  }

  const decoded = await decodeMp3(source);
  if (!decoded) {
    report.push({ ...recipe, status: "NIE UDAŁO SIĘ ZDEKODOWAĆ" });
    continue;
  }
  const { samples, sampleRate } = decoded;
  const { frames, frame } = analyse(samples, sampleRate);
  const segment = findSegment(frames, recipe.cut, (frame / sampleRate) * 1000);
  if (!segment) {
    report.push({ ...recipe, status: "NIE ZNALEZIONO MOWY" });
    continue;
  }

  const from = segment.fromFrame * frame;
  const to = Math.min(segment.toFrame * frame, samples.length);
  const durationMs = Math.round(((to - from) / sampleRate) * 1000);

  const cutFrames = frames.slice(segment.fromFrame, Math.max(segment.fromFrame + 1, segment.toFrame));
  const avgLowRatio = cutFrames.reduce((sum, f) => sum + f.lowRatio, 0) / cutFrames.length;

  const audio = polish(samples.subarray(from, to), sampleRate);
  if (!dryRun) {
    writeFileSync(path.join(outDir, `${recipe.id}.wav`), toWav(audio, sampleRate));
  }

  report.push({
    ...recipe,
    status: "OK",
    durationMs,
    lowRatio: Number(avgLowRatio.toFixed(2)),
    sampleRate,
  });
}

// Aliasy: kopia gotowego pliku pod drugą nazwą.
for (const alias of ALIASES) {
  const source = path.join(outDir, `${alias.from}.wav`);
  if (!existsSync(source)) {
    report.push({ id: alias.id, word: `(kopia ${alias.from})`, status: "BRAK ŹRÓDŁA ALIASU" });
    continue;
  }
  if (!dryRun) writeFileSync(path.join(outDir, `${alias.id}.wav`), readFileSync(source));
  report.push({
    id: alias.id,
    word: `= ${alias.from}`,
    cut: "alias",
    kind: "alias",
    status: "OK",
    durationMs: 0,
    lowRatio: 0,
  });
}

// --- kontrola jakości (na liczbach, nie na uchu) ----------------------------

/*
 * Progi skalibrowane na tym materiale. Uwaga o samogłoskach: próg 0.5, nie 0.6,
 * bo samogłoski otwarte (/a/ w "cat", /ɒ/ w "top") mają drugi formant powyżej
 * 1 kHz, czyli sporo energii w paśmie "wysokim" — to fizyka, nie wada nagrania.
 * Rozróżnienie i tak jest jednoznaczne: szczelinowe wychodzą 0.10-0.25,
 * samogłoski 0.54-0.70, czyli dwu- do pięciokrotna różnica.
 */
const EXPECT = {
  fricative: { minMs: 60, maxMs: 260, maxLowRatio: 0.45 },
  affricate: { minMs: 50, maxMs: 260, maxLowRatio: 0.5 },
  plosive: { minMs: 25, maxMs: 220, maxLowRatio: 0.75 },
  sonorant: { minMs: 30, maxMs: 220, minLowRatio: 0.5 },
  vowel: { minMs: 70, maxMs: 400, minLowRatio: 0.5 },
};

console.log("głoska  źródło   cięcie   długość   niskie/całość   ocena");
console.log("-".repeat(66));

let warnings = 0;
for (const row of report) {
  if (row.status !== "OK") {
    console.log(`${row.id.padEnd(7)} ${row.word.padEnd(8)} ${row.status}`);
    warnings++;
    continue;
  }
  if (row.kind === "alias") {
    console.log(`${row.id.padEnd(7)} ${row.word.padEnd(8)} alias    ✓`);
    continue;
  }
  const rules = EXPECT[row.kind];
  const problems = [];
  if (row.durationMs < rules.minMs) problems.push("za krótkie");
  if (row.durationMs > rules.maxMs) problems.push("za długie");
  if (rules.maxLowRatio !== undefined && row.lowRatio > rules.maxLowRatio)
    problems.push("za mało wysokich — możliwy fragment samogłoski");
  if (rules.minLowRatio !== undefined && row.lowRatio < rules.minLowRatio)
    problems.push("za mało niskich — możliwy szum zamiast dźwięku");
  if (problems.length) warnings++;

  console.log(
    `${row.id.padEnd(7)} ${row.word.padEnd(8)} ${row.cut.padEnd(8)} ${String(row.durationMs).padStart(5)} ms ` +
      `${String(row.lowRatio).padStart(11)}   ${problems.length ? "⚠ " + problems.join("; ") : "✓"}`,
  );
}

console.log("-".repeat(66));
console.log(
  dryRun
    ? "Tryb analizy — nic nie zapisano."
    : `Zapisano do public/audio/phonemes/. Ostrzeżeń: ${warnings}.`,
);
console.log("PRZESŁUCHAJ nagrania w trybie rodzica przed pokazaniem dziecku.");
