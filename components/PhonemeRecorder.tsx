"use client";

/**
 * Studio głosek — jeden wiersz na jeden dźwięk.
 *
 * Kolejność pracy jest celowa: najpierw WZORZEC (przykładowe słowo brytyjskim
 * głosem), dopiero potem nagrywanie. Nagrywanie „na ślepo" utrwaliłoby polski
 * akcent tam, gdzie akurat najbardziej przeszkadza (th, angielskie r).
 *
 * Mikrofon włącza się wyłącznie na czas nagrania i tylko po kliknięciu przez
 * dorosłego. Nagranie zostaje na urządzeniu (IndexedDB) — nic nie jest
 * wysyłane i nic nie ocenia wymowy.
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
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  async function refresh() {
    const row = await getRecording(grapheme);
    setRecording(
      row ? { id: row.id, mime: row.mime, size: row.size, createdTs: row.createdTs } : null,
    );
  }

  useEffect(() => {
    void refresh();
    return () => {
      timersRef.current.forEach(clearTimeout);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grapheme]);

  function stopRecording() {
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
  }

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Ta przeglądarka nie pozwala nagrywać.");
      return;
    }

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
        setBusy(false);
        setSecondsLeft(MAX_SECONDS);

        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (blob.size === 0) {
          setError("Nagranie wyszło puste — spróbuj jeszcze raz.");
          return;
        }
        await saveRecording(grapheme, blob);
        await refresh();
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
      timersRef.current.push(setTimeout(stopRecording, MAX_SECONDS * 1000));
    } catch {
      setError("Brak dostępu do mikrofonu — sprawdź uprawnienia przeglądarki.");
      setBusy(false);
    }
  }

  async function removeRecording() {
    await deleteRecording(grapheme);
    await refresh();
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

          <button
            type="button"
            onClick={() => (busy ? stopRecording() : void startRecording())}
            className={`rounded-xl px-3 py-2 text-sm font-bold ${
              busy ? "animate-pulse-ring bg-hero-pink text-white" : "bg-hero-blue text-white"
            }`}
          >
            {busy ? `■ stop (${secondsLeft}s)` : recording ? "● nagraj ponownie" : "● nagraj"}
          </button>

          {recording && (
            <>
              <button
                type="button"
                onClick={() => void download()}
                className="rounded-xl bg-white/10 px-3 py-2 text-sm"
                title="Pobierz, żeby wrzucić do public/audio/phonemes/"
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

      {tricky && <p className="mt-2 text-xs text-hero-gold/80">{tricky}</p>}
      {error && <p className="mt-2 text-xs text-hero-pink">{error}</p>}
    </div>
  );
}
