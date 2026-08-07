/**
 * Naniesienie poprawek z kontroli krzyżowej na wygenerowane lekcje liter.
 *
 * Poprawki pochodzą od recenzentów-fonetyków, którzy sprawdzali cudzą pracę.
 * Stosujemy je do danych PRZED scaleniem do lessons.ts, żeby do materiału
 * trafiła już poprawiona wersja.
 */

import { readFileSync, writeFileSync } from "node:fs";

const plik = process.argv[2] ?? ".wynik.json";
const dane = JSON.parse(readFileSync(plik, "utf8"));
const lekcje = dane.result?.lekcje ?? dane.lekcje;

const L = (id) => lekcje.find((x) => x.id === id);
let zmian = 0;
const licz = () => zmian++;

/** Podmiana pola w każdej pozycji o danym słowie, we wszystkich sekcjach. */
function ustawDlaSlowa(lekcja, slowo, pola) {
  for (const sekcja of ["listen", "blend", "choice"]) {
    for (const it of lekcja[sekcja] ?? []) {
      const nazwa = it.word ?? it.answer;
      if (nazwa === slowo) {
        Object.assign(it, pola);
        licz();
      }
    }
  }
}

// --- 1. Emoji i tłumaczenia, które nie zgadzały się z obrazkiem -------------

for (const id of ["a", "t"]) ustawDlaSlowa(L(id), "hat", { pl: "kapelusz" });
for (const id of ["a", "g"]) ustawDlaSlowa(L(id), "bag", { pl: "plecak" });
ustawDlaSlowa(L("d"), "dad", { emoji: "🧔" });
ustawDlaSlowa(L("i"), "pin", { pl: "pinezka" });
ustawDlaSlowa(L("p"), "cup", { pl: "kubek do picia" });
ustawDlaSlowa(L("g"), "mug", { pl: "kubek do kawy" });
ustawDlaSlowa(L("h"), "hop", { emoji: "🦘" });
ustawDlaSlowa(L("v"), "vest", { emoji: "👕", pl: "podkoszulek" });

// --- 2. Podmiany całych pozycji --------------------------------------------

function podmienBlend(lekcja, stare, nowe) {
  const i = (lekcja.blend ?? []).findIndex((b) => b.word === stare);
  if (i >= 0) {
    lekcja.blend[i] = nowe;
    licz();
  }
}
function podmienChoice(lekcja, staraOdp, nowa) {
  const i = (lekcja.choice ?? []).findIndex((c) => c.answer === staraOdp);
  if (i >= 0) {
    lekcja.choice[i] = nowa;
    licz();
  }
}
function podmienListen(lekcja, stare, nowe) {
  const i = (lekcja.listen ?? []).findIndex((x) => x.word === stare);
  if (i >= 0) {
    lekcja.listen[i] = nowe;
    licz();
  }
}

// "gum" z emoji cukierka -> jednoznaczny "gift"
podmienBlend(L("g"), "gum", {
  word: "gift", graphemes: ["g", "i", "f", "t"], targetIndex: 0, pl: "prezent", emoji: "🎁",
});
// "zip" z emoji buzi z zamkiem -> "bin"
podmienBlend(L("i"), "zip", {
  word: "bin", graphemes: ["b", "i", "n"], targetIndex: 1, pl: "kosz na śmieci", emoji: "🗑️",
});
// "doll" z emoji japońskich lalek -> "bell" (nadal ćwiczy dwuznak "ll")
podmienBlend(L("l"), "doll", {
  word: "bell", graphemes: ["b", "e", "ll"], targetIndex: 2, pl: "dzwonek", emoji: "🔔",
});
// "jog" dublowało "run" z lekcji r -> "jug"
podmienBlend(L("j"), "jog", {
  word: "jug", graphemes: ["j", "u", "g"], targetIndex: 0, pl: "dzbanek", emoji: "🏺",
});
podmienChoice(L("j"), "jog", {
  answer: "jug", options: ["jug", "bug", "hug"], pl: "dzbanek", emoji: "🏺",
});
// "orange" to jedyne słowo-TAK bez litery J w zapisie -> mylące
podmienListen(L("j"), "orange", { word: "jug", hasTarget: true, pl: "dzbanek", emoji: "🏺" });
// "train" to kiepski wzorzec /t/ (po t idzie r) -> "tent"
podmienListen(L("t"), "train", { word: "tent", hasTarget: true, pl: "namiot", emoji: "⛺" });
// W lekcji "w" wszystkie dwusylabowe były po stronie TAK -> liczba sylab zdradzała
podmienListen(L("w"), "fish", { word: "yellow", hasTarget: false, pl: "żółty", emoji: "💛" });
// Jedyna runda w lekcji "o", która nie testowała samogłoski
podmienChoice(L("o"), "box", {
  answer: "hot", options: ["hat", "hot", "hit"], pl: "gorący", emoji: "🔥",
});
// Lekcja "c" jest przed lekcją "u" — nie może wymagać dźwięku /ʌ/
podmienBlend(L("c"), "cup", {
  word: "cot", graphemes: ["c", "o", "t"], targetIndex: 0, pl: "łóżeczko", emoji: "🛏️",
});
podmienBlend(L("c"), "cut", {
  word: "cab", graphemes: ["c", "a", "b"], targetIndex: 0, pl: "taksówka", emoji: "🚕",
});
podmienChoice(L("c"), "cup", {
  answer: "can", options: ["can", "man", "pan"], pl: "puszka", emoji: "🥫",
});

