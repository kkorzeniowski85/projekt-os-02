/**
 * 🕒 Zegar po angielsku — ściąga (app/matematyka/zegar): jak powiedzieć i jak
 * napisać godzinę z zegara wskazówkowego. Prośba rodzica (2026-10-18): strona z
 * przykładami, duży zegar przestawiany palcem, a pod nim od razu zapis i wymowa.
 *
 * Godzinę trzymamy jako minutę doby (0–1439): przesuwanie minutowej wskazówki
 * przez 12 samo zmienia godzinę, a przez 12 w nocy / w południe — porę dnia
 * (am ↔ pm), jak w prawdziwym zegarze.
 *
 * Mowa po brytyjsku (program Year 3: „tell the time to the nearest minute”):
 *  - pełne 5 minut: „ten past three”, „quarter to four”, „half past three”;
 *  - pozostałe minuty z „minutes”: „seven minutes past three”,
 *    „one minute to four” — tak mówi nauczycielka i tak jest w testach KS2.
 * Bez importów spoza curriculum — generator nagrań czyta ten plik z Node.
 */

import { numberToWords } from "./numbers";

export const DAY_MINUTES = 24 * 60;

export type ClockTime = { hour12: number; minute: number; pm: boolean };

export function timeOf(dayMinute: number): ClockTime {
  const m = ((dayMinute % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const h24 = Math.floor(m / 60);
  return { hour12: h24 % 12 === 0 ? 12 : h24 % 12, minute: m % 60, pm: h24 >= 12 };
}

export function dayMinuteOf(hour12: number, minute: number, pm: boolean): number {
  return ((hour12 % 12) + (pm ? 12 : 0)) * 60 + minute;
}

const nextHour = (hour12: number) => (hour12 % 12) + 1;

/** Jak to powiedzieć — bez „It's”. */
export function sayTime(hour12: number, minute: number): string {
  const h = numberToWords(hour12);
  const next = numberToWords(nextHour(hour12));
  if (minute === 0) return `${h} o'clock`;
  if (minute === 15) return `quarter past ${h}`;
  if (minute === 30) return `half past ${h}`;
  if (minute === 45) return `quarter to ${next}`;
  const past = minute < 30;
  const n = past ? minute : 60 - minute;
  const minutes = n % 5 === 0 ? "" : n === 1 ? " minute" : " minutes";
  return `${numberToWords(n)}${minutes} ${past ? "past" : "to"} ${past ? h : next}`;
}

/** Pora dnia po angielsku — do zdania „…in the afternoon”. */
export function partOfDay(dayMinute: number): string {
  const { hour12, minute: m, pm } = timeOf(dayMinute);
  const h24 = (hour12 % 12) + (pm ? 12 : 0);
  if (h24 === 12 && m === 0) return "midday";
  if (h24 === 0 && m === 0) return "midnight";
  if (h24 < 12) return "in the morning";
  if (h24 < 18) return "in the afternoon";
  return h24 < 22 ? "in the evening" : "at night";
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Jak to napisać — trzy zapisy, które dziecko spotka w Anglii. */
export function writeTime(dayMinute: number): { short: string; twelve: string; twentyFour: string } {
  const { hour12, minute, pm } = timeOf(dayMinute);
  const h24 = (hour12 % 12) + (pm ? 12 : 0);
  return {
    short: `${hour12}:${pad(minute)}`,
    twelve: `${hour12}:${pad(minute)} ${pm ? "pm" : "am"}`,
    twentyFour: `${pad(h24)}:${pad(minute)}`,
  };
}

const PL_NOM = ["dwunasta", "pierwsza", "druga", "trzecia", "czwarta", "piąta", "szósta", "siódma", "ósma", "dziewiąta", "dziesiąta", "jedenasta", "dwunasta"];
const PL_GEN = ["dwunastej", "pierwszej", "drugiej", "trzeciej", "czwartej", "piątej", "szóstej", "siódmej", "ósmej", "dziewiątej", "dziesiątej", "jedenastej", "dwunastej"];
const PL_MIN: Record<number, string> = { 5: "pięć", 10: "dziesięć", 20: "dwadzieścia", 25: "dwadzieścia pięć" };

/** Jak to powiedzieć po polsku (potocznie, z zegara wskazówkowego). */
export function sayTimePl(hour12: number, minute: number): string {
  const nom = PL_NOM[hour12 % 12];
  const gen = PL_GEN[hour12 % 12];
  const nomNext = PL_NOM[nextHour(hour12) % 12];
  const genNext = PL_GEN[nextHour(hour12) % 12];
  if (minute === 0) return nom;
  if (minute === 15) return `kwadrans po ${gen}`;
  if (minute === 30) return `wpół do ${genNext}`;
  if (minute === 45) return `za kwadrans ${nomNext}`;
  if (minute < 30) {
    const n = PL_MIN[minute] ?? `${minute} ${minute === 1 ? "minuta" : minute < 5 ? "minuty" : "minut"}`;
    return `${n} po ${gen}`;
  }
  const left = 60 - minute;
  const n = PL_MIN[left] ?? `${left} ${left === 1 ? "minutę" : left < 5 ? "minuty" : "minut"}`;
  return `za ${n} ${nomNext}`;
}

/** Krótkie „dlaczego” pod wymową — reguła past / to. */
export function ruleTime(hour12: number, minute: number): string {
  if (minute === 0) return "o'clock — długa wskazówka stoi na 12.";
  if (minute === 30) return "half past — pół godziny PO tej godzinie. Uwaga: po polsku „wpół do” NASTĘPNEJ!";
  if (minute < 30) return "past = po. Do połowy tarczy liczymy minuty PO godzinie, która minęła.";
  return "to = za. Po połowie liczymy, ile minut ZOSTAŁO, i mówimy już następną godzinę.";
}

export type ClockExample = { dayMinute: number; en?: string; pl?: string };

/** Przykłady do stuknięcia — od pełnych godzin do minut, plus życie codzienne. */
export const CLOCK_EXAMPLES: { title: string; items: ClockExample[] }[] = [
  {
    title: "Pełne godziny i połówki",
    items: [
      { dayMinute: dayMinuteOf(7, 0, false) },
      { dayMinute: dayMinuteOf(3, 30, true) },
      { dayMinute: dayMinuteOf(12, 0, true) },
    ],
  },
  {
    title: "Kwadranse",
    items: [
      { dayMinute: dayMinuteOf(8, 15, false) },
      { dayMinute: dayMinuteOf(8, 45, false) },
    ],
  },
  {
    title: "Co 5 minut: past i to",
    items: [
      { dayMinute: dayMinuteOf(4, 10, true) },
      { dayMinute: dayMinuteOf(4, 20, true) },
      { dayMinute: dayMinuteOf(4, 35, true) },
      { dayMinute: dayMinuteOf(4, 50, true) },
    ],
  },
  {
    title: "Co do minuty",
    items: [
      { dayMinute: dayMinuteOf(9, 7, false) },
      { dayMinute: dayMinuteOf(9, 58, false) },
    ],
  },
  {
    title: "Z życia w Anglii",
    items: [
      { dayMinute: dayMinuteOf(8, 45, false), en: "School starts at quarter to nine.", pl: "Lekcje zaczynają się za kwadrans dziewiąta." },
      { dayMinute: dayMinuteOf(3, 15, true), en: "School finishes at quarter past three.", pl: "Lekcje kończą się kwadrans po trzeciej." },
      { dayMinute: dayMinuteOf(5, 0, true), en: "We have tea at five o'clock.", pl: "Kolację („tea”) jemy o piątej." },
      { dayMinute: dayMinuteOf(4, 30, true), en: "half four", pl: "Potocznie 4:30 — NIE „wpół do czwartej”!" },
    ],
  },
];

/** Wszystkie wypowiedzi ściągi — do nagrań (co do minuty, 12 × 60). */
export function clockGuidePhrases(): string[] {
  const phrases = new Set<string>();
  for (let hour = 1; hour <= 12; hour++) {
    for (let minute = 0; minute < 60; minute++) phrases.add(sayTime(hour, minute));
  }
  for (const group of CLOCK_EXAMPLES) {
    for (const item of group.items) if (item.en) phrases.add(item.en);
  }
  phrases.add("What's the time?");
  return [...phrases];
}
