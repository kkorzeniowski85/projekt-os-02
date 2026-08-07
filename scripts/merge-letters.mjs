/**
 * Scalanie wygenerowanych lekcji pojedynczych liter do lessons.ts.
 *
 * Zasada: NIC nie trafia do pliku bez przejścia własnej walidacji. Treść
 * pochodzi z modelu, więc traktujemy ją jak dane z zewnątrz — sprawdzamy
 * składanie grafemów, równowagę TAK/NIE, homofony wśród opcji, obecność
 * ćwiczonej litery i bezpieczeństwo emoji. Lekcja z błędem jest ODRZUCANA
 * w całości i raportowana, zamiast wchodzić po cichu.
 *
 * Uruchomienie: node scripts/merge-letters.mjs <plik-z-wynikiem.json>
 */

import { readFileSync, writeFileSync } from "node:fs";

const zrodlo = process.argv[2];
if (!zrodlo) {
  console.error("uzycie: node scripts/merge-letters.mjs <plik.json>");
  process.exit(1);
}

const KOLEJNOSC = "m a s d t i n p g o c k u b f e l h r j v y w z x".split(" ");
const RYZYKOWNE_EMOJI =
  /[\u{1FA70}-\u{1FAFF}\u{1F6D5}-\u{1F6DF}\u{1F7E0}-\u{1F7EB}\u{1F9A3}-\u{1F9AF}\u{1F9BB}-\u{1F9BF}\u{1F9CB}-\u{1F9CF}]|\u{1F90C}|\u{1F90F}|\u{1F971}|\u{1F97B}/u;

function spellFromGraphemes(graphemes) {
  let core = "";
  let tail = "";
  for (const g of graphemes) {
    if (g.includes("-")) {
      const [head, end] = g.split("-");
      core += head;
      tail = end;
    } else core += g;
  }
  return core + tail;
}

const dane = JSON.parse(readFileSync(zrodlo, "utf8"));
const lekcje = dane.result?.lekcje ?? dane.lekcje ?? [];
console.log(`wczytano ${lekcje.length} lekcji`);

const przyjete = [];
const odrzucone = [];

for (const l of lekcje) {
  const bledy = [];
  const litera = l.id;

  if (!KOLEJNOSC.includes(litera)) bledy.push(`nieznana litera "${litera}"`);
  if (!l.chant?.trim()) bledy.push("brak zawołania");
  if (!l.parentIntro?.trim()) bledy.push("brak wskazówki dla rodzica");

  const tak = (l.listen ?? []).filter((i) => i.hasTarget).length;
  const nie = (l.listen ?? []).length - tak;
  if (tak < 3 || nie < 3) bledy.push(`niezrównoważone słuchanie (${tak} TAK / ${nie} NIE)`);

  for (const card of l.blend ?? []) {
    const zlozone = spellFromGraphemes(card.graphemes ?? []);
    if (zlozone !== card.word) {
      bledy.push(`"${card.word}": kawałki dają "${zlozone}"`);
    }
    if (card.targetIndex < 0 || card.targetIndex >= (card.graphemes ?? []).length) {
      bledy.push(`"${card.word}": targetIndex poza zakresem`);
    } else {
      // Podwojona litera to w RWI wciąż ta sama głoska ("ll" w bell to /l/),
      // więc podświetlenie jej przy nauce pojedynczej litery jest poprawne.
      const wskazany = card.graphemes[card.targetIndex];
      const dopuszczalne = [litera, litera + litera];
      if (litera === "k" || litera === "c") dopuszczalne.push("ck");
      if (!dopuszczalne.includes(wskazany)) {
        bledy.push(`"${card.word}": podświetla "${wskazany}" zamiast "${litera}"`);
      }
    }
  }
  if ((l.blend ?? []).length < 3) bledy.push("mniej niż 3 słowa do sklejania");

  for (const r of l.choice ?? []) {
    if (!r.options?.includes(r.answer)) bledy.push(`"${r.answer}" nie ma wśród opcji`);
    if (new Set(r.options ?? []).size !== (r.options ?? []).length) {
      bledy.push(`"${r.answer}": powtórzona opcja`);
    }
    if ((r.options ?? []).length < 3) bledy.push(`"${r.answer}": mniej niż 3 opcje`);
  }
  if ((l.choice ?? []).length < 3) bledy.push("mniej niż 3 rundy wyboru");

  const wszystkieEmoji = [...(l.listen ?? []), ...(l.blend ?? []), ...(l.choice ?? [])];
  for (const it of wszystkieEmoji) {
    if (RYZYKOWNE_EMOJI.test(it.emoji ?? "")) bledy.push(`emoji "${it.emoji}" za nowe`);
  }

  if (bledy.length) odrzucone.push({ litera, bledy });
  else przyjete.push(l);
}

