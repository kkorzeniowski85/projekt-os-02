/**
 * Sprawdzarka jednej książeczki z pliku JSON — do pracy nad treścią, zanim
 * trafi do lib/curriculum/books.ts (tam pilnuje jej już audyt).
 *
 * Uruchomienie:
 *   npx tsx scripts/check-book.mjs sciezka/do/ksiazeczki.json
 *
 * Wypisuje słowa dozwolone na etapie książeczki (żeby było z czego składać),
 * potem błędy i uwagi. Kod wyjścia 1 przy błędach.
 */
import { readFileSync } from "node:fs";
import { checkBook, stageAfter } from "./decodable.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Podaj ścieżkę do pliku JSON z książeczką.");
  process.exit(2);
}

const book = JSON.parse(readFileSync(file, "utf8"));
const stage = stageAfter(book.afterSoundId);
if (stage) {
  console.log(`Etap po lekcji "${book.afterSoundId}":`);
  console.log(`  grafemy: ${stage.graphemes.join(" ")}`);
  console.log(`  red words: ${[...stage.red].join(" ")}`);
}

const problems = checkBook(book);
for (const group of ["BŁĄD", "UWAGA"]) {
  const rows = problems.filter((p) => p.severity === group);
  if (rows.length === 0) continue;
  console.log(`\n--- ${group} (${rows.length}) ---`);
  for (const row of rows) console.log(`  ${row.message}`);
}
const errors = problems.filter((p) => p.severity === "BŁĄD").length;
console.log(errors === 0 ? "\nOK — bez błędów." : `\n${errors} błędów.`);
process.exit(errors > 0 ? 1 : 0);
