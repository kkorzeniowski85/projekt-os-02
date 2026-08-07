"use client";

/**
 * Tryb rodzica — zgodnie z briefem główne miejsce pracy na komputerze:
 * przegląd postępu, eksport raportu do okresowej analizy z Claude, stan nagrań.
 *
 * Świadomie bez ładnych wykresów: na tym etapie ważniejsze jest, żeby dane dało
 * się WYNIEŚĆ (markdown/CSV), niż żeby ładnie wyglądały w środku.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ParentGate } from "@/components/ParentGate";
import { PhonemeRecorder } from "@/components/PhonemeRecorder";
import { lessonGraphemes, lessonWords } from "@/lib/curriculum/lessons";
import { IPA_BY_GRAPHEME, trickyHint } from "@/lib/curriculum/ipa";
import { getSound } from "@/lib/curriculum/sounds";
import { importRecordingFiles, listRecordings } from "@/lib/recordings";
import {
  isSupported as folderIsSupported,
  stanFolderu,
  wybierzFolder,
  zapiszPostep,
  zapomnijFolder,
  type StanFolderu,
} from "@/lib/progress/driveFolder";
import {
  buildProgressExport,
  parseProgressFile,
  progressFileName,
} from "@/lib/progress/merge";
import {
  buildAttemptsCsv,
  buildMarkdownReport,
  buildSessionsCsv,
  downloadFile,
} from "@/lib/progress/report";
import { accuracyOf, recommendNext, RULES } from "@/lib/progress/rules";
import { useProgress } from "@/lib/progress/store";
import type { SoundState } from "@/lib/progress/types";

/** Polska odmiana: 1 sesję, 2-4 sesje, 5+ sesji (z wyjątkiem 12-14). */
function sessionsWord(count: number): string {
  if (count === 1) return "sesję";
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return "sesje";
  return "sesji";
}