console.log(`\nprzyjete: ${przyjete.length}, odrzucone: ${odrzucone.length}`);
for (const o of odrzucone) {
  console.log(`  ODRZUCONA "${o.litera}": ${o.bledy.join("; ")}`);
}

if (przyjete.length === 0) {
  console.log("nic do scalenia");
  process.exit(1);
}

// --- generowanie kodu TS ---------------------------------------------------

const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

function lekcjaDoTs(l) {
  const listen = l.listen
    .map(
      (i) =>
        `      { word: "${esc(i.word)}", hasTarget: ${i.hasTarget}, pl: "${esc(i.pl)}", emoji: "${i.emoji}" },`,
    )
    .join("\n");
  const blend = l.blend
    .map(
      (b) =>
        `      { word: "${esc(b.word)}", graphemes: [${b.graphemes.map((g) => `"${g}"`).join(", ")}], targetIndex: ${b.targetIndex}, pl: "${esc(b.pl)}", emoji: "${b.emoji}" },`,
    )
    .join("\n");
  const choice = l.choice
    .map(
      (c) =>
        `      { answer: "${esc(c.answer)}", options: [${c.options.map((o) => `"${esc(o)}"`).join(", ")}], pl: "${esc(c.pl)}", emoji: "${c.emoji}" },`,
    )
    .join("\n");

  return `  "${l.id}": {
    soundId: "${l.id}",
    heroId: "buzz",
    chant: "${esc(l.chant)}",
    parentIntro:
      "${esc(l.parentIntro)}",
    listen: [
${listen}
    ],
    blend: [
${blend}
    ],
    choice: [
${choice}
    ],
    redWords: [${l.redWords.map((w) => `"${esc(w)}"`).join(", ")}],
  },`;
}

const wKolejnosci = KOLEJNOSC.map((id) => przyjete.find((l) => l.id === id)).filter(Boolean);
const kod = wKolejnosci.map(lekcjaDoTs).join("\n");

let src = readFileSync("lib/curriculum/lessons.ts", "utf8");
const marker = "export const LESSONS: Record<string, Lesson> = {";
const idx = src.indexOf(marker);
if (idx < 0) {
  console.error("nie znaleziono deklaracji LESSONS");
  process.exit(1);
}
const wstaw = idx + marker.length;
const naglowek = `
  // --- Set 1: pojedyncze litery -------------------------------------------
  // Te lekcje NIE ucza rozpoznawania ksztaltu litery — dziecko zna je z
  // polskiego. Ucza, jak litera brzmi PO ANGIELSKU, bo przy 11 z 25 polski
  // nawyk aktywnie myli (y, w, j, c to zupelnie inne dzwieki).
`;
src = src.slice(0, wstaw) + naglowek + kod + "\n" + src.slice(wstaw);
writeFileSync("lib/curriculum/lessons.ts", src);

console.log(`\nwstawiono ${wKolejnosci.length} lekcji do lessons.ts`);
console.log(`kolejnosc: ${wKolejnosci.map((l) => l.id).join(" ")}`);
