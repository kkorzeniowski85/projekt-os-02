/**
 * Generator nagrań dla aplikacji.
 *
 * SŁOWA (public/audio/words/<słowo>.mp3)
 * Brytyjski głos neuronowy (en-GB) z usługi mowy Microsoft Edge. Zwykły tekst,
 * standardowe użycie — wychodzi dobrze i nie wymaga żadnego klucza.
 *
 * GŁOSKI (public/audio/phonemes/<grafem>.mp3)
 * Wymagają SSML z zapisem fonetycznym (<phoneme alphabet="ipa">), bo inaczej
 * syntezator czyta nazwę litery ("p" → „pi"). Usługa Edge tego tagu NIE
 * przyjmuje — zrywa połączenie. Obsługuje go natomiast Azure Speech, więc
 * głoski powstaną tylko, gdy w środowisku jest klucz:
 *
 *   $env:AZURE_SPEECH_KEY = "..."      # klucz z portalu Azure (jest darmowy próg)
 *   $env:AZURE_SPEECH_REGION = "westeurope"
 *
 * Bez klucza głoski są pomijane, a aplikacja zostaje przy uczciwym zachowaniu:
 * kawałki słowa milczą, a dźwięk wymawia rodzic. To lepsze niż zgadywanie —
 * błędny wzorzec utrwala błędną wymowę.
 *
 * Uruchomienie:
 *   node scripts/generate-audio.mjs            # tylko brakujące pliki
 *   node scripts/generate-audio.mjs --force    # nadpisz wszystko
 *   node scripts/generate-audio.mjs --voice en-GB-RyanNeural
 */

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lessonGraphemes, lessonWords } from "../lib/curriculum/lessons.ts";
import { audioSlug, vocabPhrases, vocabWords } from "../lib/curriculum/vocab.ts";
import { parentPhrases } from "../lib/curriculum/vocabParent.ts";
import { IPA_BY_GRAPHEME } from "../lib/curriculum/ipa.ts";

const args = process.argv.slice(2);
const force = args.includes("--force");
const voiceArg = args.indexOf("--voice");
const VOICE = voiceArg >= 0 ? args[voiceArg + 1] : "en-GB-SoniaNeural";

const root = path.join(fileURLToPath(new URL("../", import.meta.url)));
const wordsDir = path.join(root, "public", "audio", "words");
const phonemesDir = path.join(root, "public", "audio", "phonemes");
const phrasesDir = path.join(root, "public", "audio", "phrases");
mkdirSync(wordsDir, { recursive: true });
mkdirSync(phonemesDir, { recursive: true });
mkdirSync(phrasesDir, { recursive: true });

/**
 * Nowe połączenie na każdy plik. Usługa zamyka websocket po syntezie, a
 * ponowne użycie tej samej instancji kończy się urwanym audio.
 */
async function synthesize(ssmlOrText, rate) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(ssmlOrText, { rate });
  const chunks = [];
  for await (const chunk of audioStream) chunks.push(chunk);
  tts.close?.();
  return Buffer.concat(chunks);
}

