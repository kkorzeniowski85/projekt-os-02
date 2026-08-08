"use client";

/**
 * Studio głosek — jeden wiersz na jeden dźwięk.
 *
 * Kolejność pracy jest celowa: najpierw WZORZEC (przykładowe słowo brytyjskim
 * głosem), dopiero potem nagrywanie. Nagrywanie „na ślepo" utrwaliłoby polski
 * akcent tam, gdzie akurat najbardziej przeszkadza (th, angielskie r).
 *
 * Mikrofon włącza się wyłącznie na czas nagrania i tylko po kliknięciu przez
 * dorosłego. Nic tu nie ocenia wymowy i nikt niczego nie nasłuchuje w tle.
 * Gotowe nagranie trafia do pamięci urządzenia, a jeśli włączona jest
 * synchronizacja — także do pozostałych urządzeń rodziny.
 *
 * WYCOFANIE SIĘ jest równoprawne z zapisem. Nagrywanie kończy się na dwa
 * sposoby: „zapisz" albo „odrzuć", i to samo dotyczy wyjścia z panelu w
 * trakcie. Powód jest praktyczny: zapis NADPISUJE poprzednie nagranie tej
 * głoski, więc nieudane podejście bez możliwości rezygnacji kasowałoby dobrą
 * wersję sprzed chwili. Dlatego jest też „cofnij" — przywraca to, co było
 * przed ostatnim zapisem.
 */

import { useEffect, useRef, useState } from "react";
import { playPhonemeStrict, playWord } from "@/lib/audio";
import {
  deleteRecording,
  extensionFor,
  getRecording,
  saveRecording,
  type RecordingMeta,
} from "@/lib/recordings";

const MAX_SECONDS = 3;

type Props = {
  grapheme: string;
  ipa?: string;
  exampleWord: string;
  /** Czy w public/audio/phonemes/ leży plik dla tego grafemu. */
  hasFile: boolean;
  /** Ostrzeżenie dla głosek, które trudno wypowiedzieć w izolacji. */
  tricky?: string;
  onChange?: () => void;
};

function pickMimeType(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type));
}

