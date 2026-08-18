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
import { getTopic } from "@/lib/curriculum/vocab";
import { accuracyOf, RULES } from "./rules";
import { trackOf, type ProgressState, type SoundState } from "./types";

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

  const phonicsSessions = recentSessions.filter((session) => trackOf(session) === "phonics");
  const vocabSessions = recentSessions.filter((session) => trackOf(session) === "vocab");

  lines.push(`# Raport nauki — ${state.childName}`);
  lines.push("");
  lines.push(`Okres: ostatnie ${days} dni (do ${formatDate(now)})`);
  lines.push(`Sesje w okresie: ${recentSessions.length} (łącznie: ${state.sessions.length})`);
  lines.push(
    `W tym: ${phonicsSessions.length} czytanie (tor 1) / ${vocabSessions.length} słownictwo (tor 2)`,
  );

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

  lines.push("## Dźwięki (tor 1: czytanie)");
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

  lines.push("## Tematy (tor 2: słownictwo i zwroty)");
  lines.push("");
  lines.push("| temat | status | sesje | ostatni wynik | najlepszy | ostatnio |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const topic of Object.values(state.topics)) {
    const title = getTopic(topic.topicId)?.titlePl ?? topic.topicId;
    lines.push(
      `| ${title} | ${STATUS_LABEL[topic.status]} | ${topic.sessions} | ` +
        `${percent(topic.lastAccuracy)} | ${percent(topic.bestAccuracy)} | ${formatDate(topic.lastSeenTs)} |`,
    );
  }
  if (Object.keys(state.topics).length === 0) lines.push("| — | brak danych | | | | |");
  lines.push("");

  lines.push("## Gdzie idzie trudno");
  lines.push("");
  const wrongByItem = new Map<
    string,
    { wrong: number; total: number; subjectId: string; item: string; track: string }
  >();
  for (const attempt of recentAttempts) {
    if (attempt.correct === null) continue;
    const key = `${attempt.soundId}\u0000${attempt.item}`;
    const entry = wrongByItem.get(key) ?? {
      wrong: 0,
      total: 0,
      subjectId: attempt.soundId,
      item: attempt.item,
      track: trackOf(attempt),
    };
    entry.total += 1;
    if (!attempt.correct) entry.wrong += 1;
    wrongByItem.set(key, entry);
  }
  const hardest = [...wrongByItem.values()]
    .filter((entry) => entry.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 8);

  if (hardest.length === 0) {
    lines.push("Brak powtarzających się błędów w tym okresie.");
  } else {
    for (const entry of hardest) {
      // Nazwa tematu czyta się lepiej niż jego identyfikator, a w torze 1
      // identyfikator dźwięku jest już czytelny sam w sobie.
      const gdzie =
        entry.track === "vocab"
          ? (getTopic(entry.subjectId)?.titlePl ?? entry.subjectId)
          : entry.subjectId;
      lines.push(`- \`${entry.item}\` (${gdzie}): ${entry.wrong} błędów / ${entry.total} prób`);
    }
  }
  lines.push("");

  lines.push("## Tempo odpowiedzi");
  lines.push("");
  const EXERCISE_LABEL = {
    listen: "listen (słyszysz dźwięk?)",
    blend: "blend (sklejanie)",
    choice: "choice (które słowo)",
    vocab: "vocab (które słowo słyszysz)",
    phrase: "phrase (kiedy to mówisz)",
    command: "command (co robisz)",
    collocation: "collocation (które słowo pasuje)",
    say: "say (powiedz na głos)",
  } as const;
  for (const exercise of Object.keys(EXERCISE_LABEL) as (keyof typeof EXERCISE_LABEL)[]) {
    const times = recentAttempts
      .filter((attempt) => attempt.exercise === exercise && attempt.correct !== null)
      .map((attempt) => attempt.responseMs);
    if (times.length === 0) continue;
    const median = medianResponseMs(times);
    lines.push(
      `- ${EXERCISE_LABEL[exercise]}: mediana ${median === null ? "—" : `${(median / 1000).toFixed(1)} s`} (${times.length} prób)`,
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
  lines.push(
    "Te same progi obowiązują w obu torach. Tor 2 (słownictwo) ćwiczy rozumienie ze słuchu — " +
      "polecenia nauczyciela są tam sprawdzane wyłącznie na rozumienie, nie na wypowiadanie.",
  );

  return lines.join("\n");
}

/**
 * Cytowanie pola CSV. Konieczne, odkąd w dzienniku lądują całe zwroty toru 2
 * („Can I go to the toilet, please?") — przecinek w treści rozsypałby kolumny
 * w arkuszu, a błąd byłby widoczny dopiero przy analizie.
 */
function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildAttemptsCsv(state: ProgressState): string {
  const header = [
    "timestamp",
    "data",
    "track",
    "subject_id",
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
      trackOf(attempt),
      attempt.soundId,
      attempt.exercise,
      attempt.item,
      attempt.correct === null ? "" : attempt.correct ? "1" : "0",
      attempt.responseMs,
      attempt.mode,
    ]
      .map(csvCell)
      .join(","),
  );

  return [header, ...rows].join("\n");
}

export function buildSessionsCsv(state: ProgressState): string {
  const header = [
    "session_id",
    "data",
    "track",
    "subject_id",
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
      trackOf(session),
      session.soundId,
      session.mode,
      session.device,
      session.correct,
      session.scored,
      accuracyOf(session)?.toFixed(2) ?? "",
      Math.round((session.endedTs - session.startedTs) / 1000),
    ]
      .map(csvCell)
      .join(","),
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