async function withRetry(label, run, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const buffer = await run();
      if (buffer.length < 500) throw new Error(`podejrzanie mały plik (${buffer.length} B)`);
      return buffer;
    } catch (error) {
      if (attempt === attempts) {
        console.error(`  ✗ ${label}: ${error.message}`);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  return null;
}

// Oba tory naraz. Slowa toru 2 ida do tego samego katalogu co slowa lekcji,
// wiec slowo wspolne dla obu torow ma jeden plik i generuje sie raz.
const words = [...new Set([...lessonWords(), ...vocabWords()])].sort();
// Zwroty cwiczen + kwestie scenek i zdania przykladowe trybu z rodzicem.
const phrases = [...new Set([...vocabPhrases(), ...parentPhrases()])].sort();
const graphemes = lessonGraphemes().filter((grapheme) => {
  if (IPA_BY_GRAPHEME[grapheme]) return true;
  console.warn(`  ! brak zapisu IPA dla "${grapheme}" — pomijam`);
  return false;
});

console.log(`Głos: ${VOICE}`);
console.log(`Do wygenerowania: ${words.length} słów, ${graphemes.length} głosek\n`);

let created = 0;
let skipped = 0;
let failed = 0;

// Słowa — nieco wolniej niż normalna mowa, dziecko dopiero łapie dźwięki.
for (const word of words) {
  const target = path.join(wordsDir, `${audioSlug(word)}.mp3`); // slug: male litery i bez spacji (GitHub Pages rozroznia wielkosc)
  if (!force && existsSync(target)) {
    skipped++;
    continue;
  }
  const buffer = await withRetry(`słowo "${word}"`, () => synthesize(word, "-15%"));
  if (buffer) {
    writeFileSync(target, buffer);
    created++;
    console.log(`  ✓ words/${audioSlug(word)}.mp3 (${buffer.length} B)`);
  } else {
    failed++;
  }
}

/**
 * Zwroty toru 2 — cale zdania. Tu usluga Edge wystarcza w zupelnosci: zdania
 * synteza wymawia sensownie, w przeciwienstwie do pojedynczych glosek. Nazwa
 * pliku powstaje przez audioSlug z lib/curriculum/vocab.ts — TE SAMA funkcje, ktorej
 * uzywa aplikacja, bo inaczej szukalaby innych nazw, niz tu zapisujemy.
 *
 * Wolniej niz slowa (-25%): dziecko musi zdazyc rozlozyc cale zdanie.
 */
for (const phrase of phrases) {
  const slug = audioSlug(phrase);
  const target = path.join(phrasesDir, `${slug}.mp3`);
  if (!force && existsSync(target)) {
    skipped++;
    continue;
  }
  const buffer = await withRetry(`zwrot "${phrase}"`, () => synthesize(phrase, "-25%"));
  if (buffer) {
    writeFileSync(target, buffer);
    created++;
    console.log(`  ✓ phrases/${slug}.mp3 (${buffer.length} B)`);
  } else {
    failed++;
  }
}

// Głoski — tylko przez Azure Speech, bo tylko ono przyjmuje zapis fonetyczny.
const azureKey = process.env.AZURE_SPEECH_KEY;
const azureRegion = process.env.AZURE_SPEECH_REGION ?? "westeurope";

async function synthesizeAzure(ssmlBody) {
  const response = await fetch(
    `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": azureKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "liga-dzwiekow",
      },
      body:
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">` +
        `<voice name="${VOICE}"><prosody rate="-25%">${ssmlBody}</prosody></voice></speak>`,
    },
  );
  if (!response.ok) throw new Error(`HTTP ${response.status} ${await response.text()}`);
  return Buffer.from(await response.arrayBuffer());
}

if (!azureKey) {
  console.log(
    `\nPomijam ${graphemes.length} głosek: usługa Edge nie obsługuje zapisu fonetycznego,\n` +
      "a bez niego syntezator przeczytałby nazwę litery zamiast dźwięku.\n" +
      "Ustaw AZURE_SPEECH_KEY (i opcjonalnie AZURE_SPEECH_REGION), żeby je wygenerować,\n" +
      "albo nagraj głoski samodzielnie — szczegóły w docs/audio.md.",
  );
} else {
  for (const grapheme of graphemes) {
    const target = path.join(phonemesDir, `${grapheme}.mp3`);
    if (!force && existsSync(target)) {
      skipped++;
      continue;
    }
    const ipa = IPA_BY_GRAPHEME[grapheme];
    const ssml = `<phoneme alphabet="ipa" ph="${ipa}">${grapheme}</phoneme>`;
    const buffer = await withRetry(`głoska "${grapheme}" /${ipa}/`, () => synthesizeAzure(ssml));
    if (buffer) {
      writeFileSync(target, buffer);
      created++;
      console.log(`  ✓ phonemes/${grapheme}.mp3  /${ipa}/  (${buffer.length} B)`);
    } else {
      failed++;
    }
  }
}

console.log(`\nGotowe: ${created} nowych, ${skipped} pominiętych, ${failed} błędów.`);
console.log("Przesłuchaj nagrania w panelu rodzica (/rodzic → Audio) zanim usiądziesz z dzieckiem.");
process.exit(failed > 0 ? 1 : 0);
