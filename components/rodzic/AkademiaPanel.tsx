"use client";

/**
 * Panel rodzica — dział Akademia (dawna Akademia Ligi): plan pod MTC, mapa
 * faktów, próbne testy, stan tematów, nagrania i ustawienia działu.
 *
 * Wydzielone bez zmian logiki z app/rodzic/page.tsx Akademii. Raport,
 * synchronizacja, kopie zapasowe i wersja aplikacji są wspólne dla obu
 * działów i siedzą w osobnych zakładkach (ReportPanel, SyncPanel).
 *
 * Daty i plan pod MTC są tu na miejscu — to panel rodzica, nie ekran dziecka.
 */

import { useCallback, useEffect, useState } from "react";
import { FactGrid } from "@/components/akademia/FactGrid";
import { BigButton, Card, STATUS_LABEL, STATUS_STYLE } from "@/components/akademia/ui";
import {
  auditClips,
  numberClipPath,
  factClipPath,
  textClipPath,
  getVoiceStatus,
  type ClipAudit,
  type VoiceStatus,
} from "@/lib/akademia/audio";
import { CLASSROOM_UNITS, classroomPhrases } from "@/lib/akademia/curriculum/classroom";
import { MATHS_TOPICS, mathsPhrases } from "@/lib/akademia/curriculum/maths";
import { numbersWithAudio } from "@/lib/akademia/curriculum/numbers";
import { READING_TEXTS, readingPhrases } from "@/lib/akademia/curriculum/reading";
import { parseFact, TABLES } from "@/lib/akademia/curriculum/tables";
import { MTC_WINDOW_START, roughlyUntil, SCHOOL_START, daysUntil } from "@/lib/akademia/mtcDates";
import { pl } from "@/lib/akademia/pl";
import { trainingDaysCount } from "@/lib/akademia/progress/report";
import { useProgress } from "@/lib/akademia/progress/store";
import { subscribeSync, type SyncStatus } from "@/lib/akademia/progress/sync";
import { unitKeyOf, type ModuleId } from "@/lib/akademia/progress/types";
import { countingPhrases } from "@/lib/akademia/tables/sessions";
import { focusTable, tablesSummary, weakestFacts } from "@/lib/akademia/tables/practice";