/** Polska odmiana: 1 głoskę, 2-4 głoski, 5+ głosek. */
function soundsWord(count: number): string {
  if (count === 1) return "głoskę";
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return "głoski";
  return "głosek";
}

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
  const { state, importProgress, setChildName, resetAll, ready } = useProgress();
  const [copied, setCopied] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [kodDoSkopiowania, setKodDoSkopiowania] = useState("");
  const [folder, setFolder] = useState<StanFolderu | null>(null);
  const [folderSupported, setFolderSupported] = useState(false);
  const [wklejonyKod, setWklejonyKod] = useState("");
  const [canShareFile, setCanShareFile] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const audioImportRef = useRef<HTMLInputElement>(null);
  const [audioImportMessage, setAudioImportMessage] = useState<string | null>(null);
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

  // Stan połączenia z folderem sprawdzamy po zamontowaniu — API jest dostępne
  // tylko w przeglądarce na komputerze, więc na tablecie ta sekcja się nie pokaże.
  useEffect(() => {
    setFolderSupported(folderIsSupported());
    if (folderIsSupported()) void stanFolderu().then(setFolder);
  }, []);

  const missingWords = resolved
    ? words.filter((word) => !resolved[wordClipBase(word)]).length
    : null;

  // Web Share API z plikami działa głównie na telefonach/tabletach — tam
  // arkusz udostępniania ma "Zapisz na Dysku" i to najkrótsza droga.
  useEffect(() => {
    try {
      const probe = new File(["x"], "probe.json", { type: "application/json" });
      setCanShareFile(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanShareFile(false);
    }
  }, []);

  function exportProgressFile() {
    downloadFile(progressFileName(), buildProgressExport(state), "application/json");
  }

  async function shareProgressFile() {
    try {
      const file = new File([buildProgressExport(state)], progressFileName(), {
        type: "application/json",
      });
      await navigator.share({ files: [file], title: "Postęp nauki — Liga Dźwięków" });
    } catch {
      // Anulowanie arkusza udostępniania też tu trafia — nic nie robimy.
    }
  }

  async function onImportAudio(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0) return;

    const { imported, skipped } = await importRecordingFiles(files, graphemes);
    await refreshRecordings();

    const parts: string[] = [];
    if (imported.length > 0) {
      parts.push(`Wczytano ${imported.length} ${soundsWord(imported.length)}: ${imported.join(", ")}.`);
    }
    if (skipped.length > 0) {
      parts.push(
        `Pominięto ${skipped.length}: nazwa pliku musi odpowiadać głosce (np. sh.wav, ch.wav).`,
      );
    }
    setAudioImportMessage(parts.join(" ") || "Nic nie wczytano.");
  }

  async function onImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    let text: string;
    try {
      text = await file.text();
    } catch {
      setSyncMessage(
        `Nie udało się otworzyć pliku „${file.name}”. Jeśli wybierasz go z Dysku Google, sprawdź połączenie z internetem i spróbuj ponownie.`,
      );
      return;
    }

    const incoming = parseProgressFile(text);
    if (!incoming) {
      setSyncMessage(
        `Plik „${file.name}” nie wygląda na plik postępu z tej aplikacji (albo pochodzi z innej jej wersji). Szukaj pliku o nazwie liga-dzwiekow-postep-….json.`,
      );
      return;
    }
    const added = importProgress(incoming);
    setSyncMessage(
      added > 0
        ? `Scalono postęp: dodano ${added} ${sessionsWord(added)}. Nic nie zostało nadpisane.`
        : "Plik wczytany — wszystkie sesje z tego pliku już tu były. Nic się nie zmieniło.",
    );
  }

  return (
    <ParentGate>
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
        <h2 className="mb-1 text-lg font-bold">Postęp między urządzeniami (Dysk Google)</h2>
        <p className="mb-3 text-sm text-paper/70">
          Postęp zapisuje się w pamięci tego urządzenia. Żeby przenieść go na inne, zapisz
          plik i umieść na Dysku Google, a na drugim urządzeniu wczytaj go stamtąd.
          Wczytywanie <strong>scala</strong> — sesje z obu urządzeń się sumują i nic nie
          jest nadpisywane, więc kolejność i liczba wczytań nie mają znaczenia.
        </p>
        <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-paper/70">
          <li>
            Tu: {canShareFile ? "„Wyślij na Dysk” (wybierz Dysk Google w oknie udostępniania) albo " : ""}
            „Zapisz plik” i wrzuć go do folderu na Dysku.
          </li>
          <li>
            Na drugim urządzeniu: „Wczytaj plik” → w oknie wyboru otwórz Dysk Google
            (na tablecie: menu ☰ albo „Przeglądaj” → Dysk Google) i wybierz plik{" "}
            <code>liga-dzwiekow-postep-DATA.json</code> — jeśli jest kilka, bierz ten
            z najnowszą datą w nazwie.
          </li>
        </ol>
        {/* Najwygodniejsza droga na komputerze: aplikacja sama pisze plik do
            wskazanego folderu (np. folderu Dysku Google), a synchronizacja
            Dysku roznosi go na pozostałe urządzenia. Zero klikania po sesji. */}
        {folderSupported && (
          <div className="mb-4 rounded-2xl border border-hero-cyan/40 bg-hero-cyan/10 p-4">
            <p className="mb-1 font-bold text-hero-cyan">
              Automatycznie: zapis prosto do folderu na Dysku
            </p>
            {folder?.polaczony ? (
              <>
                <p className="mb-3 text-sm text-paper/80">
                  Połączono z folderem <strong>{folder.nazwaFolderu}</strong>. Po każdej sesji
                  aplikacja sama nadpisuje tam plik{" "}
                  <code>liga-dzwiekow-postep.json</code>
                  {folder.wymagaPotwierdzenia && (
                    <> — ale przeglądarka czeka na potwierdzenie dostępu (przycisk niżej).</>
                  )}
                </p>
                <div className="flex flex-wrap gap-3">
                  <BigButton
                    onClick={async () => {
                      const wynik = await zapiszPostep(buildProgressExport(state), true);
                      setFolder(await stanFolderu());
                      setSyncMessage(
                        wynik === "zapisano"
                          ? `Zapisano do folderu ${folder.nazwaFolderu}. Dysk Google prześle plik na pozostałe urządzenia.`
                          : wynik === "brak-uprawnien"
                            ? "Przeglądarka nie dała dostępu do folderu — spróbuj wskazać go ponownie."
                            : "Nie udało się zapisać do folderu.",
                      );
                    }}
                  >
                    Zapisz teraz
                  </BigButton>
                  <BigButton
                    tone="quiet"
                    onClick={async () => {
                      await zapomnijFolder();
                      setFolder(await stanFolderu());
                      setSyncMessage("Odłączono folder — automatyczny zapis wyłączony.");
                    }}
                  >
                    Odłącz folder
                  </BigButton>
                </div>
              </>
            ) : (
              <>
                <p className="mb-3 text-sm text-paper/80">
                  Wskaż raz folder na Dysku Google (np. <code>aplikacja fiszki Jurek</code>) —
                  od tej pory aplikacja będzie sama zapisywać tam postęp po każdej sesji.
                  Na tablecie wystarczy wtedy raz na jakiś czas wczytać ten plik.
                </p>
                <BigButton
                  onClick={async () => {
                    try {
                      const stan = await wybierzFolder();
                      setFolder(stan);
                      const wynik = await zapiszPostep(buildProgressExport(state), true);
                      setSyncMessage(
                        wynik === "zapisano"
                          ? `Połączono z folderem ${stan.nazwaFolderu} i zapisano pierwszy plik.`
                          : "Folder połączony, ale zapis się nie powiódł — kliknij „Zapisz teraz”.",
                      );
                    } catch {
                      // Anulowanie okna wyboru też tu trafia — nic nie robimy.
                    }
                  }}
                >
                  Wskaż folder na Dysku
                </BigButton>
              </>
            )}
          </div>
        )}

        {/* Przenoszenie tekstem — najpewniejsza droga. Pobieranie plików bywa
            zawodne w zainstalowanej aplikacji (PWA), a okno wyboru plików na
            Androidzie potrafi nie wpuścić pliku z Dysku. Skopiowany tekst
            przejdzie każdym kanałem: mailem, komunikatorem, notatką. */}
        <div className="mb-4 rounded-2xl border border-hero-lime/40 bg-hero-lime/10 p-4">
          <p className="mb-1 font-bold text-hero-lime">Najprościej: przez skopiowany tekst</p>
          <p className="mb-3 text-sm text-paper/80">
            Tu kliknij „Kopiuj kod postępu”, wyślij go sobie na drugie urządzenie (mailem,
            Messengerem, w notatce) i tam wklej w pole poniżej. Bez plików i bez Dysku.
          </p>
          <div className="mb-3 flex flex-wrap gap-3">
            <BigButton
              onClick={async () => {
                const kod = buildProgressExport(state);
                try {
                  await navigator.clipboard.writeText(kod);
                  setSyncMessage(`Skopiowano kod postępu (${kod.length} znaków). Wklej go na drugim urządzeniu.`);
                } catch {
                  // Schowek bywa zablokowany — wtedy pokazujemy kod do ręcznego zaznaczenia.
                  setKodDoSkopiowania(kod);
                  setSyncMessage("Nie udało się użyć schowka — zaznacz i skopiuj kod z pola poniżej.");
                }
              }}
            >
              Kopiuj kod postępu
            </BigButton>
            <BigButton
              tone="quiet"
              onClick={() => setKodDoSkopiowania(kodDoSkopiowania ? "" : buildProgressExport(state))}
            >
              {kodDoSkopiowania ? "Ukryj kod" : "Pokaż kod"}
            </BigButton>
          </div>

          {kodDoSkopiowania && (
            <textarea
              readOnly
              value={kodDoSkopiowania}
              onFocus={(event) => event.target.select()}
              className="mb-3 h-28 w-full rounded-xl bg-black/40 p-3 font-mono text-xs"
            />
          )}

          <label className="flex flex-col gap-2 text-sm text-paper/80">
            Wklej tu kod z drugiego urządzenia:
            <textarea
              value={wklejonyKod}
              onChange={(event) => setWklejonyKod(event.target.value)}
              placeholder='{ "version": 1, ... }'
              className="h-24 w-full rounded-xl bg-black/30 p-3 font-mono text-xs"
            />
          </label>
          <div className="mt-3">
            <BigButton
              tone="yes"
              onClick={() => {
                const incoming = parseProgressFile(wklejonyKod);
                if (!incoming) {
                  setSyncMessage(
                    "Ten tekst nie wygląda na kod postępu. Skopiuj go w całości — od pierwszego znaku { do ostatniego }.",
                  );
                  return;
                }
                const added = importProgress(incoming);
                setWklejonyKod("");
                setSyncMessage(
                  added > 0
                    ? `Scalono postęp: dodano ${added} ${sessionsWord(added)}. Nic nie zostało nadpisane.`
                    : "Kod wczytany — wszystkie sesje z niego już tu były. Nic się nie zmieniło.",
                );
              }}
            >
              Wczytaj z kodu
            </BigButton>
          </div>
        </div>

        <p className="mb-2 text-sm font-bold text-paper/70">Albo przez plik:</p>
        <div className="flex flex-wrap gap-3">
          {canShareFile && <BigButton onClick={() => void shareProgressFile()}>Wyślij na Dysk</BigButton>}
          <BigButton tone={canShareFile ? "quiet" : "primary"} onClick={exportProgressFile}>
            Zapisz plik
          </BigButton>
          <BigButton tone="quiet" onClick={() => importInputRef.current?.click()}>
            Wczytaj plik
          </BigButton>
          {/* Celowo BEZ filtra `accept`: okno wyboru plików na Androidzie
              wyszarza pliki z Dysku Google, gdy ich typ MIME nie pasuje
              dokładnie do filtra — a Dysk różnie zapisuje typ JSON-a.
              Zawartość i tak jest walidowana po wczytaniu. */}
          <input
            ref={importInputRef}
            type="file"
            onChange={(event) => void onImportFile(event)}
            className="hidden"
          />
        </div>
        {syncMessage && (
          <p className="mt-3 rounded-2xl bg-black/25 p-3 text-sm text-paper/85">{syncMessage}</p>
        )}
        <p className="mt-3 text-xs text-paper/50">
          Ten sam plik służy też jako kopia zapasowa (np. przed czyszczeniem danych
          przeglądarki). Nagrania głosek nie wchodzą do pliku — mają własny przycisk ⤓ w
          studiu głosek.
        </p>
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

        <div className="mb-4 rounded-2xl border border-hero-gold/40 bg-hero-gold/10 p-4 text-sm">
          <p className="font-bold text-hero-gold">Głoski są już wstępnie przygotowane</p>
          <p className="mt-1 text-paper/80">
            Każda głoska została automatycznie <strong>wycięta z brytyjskiego nagrania
            słowa</strong> (np. „sh” z początku słowa <em>ship</em>) — to prawdziwy głos i
            prawdziwa wymowa, nie synteza. Nikt ich jednak nie odsłuchał: kliknij ▶ przy
            każdej. Jeśli któraś brzmi źle, nagraj ją swoim głosem — nagranie własne ma
            pierwszeństwo przed plikiem.
          </p>
        </div>

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

        <div className="mb-4 rounded-2xl border border-white/15 bg-black/20 p-4 text-sm">
          <p className="font-bold text-paper">Wczytaj głoski z plików (np. z Dysku Google)</p>
          <p className="mt-1 mb-3 text-paper/70">
            Najkrótsza droga, żeby dźwięki znalazły się na tym urządzeniu bez czekania na
            internet: wskaż pliki <code>sh.wav</code>, <code>ch.wav</code>… z folderu{" "}
            <code>angielski/public/audio/phonemes/</code>. Można zaznaczyć wszystkie naraz.
            Wczytane pliki zostają w pamięci urządzenia i działają też offline.
          </p>
          <BigButton tone="quiet" onClick={() => audioImportRef.current?.click()}>
            Wczytaj pliki głosek
          </BigButton>
          {/* Bez filtra `accept` — Dysk Google potrafi podawać puste typy MIME
              i filtr wyszarzałby poprawne pliki. Nazwy i tak są sprawdzane. */}
          <input
            ref={audioImportRef}
            type="file"
            multiple
            onChange={(event) => void onImportAudio(event)}
            className="hidden"
          />
          {audioImportMessage && (
            <p className="mt-3 rounded-xl bg-black/30 p-3 text-paper/85">{audioImportMessage}</p>
          )}
        </div>

        <p className="mb-2 text-sm text-paper/60">
          Własne nagranie lub wczytany plik: {recordedIds.length} z {graphemes.length}
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
              // Dwa osobne potwierdzenia celowo: to działanie nieodwracalne,
              // a jedno okno łatwo zamknąć odruchowo. Drugie pokazuje, ile
              // konkretnie zostanie utracone, żeby nie było to tylko formalnością.
              if (!window.confirm("Skasować cały postęp dziecka? Tego nie da się cofnąć.")) {
                return;
              }
              const masteredCount = Object.values(state.sounds).filter(
                (sound) => sound.status === "mastered",
              ).length;
              const potwierdzenie =
                `Na pewno? Znikną wszystkie ${state.sessions.length} zapisanych sesji i ` +
                `${masteredCount} opanowanych dźwięków. Tej operacji nie da się cofnąć.`;
              if (window.confirm(potwierdzenie)) {
                resetAll();
              }
            }}
          >
            Wyczyść postęp
          </BigButton>
          <p className="mt-2 text-xs text-paper/50">
            Dane siedzą w tej przeglądarce. Przenoszenie między urządzeniami: karta
            „Postęp między urządzeniami” wyżej.
          </p>
        </div>
      </Card>
    </div>
    </ParentGate>
  );
}
