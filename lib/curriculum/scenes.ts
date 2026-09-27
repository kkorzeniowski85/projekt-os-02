/**
 * Scenki jako ćwiczenie MÓWIENIA — logika bez interfejsu.
 *
 * Dane scenek leżą w vocabParent.ts (klucz: zwrot dziecka). Tu jest to, co
 * trzeba policzyć, zanim scenka trafi na ekran: które scenki wybrać do sesji,
 * kto jaką rolę gra i co bohater tematu mówi na wejściu. Osobno od
 * VocabRunner.tsx, żeby dało się to sprawdzić zwykłym skryptem (bez React).
 *
 * Dlaczego scenki są ćwiczeniem mówienia, a nie tylko materiałem dla rodzica:
 * dziecko 7–8 lat dużo rozumie ze słuchu i prawie nie mówi — to typowy „cichy
 * okres”, z którego wychodzi się przez GOTOWE ZWROTY (formulaic chunks)
 * użyte w sytuacji, nie przez tłumaczenie gramatyki. Scenka daje dokładnie to:
 * kto, do kogo, po co — i jedną kwestię do powiedzenia, na którą jest już
 * nagranie wzorcowe.
 */

import type { Phrase } from "./vocab";
import { phraseScene, type ScenkaKwestia } from "./vocabParent";

/** Kwestia dziecka — po tym rozróżnia się, kto mówi, w całym module. */
export function isChildLine(line: ScenkaKwestia): boolean {
  return line.kto === "Ty";
}

/**
 * Emoji roli. Trzy główne role mają własne; pozostałe (rodzic, pani ze
 * stołówki…) dostają neutralną buźkę i nazwę z danych — lepiej niż zgadywać
 * obrazek dla roli, która pojawia się w kilku scenkach.
 */
export function roleEmoji(kto: string): string {
  switch (kto) {
    case "Ty":
      return "🌟";
    case "nauczycielka":
      return "👩‍🏫";
    case "kolega":
      return "🧒";
    default:
      return "🙂";
  }
}

/** Nazwa roli w narzędniku — do zdania bohatera „Ja będę …”. */
function roleInstrumental(kto: string): string {
  switch (kto) {
    case "nauczycielka":
      return "nauczycielką";
    case "kolega":
      return "kolegą";
    case "pani ze stołówki":
      return "panią ze stołówki";
    case "rodzic":
      return "rodzicem";
    default:
      return kto;
  }
}

/**
 * Jedno polskie zdanie, którym bohater tematu zapowiada scenkę. Tylko tekst —
 * bez nowych nagrań (bohaterowie nie mają głosu, kwestie czyta lektor).
 */
export function heroSceneLine(lines: readonly ScenkaKwestia[]): string {
  const roles = [...new Set(lines.filter((line) => !isChildLine(line)).map((line) => line.kto))];
  const kim = roles.map(roleInstrumental).join(" i ");
  const start = lines.length > 0 && isChildLine(lines[0]) ? " Ty zaczynasz!" : "";
  return kim
    ? `Zagrajmy scenkę! Ja będę ${kim}, ty mów swoje.${start}`
    : `Zagrajmy scenkę! Ty mów swoje.${start}`;
}

/** Fisher-Yates na kopii z wstrzykniętym losowaniem — testy podają swoje. */
function shuffleWith<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Zwroty tematu, których scenki wejdą do sesji.
 *
 * Losowo, ale z pierwszeństwem dla zwrotów o NAJNIŻSZYM poziomie podpowiedzi
 * (lib/progress/rules.ts → speakingLevel): scenka jest najcenniejsza tam,
 * gdzie dziecko jeszcze powtarza za nagraniem, a nie tam, gdzie mówi już samo.
 * Losowanie w obrębie poziomu utrzymuje różnorodność między sesjami.
 */
export function pickScenePhrases(
  phrases: readonly Phrase[],
  levelOf: (phraseEn: string) => number,
  count: number,
  random: () => number = Math.random,
): Phrase[] {
  const withScene = phrases.filter((phrase) => phraseScene(phrase.en).length > 0);
  return shuffleWith(withScene, random)
    .map((phrase, order) => ({ phrase, order, level: levelOf(phrase.en) }))
    .sort((a, b) => a.level - b.level || a.order - b.order)
    .slice(0, Math.max(0, count))
    .map((entry) => entry.phrase);
}