export function AkademiaPanel() {
  const { state } = useProgress();
  const summary = tablesSummary(state.facts);
  const focus = focusTable(state.facts);
  const weak = weakestFacts(state.facts, 10);
  const trainingDays = trainingDaysCount(state);

  return (
    <div className="flex flex-col gap-6 select-text">
      <Card>
        <h2 className="mb-2 text-lg font-bold">Plan: szkoła i Multiplication Tables Check</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Start w Anglii (Year 4)" value="wrzesień 2027" note={roughlyUntil(SCHOOL_START)} />
          <Stat label="Okno MTC" value="czerwiec 2028" note={pl(daysUntil(MTC_WINDOW_START), "dzień", "dni", "dni")} />
          <Stat label="Fakty płynnie" value={`${summary.fluent} / 66`} note={`${Math.round(summary.readiness * 100)}% gotowości`} />
        </div>
        <p className="mt-3 text-sm text-paper/75">
          Dni z treningiem w ostatnich 4 tygodniach: <strong>{trainingDays}/28</strong>. Cel: 5–6 dni w
          tygodniu po ok. 5 minut. {focus ? `Teraz w centrum uwagi: ×${focus}.` : "Wszystkie fakty są już w nauce — trening pilnuje powtórek."}
        </p>
        <p className="mt-2 text-xs text-paper/55">
          Jak czytać wynik: „płynnie” = dobrze i w 3,5 s przy kolejnych powtórkach w odstępach dni
          (awans jest tylko za powtórkę w terminie, więc wymaga co najmniej trzech dni nauki). W teście
          jest 6 s. Do czerwca 2028 jest dużo czasu — spokojne tempo (kilka nowych faktów
          tygodniowo) wystarczy z zapasem, pod warunkiem regularności.
        </p>
        <p className="mt-2 text-xs text-paper/55">
          W misji na dziś tabliczka jest krokiem 2: lekcja „Liczymy co N”, gdy wchodzi nowa
          tabliczka, a w pozostałe dni trening. Inny dział Akademii jest krokiem dla chętnych.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Mapa tabliczki</h2>
        <FactGrid facts={state.facts} />
        {weak.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-bold text-paper/80">Najsłabsze fakty</p>
            <div className="flex flex-wrap gap-2">
              {weak.map((key) => {
                const [a, b] = parseFact(key);
                const fact = state.facts[key];
                return (
                  <span key={key} className="rounded-xl bg-white/10 px-3 py-1.5 text-sm tabular-nums">
                    <strong>
                      {a} × {b} = {a * b}
                    </strong>{" "}
                    <span className="text-paper/60">
                      {fact.right}/{fact.seen}
                      {fact.lastMs ? ` · ${(fact.lastMs / 1000).toFixed(1)} s` : ""}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <MockHistory />

      <Card>
        <h2 className="mb-3 text-lg font-bold">Tematy</h2>
        <div className="grid gap-5 lg:grid-cols-3">
          <UnitStatusList
            title="Matematyka po angielsku"
            module="maths"
            units={MATHS_TOPICS.map((topic) => ({ id: topic.id, title: topic.titlePl }))}
          />
          <UnitStatusList
            title="Czytanie"
            module="reading"
            units={READING_TEXTS.map((text) => ({ id: text.id, title: `${text.titleEn} (${text.level})` }))}
          />
          <UnitStatusList
            title="Język klasy"
            module="tasks"
            units={CLASSROOM_UNITS.map((unit) => ({ id: unit.id, title: unit.titlePl }))}
          />
        </div>
        <UnitStatusList
          title="Liczymy co… (lekcje tabliczki)"
          module="tables"
          units={TABLES.map((table) => ({ id: `count-${table}`, title: `×${table}` }))}
          inline
        />
      </Card>

      <AudioCard />
      <SettingsCard />
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-xs text-paper/60">{label}</p>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs text-hero-cyan">{note}</p>
    </div>
  );
}

function MockHistory() {
  const { state } = useProgress();
  return (
    <Card>
      <h2 className="mb-2 text-lg font-bold">Próbne testy MTC</h2>
      {state.mocks.length === 0 ? (
        <p className="text-sm text-paper/70">
          Jeszcze nie było. Pierwszy warto zrobić po kilku tygodniach treningu — jako punkt odniesienia,
          nie egzamin.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex h-28 items-end gap-2">
            {state.mocks.slice(-12).map((mock) => (
              <div key={mock.id} className="flex flex-1 flex-col items-center gap-1" title={new Date(mock.ts).toLocaleDateString("pl-PL")}>
                <span className="text-xs font-bold tabular-nums">{mock.score}</span>
                <div
                  className={`w-full rounded-t-lg ${mock.score >= 21 ? "bg-hero-lime" : mock.score >= 15 ? "bg-hero-gold" : "bg-hero-pink"}`}
                  style={{ height: `${Math.max(6, (mock.score / 25) * 80)}px` }}
                />
              </div>
            ))}
          </div>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-paper/75">
            {state.mocks
              .slice(-5)
              .reverse()
              .map((mock) => (
                <li key={mock.id}>
                  {new Date(mock.ts).toLocaleDateString("pl-PL")}: <strong>{mock.score}/{mock.total}</strong>
                  {mock.missed.length > 0 && <span className="text-paper/55"> — bez punktu: {mock.missed.join(", ")}</span>}
                </li>
              ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-xs text-paper/55">
        Kontekst: w MTC nie ma progu zaliczenia. W roku 2024/25 średnia w Anglii wyniosła 21,0/25, a 37%
        dzieci miało 25/25. Źródło: Department for Education, „Multiplication tables check attainment”.
      </p>
    </Card>
  );
}

function UnitStatusList({
  title,
  module,
  units,
  inline = false,
}: {
  title: string;
  module: ModuleId;
  units: { id: string; title: string }[];
  inline?: boolean;
}) {
  const { state } = useProgress();
  return (
    <div className={inline ? "mt-5" : ""}>
      <p className="mb-2 text-sm font-bold text-paper/80">{title}</p>
      <ul className={inline ? "flex flex-wrap gap-2" : "flex flex-col gap-1.5"}>
        {units.map((unit) => {
          const progress = state.units[unitKeyOf(module, unit.id)];
          const status = progress?.status ?? "new";
          return (
            <li key={unit.id} className="flex items-center gap-2 text-sm">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[status]}`}>
                {inline ? unit.title : STATUS_LABEL[status]}
              </span>
              {!inline && <span className="flex-1">{unit.title}</span>}
              {!inline && progress?.lastAccuracy != null && (
                <span className="text-xs text-paper/55">{Math.round(progress.lastAccuracy * 100)}%</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Wszystkie ścieżki nagrań, których aplikacja może potrzebować. */
function allClipPaths(): string[] {
  const paths = new Set<string>();
  numbersWithAudio().forEach((n) => paths.add(numberClipPath(n)));
  for (const a of TABLES) for (const b of TABLES) paths.add(factClipPath(a, b));
  [...mathsPhrases(), ...readingPhrases(), ...classroomPhrases(), ...countingPhrases()].forEach((text) =>
    paths.add(textClipPath(text)),
  );
  return [...paths];
}

function AudioCard() {
  const [result, setResult] = useState<ClipAudit | null>(null);
  const [running, setRunning] = useState(false);
  const [voice, setVoice] = useState<VoiceStatus | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVoice(getVoiceStatus()), 500);
    return () => clearTimeout(timer);
  }, []);

  const run = useCallback(async () => {
    setRunning(true);
    setResult(await auditClips(allClipPaths()));
    setRunning(false);
  }, []);

  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Nagrania</h2>
      <p className="mb-3 text-sm text-paper/70">
        Wszystko, co aplikacja mówi, to nagrania brytyjskiego głosu (en-GB). Gdyby któregoś brakowało,
        awaryjnie mówi syntezator przeglądarki
        {voice ? ` (${voice.voiceName ?? "brak głosu"}${voice.isBritish ? ", brytyjski" : ", nie brytyjski"})` : ""}.
      </p>
      <BigButton tone="quiet" onClick={() => void run()}>
        {running ? "Sprawdzam…" : "Sprawdź nagrania"}
      </BigButton>
      {result && (
        <p className="mt-3 text-sm">
          Na miejscu: <strong>{result.found.length}</strong>. Brakuje: <strong>{result.missing.length}</strong>
          {result.missing.length > 0 && (
            <span className="mt-1 block max-h-32 overflow-auto text-xs text-paper/55">{result.missing.slice(0, 40).join(", ")}</span>
          )}
          {result.unknown.length > 0 && (
            <span className="mt-1 block text-paper/70">
              Nie da się sprawdzić: <strong>{result.unknown.length}</strong> — brak połączenia z serwerem. To nie znaczy,
              że ich brakuje; sprawdź ponownie z internetem.
            </span>
          )}
        </p>
      )}
    </Card>
  );
}

function SettingsCard() {
  const { state, setChildName, resetAll } = useProgress();
  const [sync, setSync] = useState<SyncStatus | null>(null);
  useEffect(() => subscribeSync(setSync), []);
  return (
    <Card>
      <h2 className="mb-3 text-lg font-bold">Ustawienia działu Akademia</h2>
      <label className="flex flex-col gap-2 text-sm">
        Imię lub pseudonim dziecka (przy włączonej synchronizacji przechodzi przez zewnętrzną usługę
        textdb.dev — pseudonim wystarczy)
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
            if (
              !window.confirm(
                "Skasować cały postęp Akademii? Tego nie da się cofnąć — chyba że masz kopię zapasową w pliku („Zapisz kopię Akademii” w zakładce „Synchronizacja i kopie”).",
              )
            )
              return;
            const fluent = tablesSummary(state.facts).fluent;
            const everywhere = sync?.enabled
              ? " Synchronizacja jest włączona, więc postęp zniknie też na pozostałych urządzeniach podłączonych kodem rodziny."
              : "";
            if (
              window.confirm(
                `Na pewno? Znikną: ${pl(state.sessions.length, "sesja", "sesje", "sesji")}, ${pl(state.mocks.length, "próbny test", "próbne testy", "próbnych testów")} i stan ${pl(fluent, "płynnego faktu", "płynnych faktów", "płynnych faktów")}.${everywhere} Postęp działu Dźwięki zostaje nietknięty.`,
              )
            ) {
              resetAll();
            }
          }}
        >
          Wyczyść postęp Akademii
        </BigButton>
      </div>
    </Card>
  );
}