export function PhonemeRecorder({
  grapheme,
  ipa,
  exampleWord,
  hasFile,
  tricky,
  onChange,
}: Props) {
  const [recording, setRecording] = useState<RecordingMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
  const [mozeCofnac, setMozeCofnac] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Ustawione, gdy bieżące nagranie ma zostać porzucone zamiast zapisane. */
  const odrzucRef = useRef(false);
  /** Nagranie sprzed ostatniego zapisu — materiał dla „cofnij". */
  const poprzednieRef = useRef<Blob | null>(null);

  async function refresh() {
    const row = await getRecording(grapheme);
    setRecording(
      row ? { id: row.id, mime: row.mime, size: row.size, createdTs: row.createdTs } : null,
    );
  }

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  useEffect(() => {
    void refresh();
    return () => {
      // Wyjście z panelu w trakcie nagrywania to rezygnacja, nie zapis —
      // inaczej zamknięcie ekranu utrwalałoby przypadkowe, ucięte podejście.
      odrzucRef.current = true;
      clearTimers();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grapheme]);

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  /** Zakończ i zapisz to, co już nagrane. */
  function zapiszTeraz() {
    odrzucRef.current = false;
    clearTimers();
    stopRecording();
  }

  /** Zakończ i wyrzuć — poprzednie nagranie głoski zostaje nietknięte. */
  function odrzucNagranie() {
    odrzucRef.current = true;
    clearTimers();
    stopRecording();
  }

  async function startRecording() {
    setError(null);
    setInfo(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Ta przeglądarka nie pozwala nagrywać.");
      return;
    }

    // Zapamiętujemy to, co jest teraz — żeby „cofnij" miało co przywrócić.
    const istniejace = await getRecording(grapheme);
    poprzednieRef.current = istniejace?.blob ?? null;
    setMozeCofnac(false);
    odrzucRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = async () => {
        // Mikrofon zwalniamy natychmiast — żadnego nasłuchiwania w tle.
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        clearTimers();
        setBusy(false);
        setSecondsLeft(MAX_SECONDS);

        if (odrzucRef.current) {
          odrzucRef.current = false;
          setInfo(
            istniejace
              ? "Odrzucone — zostaje poprzednie nagranie."
              : "Odrzucone — nic nie zapisano.",
          );
          return;
        }

        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (blob.size === 0) {
          setError("Nagranie wyszło puste — spróbuj jeszcze raz.");
          return;
        }
        await saveRecording(grapheme, blob);
        await refresh();
        setMozeCofnac(true);
        onChange?.();
        // Od razu odtwarzamy, żeby było słychać, co się zapisało.
        void playPhonemeStrict(grapheme);
      };

      recorder.start();
      setBusy(true);
      setSecondsLeft(MAX_SECONDS);

      for (let second = 1; second <= MAX_SECONDS; second++) {
        timersRef.current.push(
          setTimeout(() => setSecondsLeft(MAX_SECONDS - second), second * 1000),
        );
      }
      timersRef.current.push(setTimeout(zapiszTeraz, MAX_SECONDS * 1000));
    } catch {
      setError("Brak dostępu do mikrofonu — sprawdź uprawnienia przeglądarki.");
      setBusy(false);
    }
  }

  /**
   * Przywrócenie stanu sprzed ostatniego zapisu. Świadomie ze świeżym
   * znacznikiem czasu: cofnięcie ma wygrać także na pozostałych urządzeniach,
   * gdyby nieudane podejście zdążyło się już do nich rozejść.
   */
  async function cofnij() {
    const poprzednie = poprzednieRef.current;
    if (poprzednie) await saveRecording(grapheme, poprzednie);
    else await deleteRecording(grapheme);

    poprzednieRef.current = null;
    setMozeCofnac(false);
    await refresh();
    setInfo(poprzednie ? "Przywrócono poprzednie nagranie." : "Cofnięte — nagrania nie ma.");
    onChange?.();
  }

  async function removeRecording() {
    poprzednieRef.current = (await getRecording(grapheme))?.blob ?? null;
    await deleteRecording(grapheme);
    await refresh();
    setMozeCofnac(Boolean(poprzednieRef.current));
    setInfo("Usunięte.");
    onChange?.();
  }

  async function download() {
    const row = await getRecording(grapheme);
    if (!row) return;
    const url = URL.createObjectURL(row.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${grapheme}.${extensionFor(row.mime)}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const status = recording ? "nagranie własne" : hasFile ? "plik w aplikacji" : "brak";
  const statusStyle = recording
    ? "bg-hero-lime/20 text-hero-lime"
    : hasFile
      ? "bg-white/10 text-paper/70"
      : "bg-hero-pink/20 text-hero-pink";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-reading min-w-12 text-2xl font-black">{grapheme}</span>
        {ipa && <span className="text-sm text-paper/50">/{ipa}/</span>}
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusStyle}`}>
          {status}
        </span>

        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void playWord(exampleWord)}
            className="rounded-xl bg-hero-gold/20 px-3 py-2 text-sm text-hero-gold"
            title={`Wzorzec: słowo „${exampleWord}"`}
          >
            🔊 wzorzec: {exampleWord}
          </button>

          <button
            type="button"
            disabled={!recording && !hasFile}
            onClick={() => void playPhonemeStrict(grapheme)}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm disabled:opacity-30"
          >
            ▶ głoska
          </button>

          {busy ? (
            // W trakcie nagrywania obie drogi wyjścia stoją obok siebie i są
            // tak samo dostępne — rezygnacja nie jest schowana.
            <>
              <button
                type="button"
                onClick={zapiszTeraz}
                className="animate-pulse-ring rounded-xl bg-hero-lime px-3 py-2 text-sm font-bold text-night"
              >
                ■ zapisz teraz ({secondsLeft}s)
              </button>
              <button
                type="button"
                onClick={odrzucNagranie}
                className="rounded-xl bg-hero-pink/80 px-3 py-2 text-sm font-bold text-white"
                title="Zakończ bez zapisywania — poprzednie nagranie zostaje"
              >
                ✕ odrzuć
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void startRecording()}
              className="rounded-xl bg-hero-blue px-3 py-2 text-sm font-bold text-white"
            >
              {recording ? "● nagraj ponownie" : "● nagraj"}
            </button>
          )}

          {mozeCofnac && !busy && (
            <button
              type="button"
              onClick={() => void cofnij()}
              className="rounded-xl bg-hero-gold/25 px-3 py-2 text-sm font-bold text-hero-gold"
              title="Przywróć stan sprzed ostatniego zapisu"
            >
              ↩ cofnij
            </button>
          )}

          {recording && !busy && (
            <>
              <button
                type="button"
                onClick={() => void download()}
                className="rounded-xl bg-white/10 px-3 py-2 text-sm"
                title="Pobierz nagranie jako plik"
              >
                ⤓
              </button>
              <button
                type="button"
                onClick={() => void removeRecording()}
                className="rounded-xl bg-white/10 px-3 py-2 text-sm"
                title="Usuń nagranie"
              >
                🗑
              </button>
            </>
          )}
        </div>
      </div>

      {busy && (
        <p className="mt-2 text-xs text-paper/60">
          Nagrywam… „zapisz teraz” kończy i zachowuje, „odrzuć” wychodzi bez zapisu.
        </p>
      )}
      {tricky && <p className="mt-2 text-xs text-hero-gold/80">{tricky}</p>}
      {info && !busy && <p className="mt-2 text-xs text-paper/70">{info}</p>}
      {error && <p className="mt-2 text-xs text-hero-pink">{error}</p>}
    </div>
  );
}
