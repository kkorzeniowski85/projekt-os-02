"use client";

/**
 * 🗣️ Rozmowa z bohaterem — przebieg (treść: lib/curriculum/talk.ts, plan:
 * lib/progress/talk.ts).
 *
 * Bohater zadaje pytanie (nagranie gra samo), dziecko odpowiada NA GŁOS.
 * Aplikacja nie słucha i nie ocenia: z rodzicem stuka rodzic („Sam” / „Z
 * pomocą”), w trybie samodzielnym dziecko („Powiedziałem”). Gdy dziecko nie
 * wie — „Podpowiedź”, kolejne stopnie:
 *  1. pytanie jeszcze raz, wolniej, z polskim znaczeniem;
 *  2. początek odpowiedzi i obrazki do wyboru (stuknięty gra);
 *  3. gotowa odpowiedź drugiego lektora i „Mów ze mną” (echo).
 * Odpowiedź z podpowiedzią liczy się jako „z pomocą”; takie pytanie wraca raz
 * na końcu rozmowy („Jeszcze raz”) i po czasie w kolejnych dniach (FSRS).
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Celebration } from "@/components/Celebration";
import { HeroAvatar } from "@/components/HeroAvatar";
import { Echo } from "@/components/session/Speaking";
import { BigButton, Card, ParentTip, StepDots } from "@/components/ui";
import { playFeedbackTone, playPhrase, playWord, stopAudio, unlockAudio } from "@/lib/audio";
import { TALK_SESSION_ID, type TalkEntry, type TalkOption } from "@/lib/curriculum/talk";
import { talkCast } from "@/lib/progress/talk";
import { useProgress, type PendingAttempt } from "@/lib/progress/store";
import type { SessionMode } from "@/lib/progress/types";
import { useBusy } from "@/lib/sessionBusy";
import { useDeviceRole } from "@/lib/useDeviceRole";
import type { Voice } from "@/lib/voices";

type Step = { entry: TalkEntry; again: boolean };
type Stage = "start" | "running" | "done";

const MAX_HINT = 3;

export function TalkRunner({ entries, title, backHref = "/rozmowa" }: { entries: TalkEntry[]; title: string; backHref?: string }) {
  const { role } = useDeviceRole();
  const { state, commitSession } = useProgress();
  // Obsada liczona raz — zmiana postępu w trakcie (zapis) nie zmienia bohatera.
  const [cast] = useState(() => talkCast(state));
  const [stage, setStage] = useState<Stage>("start");
  const [mode, setMode] = useState<SessionMode>("parent");
  const [steps, setSteps] = useState<Step[]>(() => entries.map((entry) => ({ entry, again: false })));
  const [index, setIndex] = useState(0);
  const attemptsRef = useRef<PendingAttempt[]>([]);
  const startedRef = useRef(0);
  const savedRef = useRef(false);
  const [result, setResult] = useState({ own: 0, helped: 0 });

  useBusy(stage === "running");

  const save = useCallback(() => {
    if (savedRef.current || attemptsRef.current.length === 0) return;
    savedRef.current = true;
    commitSession({
      soundId: TALK_SESSION_ID,
      track: "vocab",
      mode,
      device: role,
      startedTs: startedRef.current,
      endedTs: Date.now(),
      attempts: attemptsRef.current,
    });
  }, [commitSession, mode, role]);

  // Wyjście w trakcie (inna strona) zapisuje to, co padło — jak przerwana sesja.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => () => saveRef.current(), []);

  function start(chosen: SessionMode) {
    unlockAudio();
    setMode(chosen);
    startedRef.current = Date.now();
    setStage("running");
  }

  function answered(hints: number, ms: number) {
    const step = steps[index];
    attemptsRef.current.push({
      ts: Date.now(),
      soundId: TALK_SESSION_ID,
      exercise: "talk",
      item: step.entry.key,
      correct: hints === 0,
      responseMs: ms,
    });
    playFeedbackTone("good");
    if (!step.again) setResult((r) => (hints === 0 ? { ...r, own: r.own + 1 } : { ...r, helped: r.helped + 1 }));
    let next = steps;
    // Z pomocą → jeszcze raz na końcu rozmowy (tylko raz).
    if (hints > 0 && !step.again) {
      next = [...steps, { entry: step.entry, again: true }];
      setSteps(next);
    }
    if (index + 1 >= next.length) {
      stopAudio();
      save();
      setStage("done");
    } else {
      setIndex(index + 1);
    }
  }

  if (stage === "start") {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <Link href={backHref} className="flex min-h-11 items-center self-start rounded-full bg-white/10 px-5 text-sm">
          ← Wróć
        </Link>
        <HeroAvatar hero={cast.hero} size={role === "phone" ? 120 : 160} />
        <p className="text-lg font-bold text-hero-cyan">{cast.hero.codename}</p>
        <h1 className="text-3xl font-black">
          <span aria-hidden>🦸</span> {title}
        </h1>
        <p className="max-w-md text-paper/80">
          {cast.hero.codename} zada Ci {entries.length} pytań po angielsku. Odpowiadaj na głos! Gdy nie wiesz — stuknij
          „Podpowiedź”.
        </p>
        <div className="w-full max-w-xl">
          <ParentTip>
            <p>
              Aplikacja nie słucha dziecka i nie ocenia wymowy — oceniasz Ty: „Sam” albo, po podpowiedzi, „Z pomocą”.
              Jedno słowo to też odpowiedź. Czekaj spokojnie kilka sekund, zanim zaproponujesz podpowiedź; po pomyłce
              nie poprawiaj wprost — powtórz poprawną odpowiedź od niechcenia.
            </p>
          </ParentTip>
        </div>
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <BigButton onClick={() => start("parent")} full>
            Z rodzicem
          </BigButton>
          <BigButton tone="quiet" onClick={() => start("solo")} full>
            Sam
          </BigButton>
        </div>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <Celebration />
        <HeroAvatar hero={cast.hero} size={140} cheering />
        <h1 className="text-3xl font-black">Brawo! Cała rozmowa po angielsku 🎉</h1>
        <Card className="flex flex-col gap-1">
          <p className="text-lg">
            Sam: <strong className="text-hero-lime">{result.own}</strong> · z pomocą:{" "}
            <strong className="text-hero-gold">{result.helped}</strong>
          </p>
          <p className="text-sm text-paper/60">Pytania z pomocą wrócą w kolejnych dniach.</p>
        </Card>
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <BigButton href="/rozmowa" full>
            Inne rozmowy
          </BigButton>
          <BigButton href="/" tone="quiet" full>
            Koniec
          </BigButton>
        </div>
      </div>
    );
  }

  const step = steps[index];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          onClick={() => {
            stopAudio();
            save();
          }}
          className="flex min-h-11 items-center rounded-full bg-white/10 px-5 text-sm"
        >
          ← Przerwij
        </Link>
        <StepDots total={steps.length} current={index} />
      </div>
      <QuestionCard
        key={`${index}-${step.entry.key}`}
        step={step}
        mode={mode}
        asker={cast.asker}
        answerer={cast.answerer}
        heroName={cast.hero.codename}
        hero={<HeroAvatar hero={cast.hero} size={role === "phone" ? 64 : 80} />}
        onAnswered={answered}
      />
    </div>
  );
}

function QuestionCard({
  step,
  mode,
  asker,
  answerer,
  hero,
  heroName,
  onAnswered,
}: {
  step: Step;
  mode: SessionMode;
  asker: Voice;
  answerer: Voice;
  hero: React.ReactNode;
  heroName: string;
  onAnswered: (hints: number, ms: number) => void;
}) {
  const { question } = step.entry;
  const [hint, setHint] = useState(0);
  const startRef = useRef(Date.now());
  const [echoKey, setEchoKey] = useState(0);

  const ask = useCallback(
    (slow = false) => void playPhrase(question.q, { voice: asker, slow }),
    [question.q, asker],
  );

  // Pytanie gra samo po wejściu na ekran.
  useEffect(() => {
    const timer = setTimeout(() => ask(), 350);
    return () => {
      clearTimeout(timer);
      stopAudio();
    };
  }, [ask]);

  function nextHint() {
    const level = Math.min(MAX_HINT, hint + 1);
    setHint(level);
    if (level === 1) ask(true);
    if (level === 3) setEchoKey((key) => key + 1);
  }

  function playOption(option: TalkOption) {
    if (/\s/.test(option.en.trim())) void playPhrase(option.en, { voice: answerer });
    else void playWord(option.en, { voice: answerer });
  }

  const blanks = useMemo(() => question.frame?.split("___") ?? null, [question.frame]);

  return (
    <Card className="no-select flex flex-col items-center gap-4 text-center">
      {step.again && (
        <p className="rounded-full bg-hero-gold/20 px-4 py-1 text-sm font-bold text-hero-gold">🔁 Jeszcze raz</p>
      )}
      <div className="flex w-full max-w-2xl items-center gap-3 text-left">
        {hero}
        <button
          type="button"
          onClick={() => ask()}
          className="flex-1 rounded-2xl bg-white/10 px-4 py-3 text-left transition active:translate-y-0.5"
          aria-label={`${heroName} pyta: ${question.q} — stuknij, żeby posłuchać`}
        >
          <span className="block text-xs font-bold tracking-wide text-paper/60 uppercase">{heroName} pyta 🔊</span>
          <span className="font-reading block text-2xl leading-snug sm:text-3xl">{question.q}</span>
          {hint >= 1 && <span className="block text-base text-hero-cyan">{question.qPl}</span>}
        </button>
      </div>

      {question.emoji && (
        <div className="animate-pop-in text-7xl sm:text-8xl" aria-hidden>
          {question.emoji}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => ask()}
          className="min-h-11 rounded-full bg-white/10 px-4 text-sm font-bold"
        >
          🔊 Jeszcze raz
        </button>
        {hint >= 1 && (
          <button
            type="button"
            onClick={() => ask(true)}
            className="min-h-11 rounded-full bg-white/10 px-4 text-sm font-bold"
          >
            🐢 Wolniej
          </button>
        )}
      </div>

      {hint >= 2 && (
        <div className="animate-pop-in flex w-full max-w-2xl flex-col items-center gap-3 rounded-2xl bg-hero-cyan/10 p-3">
          {blanks && (
            <p className="font-reading text-2xl">
              {blanks[0]}
              <span className="mx-1 inline-block min-w-16 border-b-4 border-hero-cyan" aria-label="luka" />
              {blanks[1]}
            </p>
          )}
          {question.options && question.options.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {question.options.map((option) => (
                <button
                  key={option.en}
                  type="button"
                  onClick={() => playOption(option)}
                  className="flex min-h-14 items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-lg font-bold shadow-[0_4px_0_rgba(0,0,0,0.25)] transition active:translate-y-0.5 active:shadow-none"
                >
                  <span className="text-2xl" aria-hidden>
                    {option.emoji}
                  </span>
                  <span className="font-reading">{option.en}</span>
                </button>
              ))}
            </div>
          )}
          {question.personal && (
            <p className="text-sm text-paper/70">
              {question.options?.length ? "Powiedz o sobie — obrazki to tylko przykłady." : "Powiedz o sobie."}
            </p>
          )}
        </div>
      )}

      {hint >= 3 && (
        <div className="animate-pop-in flex flex-col items-center gap-2">
          <p className="text-sm font-bold text-paper/70">
            {question.personal ? "Na przykład tak (powiedz o sobie):" : "Odpowiedź — powtórz za mną:"}
          </p>
          <Echo text={question.answer} auto={echoKey} voice={answerer} />
          <p className="text-base text-hero-cyan">{question.answerPl}</p>
        </div>
      )}

      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <BigButton tone="yes" onClick={() => onAnswered(hint, Date.now() - startRef.current)} full>
          {mode === "parent" ? (hint === 0 ? "Powiedział sam ✓" : "Powiedział z pomocą ✓") : "Powiedziałem ✓"}
        </BigButton>
        {hint < MAX_HINT && (
          <BigButton tone="quiet" onClick={nextHint} full>
            💡 Podpowiedź
          </BigButton>
        )}
      </div>
      <p className="text-xs text-paper/50">
        {mode === "parent"
          ? "Aplikacja nie słucha dziecka — oceniasz Ty. Najpierw daj chwilę na odpowiedź."
          : "Powiedz odpowiedź na głos, potem stuknij."}
      </p>
    </Card>
  );
}
