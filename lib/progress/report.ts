/**
 * Warstwa 2 z briefu: eksport statystyk do okresowej analizy (raz na 2-4
 * tygodnie) w rozmowie z Claude.
 *
 * Dwa formaty, celowo różne:
 *  - Markdown: zwięzłe podsumowanie do wklejenia na czat. Ma się zmieścić w
 *    kilkunastu linijkach, bo raport zalany szczegółami jest bezużyteczny.
 *  - CSV: pełny log prób, gdyby trzeba było wejść głębiej albo policzyć coś
 *    samodzielnie w arkuszu.
 */

import { getSound } from "@/lib/curriculum/sounds";
import { accuracyOf, RULES } from "./rules";
import type { ProgressState, SoundState } from "./types";

const STATUS_LABEL: Record<SoundState["status"], string> = {
  new: "nowy",
  learning: "w trakcie",
  mastered: "opanowany",
  "needs-help": "trudny",
};

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function formatDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toISOString().slice(0, 10);
}

/** Średni czas odpowiedzi — wolne odpowiedzi bywają wcześniejszym sygnałem niż błędy. */
function medianResponseMs(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle];
}

export function buildMarkdownReport(state: ProgressState, now = Date.now()): string {
  const lines: string[] = [];
  const days = 28;
  const since = now - days * 24 * 60 * 60 * 1000;

  const recentSessions = state.sessions.filter((session) => session.endedTs >= since);
  const recentAttempts = state.attempts.filter((attempt) => attempt.ts >= since);

  lines.push(`# Raport nauki — ${state.childName}`);
  lines.push("");
  lines.push(`Okres: ostatnie ${days} dni (do ${formatDate(now)})`);
  lines.push(`Sesje w okresie: ${recentSessions.length} (łącznie: ${state.sessions.length})`);

  const totalMinutes = Math.round(
    recentSessions.reduce((sum, session) => sum + (session.endedTs - session.startedTs), 0) /
      60000,
  );
  lines.push(`Czas nauki w okresie: ~${totalMinutes} min`);

  const soloCount = recentSessions.filter((session) => session.mode === "solo").length;
  lines.push(
    `Tryb: ${soloCount} samodzielnie / ${recentSessions.length - soloCount} z rodzicem`,
  );
  lines.push("");

  lines.push("## Dźwięki");
  lines.push("");
  lines.push("| dźwięk | status | sesje | ostatni wynik | najlepszy | ostatnio |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const sound of Object.values(state.sounds)) {
    const grapheme = getSound(sound.soundId)?.grapheme ?? sound.soundId;
    lines.push(
      `| ${grapheme} | ${STATUS_LABEL[sound.status]} | ${sound.sessions} | ` +
        `${percent(sound.lastAccuracy)} | ${percent(sound.bestAccuracy)} | ${formatDate(sound.lastSeenTs)} |`,
    );
  }
  if (Object.keys(state.sounds).length === 0) lines.push("| — | brak danych | | | | |");
  lines.push("");

  lines.push("## Gdzie idzie trudno");
  lines.push("");
  const wrongByItem = new Map<string, { wrong: number; total: number; soundId: string }>();
  for (const attempt of recentAttempts) {
    if (attempt.correct === null) continue;
    const key = `${attempt.soundId}:${attempt.item}`;
    const entry = wrongByItem.get(key) ?? { wrong: 0, total: 0, soundId: attempt.soundId };
    entry.total += 1;
    if (!attempt.correct) entry.wrong += 1;
    wrongByItem.set(key, entry);
  }
  const hardest = [...wrongByItem.entries()]
    .filter(([, entry]) => entry.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 8);

  if (hardest.length === 0) {
    lines.push("Brak powtarzających się błędów w tym okresie.");
  } else {
    for (const [key, entry] of hardest) {
      const item = key.split(":")[1];
      lines.push(`- \`${item}\` (${entry.soundId}): ${entry.wrong} błędów / ${entry.total} prób`);
    }
  }
  lines.push("");

  lines.push("## Tempo odpowiedzi");
  lines.push("");
  for (const exercise of ["listen", "blend", "choice"] as const) {
    const times = recentAttempts
      .filter((attempt) => attempt.exercise === exercise && attempt.correct !== null)
      .map((attempt) => attempt.responseMs);
    const median = medianResponseMs(times);
    lines.push(
      `- ${exercise}: mediana ${median === null ? "—" : `${(median / 1000).toFixed(1)} s`} (${times.length} prób)`,
    );
  }
  lines.push("");

  lines.push("## Kontekst dla analizy");
  lines.push("");
  lines.push(
    `Progi używane przez aplikację: opanowanie = ${Math.round(RULES.masteryAccuracy * 100)}% ` +
      `przez ${RULES.masterySessions} sesje pod rząd; sygnał trudności = poniżej ` +
      `${Math.round(RULES.strugglingAccuracy * 100)}% przez ${RULES.strugglingSessions} sesje.`,
  );
  lines.push(
    "Ćwiczenia mówione nie są oceniane przez aplikację (ocenia rodzic) — nie wchodzą do procentów.",
  );

  return lines.join("\n");
}

export function buildAttemptsCsv(state: ProgressState): string {
  const header = [
    "timestamp",
    "data",
    "sound_id",
    "exercise",
    "item",
    "correct",
    "response_ms",
    "mode",
  ].join(",");

  const rows = state.attempts.map((attempt) =>
    [
      attempt.ts,
      new Date(attempt.ts).toISOString(),
      attempt.soundId,
      attempt.exercise,
      attempt.item,
      attempt.correct === null ? "" : attempt.correct ? "1" : "0",
      attempt.responseMs,
      attempt.mode,
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

export function buildSessionsCsv(state: ProgressState): string {
  const header = [
    "session_id",
    "data",
    "sound_id",
    "mode",
    "device",
    "correct",
    "scored",
    "accuracy",
    "duration_s",
  ].join(",");

  const rows = state.sessions.map((session) =>
    [
      session.id,
      new Date(session.endedTs).toISOString(),
      session.soundId,
      session.mode,
      session.device,
      session.correct,
      session.scored,
      accuracyOf(session)?.toFixed(2) ?? "",
      Math.round((session.endedTs - session.startedTs) / 1000),
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
