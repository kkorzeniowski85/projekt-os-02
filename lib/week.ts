/**
 * Tydzień nauki — licznik dni na ekranie głównym i raport tygodniowy dla
 * rodzica (punkty 5 i 6 z aplikacji OET rodzica, 2026-11-22).
 *
 * Licznik: ile dni w tym tygodniu (pon–nd) było choć trochę nauki, cel 5 z 7.
 * CELOWO bez serii („streak”): opuszczony dzień niczego nie kasuje, więc nie
 * ma presji ani poczucia porażki. Bez dat i odliczania na ekranie dziecka.
 *
 * Raport: sesje i minuty w obu działach, skuteczność, mówienie i 10 pozycji
 * najczęściej mylonych w tygodniu (pierwsza odpowiedź dnia) — do skopiowania.
 */

import type { ProgressState as AkademiaState } from "@/lib/akademia/progress/types";
import { getTalkEntry } from "@/lib/curriculum/talk";
import type { ProgressState as LigaState } from "@/lib/progress/types";

export const WEEK_GOAL_DAYS = 5;
const DAY_MS = 86_400_000;

/** Poniedziałek 00:00 bieżącego tygodnia. */
export function weekStart(now = Date.now()): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const offset = (date.getDay() + 6) % 7; // pon = 0
  return date.getTime() - offset * DAY_MS;
}

/** Siedem dni tygodnia: czy był dzień nauki (sesja w którymkolwiek dziale). */
export function weekDays(liga: LigaState, akademia: AkademiaState, now = Date.now()): boolean[] {
  const start = weekStart(now);
  const days = Array<boolean>(7).fill(false);
  const mark = (ts: number) => {
    const index = Math.floor((ts - start) / DAY_MS);
    if (index >= 0 && index < 7) days[index] = true;
  };
  for (const session of liga.sessions) mark(session.endedTs);
  for (const session of akademia.sessions) mark(session.endedTs);
  return days;
}

export const DAY_LETTERS = ["P", "W", "Ś", "C", "P", "S", "N"];

type Miss = { label: string; count: number };

function firstOfDay<T extends { ts: number; item: string; correct: boolean | null }>(
  attempts: T[],
  keyOf: (attempt: T) => string,
): T[] {
  const seen = new Set<string>();
  return [...attempts]
    .sort((a, b) => a.ts - b.ts)
    .filter((attempt) => {
      const key = `${keyOf(attempt)}|${new Date(attempt.ts).toDateString()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export type WeekReport = {
  days: boolean[];
  liga: { sessions: number; minutes: number; scored: number; correct: number };
  akademia: { sessions: number; minutes: number; scored: number; correct: number };
  speaking: { own: number; helped: number };
  misses: Miss[];
  text: string;
};

const minutesOf = (sessions: { startedTs: number; endedTs: number }[]) =>
  Math.round(sessions.reduce((sum, s) => sum + Math.max(0, Math.min(s.endedTs - s.startedTs, 45 * 60_000)), 0) / 60_000);

export function weekReport(liga: LigaState, akademia: AkademiaState, now = Date.now()): WeekReport {
  const start = weekStart(now);
  const days = weekDays(liga, akademia, now);
  const ligaSessions = liga.sessions.filter((s) => s.endedTs >= start);
  const akademiaSessions = akademia.sessions.filter((s) => s.endedTs >= start);
  const sum = (list: { scored: number; correct: number }[]) => ({
    scored: list.reduce((a, s) => a + s.scored, 0),
    correct: list.reduce((a, s) => a + s.correct, 0),
  });

  const ligaWeek = liga.attempts.filter((a) => a.ts >= start);
  const talk = ligaWeek.filter((a) => (a.exercise === "talk" || a.exercise === "say") && a.correct !== null && a.mode === "parent");

  const misses = new Map<string, number>();
  const ligaFirst = firstOfDay(
    ligaWeek.filter((a) => a.correct !== null && a.exercise !== "book" && a.exercise !== "say" && a.exercise !== "talk"),
    (a) => `${a.exercise}|${a.item.toLowerCase()}`,
  );
  for (const attempt of ligaFirst) {
    if (attempt.correct !== false) continue;
    const label = attempt.exercise === "spell" ? `✍️ ${attempt.item}` : attempt.item;
    misses.set(label, (misses.get(label) ?? 0) + 1);
  }
  for (const attempt of ligaWeek.filter((a) => a.exercise === "talk" && a.correct === false)) {
    const label = `🗣️ ${getTalkEntry(attempt.item)?.question.q ?? attempt.item}`;
    misses.set(label, (misses.get(label) ?? 0) + 1);
  }
  const akademiaFirst = firstOfDay(
    akademia.attempts.filter((a) => a.ts >= start && a.correct !== null),
    (a) => `${a.module}|${a.item}`,
  );
  for (const attempt of akademiaFirst) {
    if (attempt.correct !== false) continue;
    const label = `🎓 ${attempt.item.replace("x", " × ")}`;
    misses.set(label, (misses.get(label) ?? 0) + 1);
  }
  const topMisses = [...misses.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 10);

  const report: Omit<WeekReport, "text"> = {
    days,
    liga: { sessions: ligaSessions.length, minutes: minutesOf(ligaSessions), ...sum(ligaSessions) },
    akademia: { sessions: akademiaSessions.length, minutes: minutesOf(akademiaSessions), ...sum(akademiaSessions) },
    speaking: { own: talk.filter((a) => a.correct).length, helped: talk.filter((a) => !a.correct).length },
    misses: topMisses,
  };
  return { ...report, text: reportText(report, start) };
}

function sesje(n: number): string {
  const last = n % 10;
  const tens = n % 100;
  if (n === 1) return "1 sesja";
  if (last >= 2 && last <= 4 && !(tens >= 12 && tens <= 14)) return `${n} sesje`;
  return `${n} sesji`;
}

const pct = (correct: number, scored: number) => (scored > 0 ? `${Math.round((correct / scored) * 100)}%` : "—");

function reportText(r: Omit<WeekReport, "text">, start: number): string {
  const from = new Date(start).toLocaleDateString("pl-PL");
  const lines = [
    `Liga — raport tygodniowy (od ${from})`,
    `Dni nauki: ${r.days.filter(Boolean).length} z 7 (cel ${WEEK_GOAL_DAYS})`,
    `Dźwięki i słowa: ${sesje(r.liga.sessions)}, ok. ${r.liga.minutes} min, skuteczność ${pct(r.liga.correct, r.liga.scored)}`,
    `Akademia: ${sesje(r.akademia.sessions)}, ok. ${r.akademia.minutes} min, skuteczność ${pct(r.akademia.correct, r.akademia.scored)}`,
    `Mówienie (ocena rodzica): sam ${r.speaking.own}, z pomocą ${r.speaking.helped}`,
    r.misses.length > 0
      ? `Najczęściej mylone: ${r.misses.map((m) => `${m.label}${m.count > 1 ? ` (${m.count}×)` : ""}`).join(", ")}`
      : "Najczęściej mylone: brak pomyłek w tym tygodniu",
  ];
  return lines.join("\n");
}
