/**
 * Muzyka zwycięstwa na 3 gwiazdki (2026-11-22) — ElevenLabs Music.
 *
 * Utwór jest ORYGINALNY: opis prosi o styl („bohaterska fanfara orkiestrowa
 * jak w kinie superbohaterskim”), bez nazw filmów, zespołów i kompozytorów —
 * cudzych tematów nie kopiujemy (prawo autorskie).
 *
 *   node scripts/generate-music.mjs <katalog-wyjściowy> [ile-wersji] [długość-ms]
 *
 * Wersje zapisują się jako hymn-1.mp3, hymn-2.mp3 … Wybraną kopiujemy do
 * public/audio/victory/three-stars.mp3 (gra ją lib/audio.ts przy 3 gwiazdkach).
 * Klucz: %USERPROFILE%\.elevenlabs\api-key.txt (nigdy nie wypisujemy).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const [outDir, countArg = "1", lengthArg = "14000"] = process.argv.slice(2);
if (!outDir) {
  console.log("Użycie: node scripts/generate-music.mjs <katalog> [ile-wersji] [długość-ms]");
  process.exit(1);
}
const key = readFileSync(path.join(homedir(), ".elevenlabs", "api-key.txt"), "utf8").trim();
mkdirSync(outDir, { recursive: true });

const PROMPT =
  "Triumphant cinematic superhero victory fanfare for full symphony orchestra. " +
  "Starts immediately with a bold brass call: French horns and trumpets play a rising, noble, heroic theme " +
  "over driving staccato strings, snare drum and thundering timpani. " +
  "It builds quickly to a huge, bright final major chord with a cymbal crash and ends cleanly. " +
  "Epic, uplifting, adventurous blockbuster film score. Instrumental only, no vocals, fast tempo.";

for (let i = 1; i <= Number(countArg); i++) {
  const response = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: PROMPT,
      music_length_ms: Number(lengthArg),
      model_id: "music_v2_5",
      force_instrumental: true,
    }),
  });
  const cost = [...response.headers.entries()]
    .filter(([name]) => /cost|credit|song|request-id/i.test(name))
    .map(([name, value]) => `${name}: ${value}`)
    .join(", ");
  if (!response.ok) {
    console.log(`wersja ${i}: błąd ${response.status} ${(await response.text()).slice(0, 400)}`);
    break;
  }
  const file = path.join(outDir, `hymn-${i}.mp3`);
  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(file, bytes);
  console.log(`wersja ${i}: ${file} (${Math.round(bytes.length / 1024)} kB) ${cost}`);
}
