"use client";

/**
 * Tryb rodzica — zgodnie z briefem główne miejsce pracy na komputerze:
 * przegląd postępu, eksport raportu do okresowej analizy z Claude, stan nagrań.
 *
 * Świadomie bez ładnych wykresów: na tym etapie ważniejsze jest, żeby dane dało
 * się WYNIEŚĆ (markdown/CSV), niż żeby ładnie wyglądały w środku.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BigButton, Card } from "@/components/ui";
import {
  auditClips,
  getVoiceStatus,
  phonemeClipBase,
  playClipFile,
  primeSpeech,
  wordClipBase,
  wordClipPath,
  type VoiceStatus,
} from "@/lib/audio";
import { PhonemeRecorder } from "@/components/PhonemeRecorder";
import { lessonGraphemes, lessonWords } from "@/lib/curriculum/lessons";
import { IPA_BY_GRAPHEME, trickyHint } from "@/lib/curriculum/ipa";
import { getSound } from "@/lib/curriculum/sounds";
import { listRecordings } from "@/lib/recordings";
import {
  buildAttemptsCsv,
  buildMarkdownReport,
  buildSessionsCsv,
  downloadFile,
} from "@/lib/progress/report";
import { accuracyOf, recommendNext, RULES } from "@/lib/progress/rules";
import { useProgress } from "@/lib/progress/store";
import type { SoundState } from "@/lib/progress/types";

const STATUS_LABEL: Record<SoundState["status"], string> = {
  new: "nowy",
  learning: "w trakcie",
  mastered: "opanowany",
  "needs-help": "trudny",
};

/** Lista słów do odsłuchania: obecne można kliknąć, brakujące są wyszarzone. */
function WordClipList({
  words,
  resolved,
}: {
  words: string[];
  resolved: Record<string, string | null> | null;
}) {
  const availableCount = resolved
    ? words.filter((word) => resolved[wordClipBase(word)]).length
    : null;

  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-bold text-paper/80">
        Słowa{" "}
        <span className="font-normal text-paper/50">
          {availableCount === null ? "" : `(${availableCount}/${words.length} nagrań)`}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {words.map((word) => {
          const path = resolved?.[wordClipBase(word)] ?? null;
          return (
            <button
              key={word}
              type="button"
              disabled={!path}
              onClick={() => path && void playClipFile(path)}
              title={path ?? `brak pliku: ${wordClipPath(word)}`}
              className={`rounded-xl px-3 py-2 text-sm ${
                path ? "bg-white/15 text-paper hover:bg-white/25" : "bg-white/5 text-paper/30"
              }`}
            >
              {path && <span aria-hidden>▶ </span>}
              <span className="font-reading font-bold">{word}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ParentPage() {
  const { state, setChildName, resetAll, ready } = useProgress();
  const [copied, setCopied] = useState(false);
  const [resolved, setResolved] = useState<Record<string, string | null> | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [recordedIds, setRecordedIds] = useState<string[]>([]);

  const words = useMemo(lessonWords, []);
  const graphemes = useMemo(lessonGraphemes, []);

  const report = useMemo(() => buildMarkdownReport(state), [state]);
  const recommendation = recommendNext(state);

  // Lista głosów ładuje się asynchronicznie, więc pytamy o nią po zamontowaniu
  // (i raz jeszcze chwilę później) zamiast w trakcie renderu.
  const [voice, setVoice] = useState<VoiceStatus | null>(null);
  useEffect(() => {
    primeSpeech();
    setVoice(getVoiceStatus());
    const timer = setTimeout(() => setVoice(getVoiceStatus()), 600);
    return () => clearTimeout(timer);
  }, []);

  const sounds = Object.values(state.sounds).sort(
    (a, b) => (b.lastSeenTs ?? 0) - (a.lastSeenTs ?? 0),
  );
  const recentSessions = [...state.sessions].slice(-10).reverse();

  const bases = useMemo(
    () => [...words.map(wordClipBase), ...graphemes.map(phonemeClipBase)],
    [words, graphemes],
  );

  const runAudit = useCallback(async () => {
    setAuditing(true);
    const result = await auditClips(bases);
    setResolved(Object.fromEntries(result.map((entry) => [entry.base, entry.path])));
    setAuditing(false);
  }, [bases]);

  const refreshRecordings = useCallback(async () => {
    setRecordedIds((await listRecordings()).map((recording) => recording.id));
  }, []);

  useEffect(() => {
    void runAudit();
    void refreshRecordings();
  }, [runAudit, refreshRecordings]);

  const missingWords = resolved
    ? words.filter((word) => !resolved[wordClipBase(word)]).length
    : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black">Tryb rodzica</h1>
        <Link href="/" className="rounded-full bg-white/10 px-4 py-2 text-sm">
          ← Do aplikacji
        </Link>
      </header>

      {!ready && <p className="text-paper/60">Wczytywanie danych…</p>}

      <Card>
        <h2 className="mb-3 text-lg font-bold">Co dalej</h2>
        <p className="text-paper/80">{recommendation.labelPl}</p>
        <div className="mt-4 inline-block">
          <BigButton href={`/sesja/${recommendation.soundId}`}>Otwórz tę sesję</BigButton>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Postęp per dźwięk</h2>
        {sounds.length === 0 ? (
          <p className="text-paper/60">Brak sesji — po pierwszej ćwiczeniu pojawią się dane.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-paper/60">
                <tr>
                  <th className="py-2">Dźwięk</th>
                  <th>Status</th>
                  <th>Sesje</th>
                  <th>Ostatni</th>
                  <th>Najlepszy</th>
                </tr>
              </thead>
              <tbody>
                {sounds.map((sound) => (
                  <tr key={sound.soundId} className="border-t border-white/10">
                    <td className="py-2 text-lg font-black">
                      {getSound(sound.soundId)?.grapheme ?? sound.soundId}
                    </td>
                    <td>{STATUS_LABEL[sound.status]}</td>
                    <td>{sound.sessions}</td>
                    <td>
                      {sound.lastAccuracy === null
                        ? "—"
                        : `${Math.round(sound.lastAccuracy * 100)}%`}
                    </td>
                    <td>
                      {sound.bestAccuracy === null
                        ? "—"
                        : `${Math.round(sound.bestAccuracy * 100)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-paper/50">
          Progi: opanowanie = {Math.round(RULES.masteryAccuracy * 100)}% przez{" "}
          {RULES.masterySessions} sesje pod rząd; sygnał trudności = poniżej{" "}
          {Math.round(RULES.strugglingAccuracy * 100)}% przez {RULES.strugglingSessions} sesje.
          Zmiana progów: lib/progress/rules.ts.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Ostatnie sesje</h2>
        {recentSessions.length === 0 ? (
          <p className="text-paper/60">Jeszcze żadnej sesji.</p>
        ) : (
          <ul className="space-y-1 text-sm text-paper/80">
            {recentSessions.map((session) => (
              <li key={session.id} className="flex flex-wrap gap-x-3">
                <span className="font-bold">
                  {getSound(session.soundId)?.grapheme ?? session.soundId}
                </span>
                <span>{new Date(session.endedTs).toLocaleString("pl-PL")}</span>
                <span>{session.mode === "parent" ? "z rodzicem" : "sam"}</span>
                <span>{session.device}</span>
                <span>
                  {session.scored > 0
                    ? `${session.correct}/${session.scored} (${Math.round((accuracyOf(session) ?? 0) * 100)}%)`
                    : "bez punktacji"}
                </span>
                <span>{Math.round((session.endedTs - session.startedTs) / 60000)} min</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Raport do analizy z Claude</h2>
        <p className="mb-3 text-sm text-paper/60">
          Skopiuj i wklej na czat (co 2-4 tygodnie). CSV tylko wtedy, gdy trzeba wejść głębiej.
        </p>
        <div className="mb-4 flex flex-wrap gap-3">
          <BigButton
            onClick={async () => {
              await navigator.clipboard.writeText(report);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Skopiowano ✓" : "Kopiuj raport"}
          </BigButton>
          <BigButton
            tone="quiet"
            onClick={() => downloadFile("raport-nauki.md", report, "text/markdown")}
          >
            Pobierz .md
          </BigButton>
          <BigButton
            tone="quiet"
            onClick={() => downloadFile("proby.csv", buildAttemptsCsv(state), "text/csv")}
          >
            CSV: próby
          </BigButton>
          <BigButton
            tone="quiet"
            onClick={() => downloadFile("sesje.csv", buildSessionsCsv(state), "text/csv")}
          >
            CSV: sesje
          </BigButton>
        </div>
        <pre className="max-h-80 overflow-auto rounded-2xl bg-black/30 p-4 text-xs whitespace-pre-wrap">
          {report}
        </pre>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Audio</h2>
        <p className="mb-3 text-sm text-paper/70">
          {voice === null
            ? "Sprawdzam dostępne głosy…"
            : !voice.supported
              ? "Przeglądarka nie udostępnia syntezy mowy — potrzebne będą nagrania."
              : voice.voiceName === null
                ? "Brak zainstalowanych głosów — słowa nie zostaną odczytane. Potrzebne nagrania."
                : `Głos zapasowy: ${voice.voiceName} (${voice.lang ?? "?"})${
                    voice.isBritish ? "" : " — UWAGA: to nie jest głos brytyjski"
                  }`}
        </p>
        <div className="mb-4 rounded-2xl border border-hero-gold/40 bg-hero-gold/10 p-4 text-sm">
          <p className="font-bold text-hero-gold">Przesłuchaj przed pierwszą sesją</p>
          <p className="mt-1 text-paper/80">
            Nagrania słów pochodzą z syntezy mowy (głos brytyjski en-GB), nie od native
            speakera — i nikt ich jeszcze nie odsłuchał. Kliknij ▶ przy każdym. Jeśli coś
            brzmi źle, skasuj plik z <code>public/audio/words/</code> — aplikacja sama wróci
            wtedy do głosu z urządzenia.
          </p>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <BigButton tone="quiet" onClick={() => void runAudit()}>
            {auditing ? "Sprawdzam…" : "Odśwież stan plików"}
          </BigButton>
          {missingWords !== null && (
            <span className="text-sm text-paper/70">
              {missingWords === 0
                ? "Wszystkie słowa nagrane ✓"
                : `Brakuje ${missingWords} z ${words.length} nagrań słów`}
            </span>
          )}
        </div>

        <WordClipList words={words} resolved={resolved} />

        <p className="mt-4 text-xs text-paper/50">
          Generowanie nagrań słów: <code>npm run audio</code> (tylko brakujące) lub{" "}
          <code>npm run audio -- --force</code>.
        </p>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Studio głosek</h2>
        <p className="mb-3 text-sm text-paper/70">
          Tu nagrywasz czyste głoski własnym głosem. Kolejność ma znaczenie:{" "}
          <strong>najpierw wzorzec</strong> (przykładowe słowo brytyjskim głosem), potem
          nagranie. Nagrane głoski od razu trafiają do sesji dziecka — także do kawałków
          słów przy sklejaniu, które bez nagrania milczą.
        </p>

        <div className="mb-4 rounded-2xl border border-hero-cyan/40 bg-hero-cyan/10 p-4 text-sm">
          <p className="font-bold text-hero-cyan">Zanim nagrasz</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-paper/80">
            <li>
              Nagrywasz Ty, nie dziecko — decyzja o nienagrywaniu dziecka i o braku
              automatycznej oceny wymowy zostaje w mocy.
            </li>
            <li>
              Nagranie zostaje na tym urządzeniu (nic nie jest wysyłane) i nie przenosi się
              samo na tablet. Żeby było wszędzie: pobierz je (⤓) i wrzuć do{" "}
              <code>public/audio/phonemes/</code>.
            </li>
            <li>
              Mów samą głoskę, bez doklejonej samogłoski: „sh", nie „szy"; „p", nie „py".
            </li>
          </ul>
        </div>

        <p className="mb-2 text-sm text-paper/60">
          Nagrane własnym głosem: {recordedIds.length} z {graphemes.length}
        </p>

        <div className="flex flex-col gap-2">
          {graphemes.map((grapheme) => (
            <PhonemeRecorder
              key={grapheme}
              grapheme={grapheme}
              ipa={IPA_BY_GRAPHEME[grapheme]}
              exampleWord={getSound(grapheme)?.example ?? grapheme}
              hasFile={Boolean(resolved?.[phonemeClipBase(grapheme)])}
              tricky={trickyHint(grapheme)}
              onChange={() => void refreshRecordings()}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Ustawienia</h2>
        <label className="flex flex-col gap-2 text-sm">
          Imię dziecka
          <input
            value={state.childName}
            onChange={(event) => setChildName(event.target.value)}
            className="max-w-xs rounded-xl bg-white/10 px-4 py-3 text-lg"
          />
        </label>
        <div className="mt-6">
          <BigButton
            tone="no"
            onClick={() => {
              if (window.confirm("Skasować cały postęp dziecka? Tego nie da się cofnąć.")) {
                resetAll();
              }
            }}
          >
            Wyczyść postęp
          </BigButton>
          <p className="mt-2 text-xs text-paper/50">
            Dane siedzą tylko w tej przeglądarce (localStorage). Synchronizacja między
            urządzeniami wymaga backendu — jeszcze go nie ma.
          </p>
        </div>
      </Card>
    </div>
  );
}
