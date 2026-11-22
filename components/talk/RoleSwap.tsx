"use client";

/**
 * 🔄 Zamiana ról (2026-11-22) — po rozmowie pyta DZIECKO, a odpowiada bohater.
 *
 * Po co: w zwykłej rozmowie dziecko tylko odpowiada, a w szkole i na podwórku
 * musi też umieć zapytać („Can I play with you?”). Tu czyta pytanie na głos
 * (jest na ekranie, z polskim znaczeniem), a bohater odpowiada nagraniem.
 * Gdy nie da rady — „Posłuchaj pytania” (drugi lektor) i powtarza; to liczy
 * się jako „z pomocą”.
 *
 * Aplikacja nadal nie słucha dziecka: z rodzicem stuka rodzic, samo — dziecko.
 * Próby zapisujemy jak mówione zwroty (ćwiczenie `say`, zdanie = pytanie);
 * w trybie samodzielnym bez oceny, bo nikt nie słyszał.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BigButton, Card, StepDots } from "@/components/ui";
import { playFeedbackTone, playPhrase, stopAudio } from "@/lib/audio";
import { TALK_SESSION_ID, type TalkEntry } from "@/lib/curriculum/talk";
import type { PendingAttempt } from "@/lib/progress/store";
import type { SessionMode } from "@/lib/progress/types";
import type { Voice } from "@/lib/voices";
import { SpeechBubble, sleep } from "./parts";

export type SwapResult = { own: number; helped: number };

export function RoleSwap({
  entries,
  mode,
  heroVoice,
  helperVoice,
  hero,
  heroName,
  onAttempt,
  onDone,
  onQuit,
}: {
  entries: TalkEntry[];
  mode: SessionMode;
  /** Głos bohatera (ten, którym pytał w rozmowie) — teraz nim odpowiada. */
  heroVoice: Voice;
  /** Drugi lektor — podpowiada, jak brzmi pytanie. */
  helperVoice: Voice;
  hero: ReactNode;
  heroName: string;
  onAttempt: (attempt: PendingAttempt) => void;
  onDone: (result: SwapResult) => void;
  onQuit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const resultRef = useRef<SwapResult>({ own: 0, helped: 0 });
  const entry = entries[index];

  function asked(hinted: boolean, ms: number) {
    onAttempt({
      ts: Date.now(),
      soundId: TALK_SESSION_ID,
      exercise: "say",
      item: entry.question.q,
      // Samodzielnie nikt nie słyszał — bez oceny, jak przy zwrotach w tematach.
      correct: mode === "parent" ? !hinted : null,
      responseMs: ms,
    });
    if (hinted) resultRef.current.helped += 1;
    else resultRef.current.own += 1;
  }

  function next() {
    if (index + 1 >= entries.length) onDone(resultRef.current);
    else setIndex(index + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onQuit}
          className="flex min-h-11 items-center rounded-full bg-white/10 px-5 text-sm"
        >
          ← Przerwij
        </button>
        <StepDots total={entries.length} current={index} />
      </div>
      <SwapCard
        key={`${index}-${entry.key}`}
        entry={entry}
        mode={mode}
        heroVoice={heroVoice}
        helperVoice={helperVoice}
        hero={hero}
        heroName={heroName}
        onAsked={asked}
        onNext={next}
      />
    </div>
  );
}