// --- 3. Zawołanie i wskazówki dla rodzica ----------------------------------

L("u").chant = "u — u — a! up, up, up!";
licz();

const WSKAZOWKI = {
  a:
    "Najtrudniejsza z tych liter dla polskiego ucha. Angielskie „a” w „cat” to NIE polskie „a”: " +
    "opuść żuchwę niżej niż przy polskim „a”, buzia otwiera się szerzej, a język idzie do przodu. " +
    "Ćwiczcie parami: polskie „kat”, potem angielskie „cat” — ma zabrzmieć niżej i szerzej. " +
    "Uwaga: w „car”, „cake” i „water” ta sama litera brzmi zupełnie inaczej, dlatego w ćwiczeniu " +
    "te słowa są odpowiedzią „nie słychać”.",
  d:
    "Angielskie „d” jest bardzo blisko polskiego — to głównie szybkie sprawdzenie. Język dotyka " +
    "wałka za zębami, nie samych zębów. Nigdy nie mów „dy” ani „de” — to ma być sam krótki wybuch. " +
    "Różnicę „bed” i „bet” słychać głównie w samogłosce: w „bed” jest ona zauważalnie dłuższa, " +
    "w „bet” ucięta na krótko.",
  t:
    "Angielskie „t” na początku słowa ma wyraźny podmuch powietrza — mocniej niż polskie. " +
    "Sprawdźcie kartką przy ustach: przy „ten” ma drgnąć. Nigdy nie mów „ty” ani „te” — sam wybuch, " +
    "bez samogłoski. Pamiętaj, że „th” to zupełnie inny dźwięk, a w „listen” i „castle” litera „t” " +
    "w ogóle nie brzmi.",
  s:
    "Angielskie „s” jest praktycznie takie samo jak polskie — to szybkie sprawdzenie. Dwie uwagi: " +
    "to nigdy nie jest „sz” (słowo „shop” ma inny dźwięk), a na końcu wielu słów litera „s” brzmi " +
    "jak „z” („nose”, „dogs”). W drugą stronę też bywa myląco: dźwięk „s” czasem zapisuje się " +
    "literą „c” — „pencil”, „city”. Liczy się to, co SŁYCHAĆ, nie to, co widać.",
  o:
    "Angielskie „o” w „dog” jest krótsze i bardziej otwarte niż polskie. Buzia otwiera się szerzej, " +
    "szczęka opada niżej, a wargi są tylko leciutko zaokrąglone — nie wypychaj ich do przodu. " +
    "Uwaga: w „go”, „no” i „home” ta sama litera brzmi zupełnie inaczej.",
  c:
    "Pułapka: polskie „c” czytamy jak „ts” (cebula), a angielskie „c” w „cat” brzmi dokładnie jak " +
    "polskie „k”. Jeśli dziecko powie „tsat”, zatrzymaj je i powiedzcie razem „kat”. " +
    "Wyjątek do zapamiętania: przed „e”, „i” oraz „y” angielskie „c” brzmi jak „s” — „city” " +
    "czytamy „siti”. To słowo pojawi się w ćwiczeniu jako odpowiedź „nie słychać”.",
  u:
    "Pułapka: angielskie „u” w „up” i „sun” to NIE polskie „u” — to krótkie, otwarte „a”. " +
    "Powiedzcie razem „ap”, „san”, „kap” — tak brzmią „up”, „sun”, „cup”. Jeśli dziecko powie " +
    "„up” przez polskie „u”, popraw od razu. W ćwiczeniu usłyszysz też „blue” — tam litery „ue” " +
    "razem dają długie „u”, więc to odpowiedź „nie słychać”.",
  e:
    "Angielskie „e” w „hen”, „bed” i „pen” to praktycznie polskie „e” z „ten” — krótkie i " +
    "sprężyste. Nie przymykaj ust: gdy dźwięk się zwęzi, „bed” zaczyna brzmieć jak „bid”. " +
    "To jedna z łatwiejszych liter, więc powinno pójść szybko.",
  r:
    "Pułapka: angielskie „r” NIE drga. Polskie „r” uderza czubkiem języka o podniebienie — " +
    "angielskie nie dotyka niczego, język unosi się wysoko i cofa. Sprawdź na uchu: jeśli słyszysz " +
    "„łed” zamiast „red”, język leży za płasko — poproś, żeby czubek uniósł się wyżej, w stronę " +
    "podniebienia, ale go nie dotykał.",
  p:
    "Na początku wyrazu („pen”, „pot”, „pig”) po angielskim „p” leci mały podmuch powietrza — " +
    "jakby ciche „h” zaraz po nim. Na końcu wyrazu („cup”, „tap”, „map”) podmuchu nie ma. " +
    "Sprawdźcie kartką przy ustach. Nigdy nie mów „py” ani „pe” — sam wybuch.",
};
for (const [id, tekst] of Object.entries(WSKAZOWKI)) {
  const l = L(id);
  if (l) {
    l.parentIntro = tekst;
    licz();
  }
}

writeFileSync(plik, JSON.stringify(dane, null, 1));
console.log(`naniesiono ${zmian} poprawek z kontroli krzyżowej`);