function SwapCard({
  entry,
  mode,
  heroVoice,
  helperVoice,
  hero,
  heroName,
  onAsked,
  onNext,
}: {
  entry: TalkEntry;
  mode: SessionMode;
  heroVoice: Voice;
  helperVoice: Voice;
  hero: ReactNode;
  heroName: string;
  onAsked: (hinted: boolean, ms: number) => void;
  onNext: () => void;
}) {
  const { question } = entry;
  const [phase, setPhase] = useState<"ask" | "answer">("ask");
  const [hinted, setHinted] = useState(false);
  const [speaker, setSpeaker] = useState<"q" | "a" | null>(null);
  // Numer odtwarzania: nowsze (stuknięcie, wyjście z karty) unieważnia starsze.
  const runRef = useRef(0);
  const leftRef = useRef(false);
  const startRef = useRef(Date.now());

  useEffect(
    () => () => {
      runRef.current += 1;
      stopAudio();
    },
    [],
  );

  /** Podpowiedź: drugi lektor mówi pytanie — dziecko powtarza. */
  async function hearQuestion() {
    if (phase !== "ask") return;
    const run = ++runRef.current;
    setHinted(true);
    setSpeaker("q");
    await playPhrase(question.q, { voice: helperVoice, wait: true });
    if (run !== runRef.current) return;
    setSpeaker(null);
  }

  function goNext() {
    if (leftRef.current) return;
    leftRef.current = true;
    runRef.current += 1;
    stopAudio();
    onNext();
  }

  /** Pytanie padło — bohater odpowiada i karta sama idzie dalej. */
  async function asked() {
    if (phase !== "ask") return;
    playFeedbackTone("good");
    onAsked(hinted, Date.now() - startRef.current);
    const run = ++runRef.current;
    stopAudio();
    setPhase("answer");
    setSpeaker(null);
    await sleep(450);
    if (run !== runRef.current) return;
    setSpeaker("a");
    const began = Date.now();
    await playPhrase(question.answer, { voice: heroVoice, wait: true });
    if (run !== runRef.current) return;
    // Bez dźwięku (wyciszony tablet) odpowiedź i tak ma chwilę postać na ekranie.
    const left = 1400 - (Date.now() - began);
    if (left > 0) {
      await sleep(left);
      if (run !== runRef.current) return;
    }
    setSpeaker(null);
    await sleep(1000);
    if (run !== runRef.current) return;
    goNext();
  }

  /** Stuknięty dymek odpowiedzi: jeszcze raz, już bez samoczynnego przejścia. */
  async function replayAnswer() {
    const run = ++runRef.current;
    setSpeaker("a");
    await playPhrase(question.answer, { voice: heroVoice, wait: true });
    if (run !== runRef.current) return;
    setSpeaker(null);
  }

  return (
    <Card className="no-select animate-slide-in-right flex flex-col items-center gap-4 text-center">
      <p className="rounded-full bg-hero-gold/20 px-4 py-1 text-sm font-bold text-hero-gold">
        🔄 Zamiana ról — teraz Ty pytasz!
      </p>

      <SpeechBubble
        avatar={
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full bg-hero-blue/40 text-4xl ring-2 ring-hero-blue"
            aria-hidden
          >
            🙋
          </span>
        }
        side="right"
        label={speaker === "q" ? "Posłuchaj i powtórz" : `Zapytaj: ${heroName}`}
        text={question.q}
        textPl={question.qPl}
        speaking={speaker === "q"}
        onPlay={() => void hearQuestion()}
      />

      {question.emoji && (
        <div className="text-6xl sm:text-7xl" aria-hidden>
          {question.emoji}
        </div>
      )}

      {phase === "ask" ? (
        <div className="flex w-full max-w-2xl items-center gap-3 text-left">
          <div className="shrink-0">{hero}</div>
          <p className="animate-nudge rounded-2xl bg-white/5 px-4 py-3 text-base text-paper/70">
            👂 {heroName} czeka na Twoje pytanie…
          </p>
        </div>
      ) : (
        <div className="animate-pop-in w-full max-w-2xl">
          <SpeechBubble
            avatar={hero}
            label={`${heroName} odpowiada`}
            text={question.answer}
            textPl={question.answerPl}
            speaking={speaker === "a"}
            tone="answer"
            onPlay={() => void replayAnswer()}
          />
        </div>
      )}

      {phase === "ask" ? (
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <BigButton tone="yes" onClick={() => void asked()} full>
            {mode === "parent" ? (hinted ? "Zapytał z pomocą ✓" : "Zapytał sam ✓") : "Zapytałem ✓"}
          </BigButton>
          <BigButton tone="quiet" onClick={() => void hearQuestion()} full>
            🔊 Posłuchaj pytania
          </BigButton>
        </div>
      ) : (
        <BigButton onClick={goNext}>Dalej ▸</BigButton>
      )}
      <p className="text-xs text-paper/50">
        {phase === "ask"
          ? "Przeczytaj pytanie na głos. Gdy trudno — posłuchaj i powtórz."
          : `${heroName} odpowiada na Twoje pytanie.`}
      </p>
    </Card>
  );
}
