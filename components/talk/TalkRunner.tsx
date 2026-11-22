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
 *
 * „Poprzednie pytanie” cofa o jedno pytanie i KASUJE jego ocenę (jeszcze
 * niezapisaną) — przydaje się, gdy ktoś stuknął za szybko albo dziecko chce
 * powiedzieć jeszcze raz. Liczy się dopiero nowa ocena.
 *
 * Ruch (app/globals.css): bohater „mówi”, gdy gra pytanie; po pytaniu pulsuje
 * „Twoja kolej”; karta wjeżdża z boku; po odpowiedzi leci gwiazdka.
 */

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
/** Ślad odpowiedzi — żeby „Poprzednie pytanie” mogło ją cofnąć. */
type Answered = { hints: number; counted: boolean; addedAgain: boolean };

const MAX_HINT = 3;

/**
 * `onExit` — powrót do listy rozmów. To NIE jest link: lista i rozmowa są tą
 * samą stroną (/rozmowa), więc link „do /rozmowa” nic by nie zrobił
 * (błąd z 2026-11-22: „Inne rozmowy”, „Wróć” i „Przerwij” nie działały).
 */
export function TalkRunner({ entries, title, onExit }: { entries: TalkEntry[]; title: string; onExit: () => void }) {
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
  const historyRef = useRef<Answered[]>([]);
  // Skąd wjeżdża karta: następne pytanie z prawej, poprzednie z lewej.
  const [direction, setDirection] = useState<"next" | "back">("next");
  // Gwiazdka (sam) albo kciuk (z pomocą) po odpowiedzi; `id` uruchamia animację od nowa.
  const [burst, setBurst] = useState<{ id: number; own: boolean } | null>(null);

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
    const addedAgain = hints > 0 && !step.again;
    if (addedAgain) {
      next = [...steps, { entry: step.entry, again: true }];
      setSteps(next);
    }
    historyRef.current.push({ hints, counted: !step.again, addedAgain });
    setBurst((previous) => ({ id: (previous?.id ?? 0) + 1, own: hints === 0 }));
    if (index + 1 >= next.length) {
      stopAudio();
      save();
      setStage("done");
    } else {
      setDirection("next");
      setIndex(index + 1);
    }
  }

  /** Cofnięcie o jedno pytanie: jego ocena znika, dziecko odpowiada jeszcze raz. */
  function back() {
    if (index === 0) return;
    stopAudio();
    const last = historyRef.current.pop();
    attemptsRef.current.pop();
    if (last?.counted) {
      setResult((r) => (last.hints === 0 ? { ...r, own: r.own - 1 } : { ...r, helped: r.helped - 1 }));
    }
    // Dopisana runda „Jeszcze raz” tego pytania jest zawsze ostatnia (cofamy po kolei).
    if (last?.addedAgain) setSteps((list) => list.slice(0, -1));
    setBurst(null);
    setDirection("back");
    setIndex(index - 1);
  }

  if (stage === "start") {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <button
          type="button"
          onClick={onExit}
          className="flex min-h-11 items-center self-start rounded-full bg-white/10 px-5 text-sm"
        >
          ← Wróć
        </button>
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
          <BigButton onClick={onExit} full>
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
        <button
          type="button"
          onClick={() => {
            stopAudio();
            save();
            onExit();
          }}
          className="flex min-h-11 items-center rounded-full bg-white/10 px-5 text-sm"
        >
          ← Przerwij
        </button>
        <div className="relative flex items-center gap-2">
          {burst && (
            <span
              key={burst.id}
              className="animate-star-fly pointer-events-none absolute -top-1 right-full mr-1 text-3xl"
              aria-hidden
            >
              {burst.own ? "⭐" : "👍"}
            </span>
          )}
          <StepDots total={steps.length} current={index} />
        </div>
      </div>
      <QuestionCard
        key={`${index}-${step.entry.key}`}
        step={step}
        mode={mode}
        asker={cast.asker}
        answerer={cast.answerer}
        heroName={cast.hero.codename}
        hero={<HeroAvatar hero={cast.hero} size={role === "phone" ? 64 : 80} />}
        enter={direction}
        onAnswered={answered}
        onBack={index > 0 ? back : undefined}
      />
    </div>
  );
}

/** Fale dźwięku przy dymku — widać, że bohater właśnie mówi. */
function SoundWaves() {
  return (
    <span className="ml-2 inline-flex h-4 items-end gap-0.5 align-middle" aria-hidden>
      {[0, 1, 2, 3].map((bar) => (
        <span
          key={bar}
          className="wave-bar h-full w-1 rounded-full bg-hero-gold"
          style={{ animationDelay: `${bar * 120}ms` }}
        />
      ))}
    </span>
  );
}

function QuestionCard({
  step,
  mode,
  asker,
  answerer,
  hero,
  heroName,
  enter,
  onAnswered,
  onBack,
}: {
  step: Step;
  mode: SessionMode;
  asker: Voice;
  answerer: Voice;
  hero: React.ReactNode;
  heroName: string;
  /** Z której strony wjeżdża karta. */
  enter: "next" | "back";
  onAnswered: (hints: number, ms: number) => void;
  /** Powrót do poprzedniego pytania (brak przy pierwszym). */
  onBack?: () => void;
}) {
  const { question } = step.entry;
  const [hint, setHint] = useState(0);
  const startRef = useRef(Date.now());
  const [echoKey, setEchoKey] = useState(0);
  // Bohater „mówi”, dopóki gra pytanie; potem „Twoja kolej”.
  const [speaking, setSpeaking] = useState(false);
  const [heard, setHeard] = useState(false);
  const askRunRef = useRef(0);

  const ask = useCallback(
    async (slow = false) => {
      const run = ++askRunRef.current;
      setSpeaking(true);
      await playPhrase(question.q, { voice: asker, slow, wait: true });
      // Nowsze odtworzenie (albo wyjście z ekranu) — ten stan już nieaktualny.
      if (run !== askRunRef.current) return;
      setSpeaking(false);
      setHeard(true);
    },
    [question.q, asker],
  );

  // Pytanie gra samo po wejściu na ekran.
  useEffect(() => {
    const timer = setTimeout(() => void ask(), 350);
    return () => {
      clearTimeout(timer);
      askRunRef.current += 1;
      stopAudio();
    };
  }, [ask]);

  function nextHint() {
    const level = Math.min(MAX_HINT, hint + 1);
    setHint(level);
    if (level === 1) void ask(true);
    if (level === 3) setEchoKey((key) => key + 1);
  }

  function playOption(option: TalkOption) {
    if (/\s/.test(option.en.trim())) void playPhrase(option.en, { voice: answerer });
    else void playWord(option.en, { voice: answerer });
  }

  const blanks = useMemo(() => question.frame?.split("___") ?? null, [question.frame]);

  return (
    <Card
      className={`no-select flex flex-col items-center gap-4 text-center ${
        enter === "back" ? "animate-slide-in-left" : "animate-slide-in-right"
      }`}
    >
      {step.again && (
        <p className="rounded-full bg-hero-gold/20 px-4 py-1 text-sm font-bold text-hero-gold">🔁 Jeszcze raz</p>
      )}
      <div className="flex w-full max-w-2xl items-center gap-3 text-left">
        <div className={`shrink-0 ${speaking ? "animate-talk" : ""}`}>{hero}</div>
        <button
          type="button"
          onClick={() => void ask()}
          className={`flex-1 rounded-2xl px-4 py-3 text-left transition active:translate-y-0.5 ${
            speaking ? "bg-hero-gold/15 ring-2 ring-hero-gold/60" : "bg-white/10"
          }`}
          aria-label={`${heroName} pyta: ${question.q} — stuknij, żeby posłuchać`}
        >
          <span className="block text-xs font-bold tracking-wide text-paper/60 uppercase">
            {heroName} pyta 🔊{speaking && <SoundWaves />}
          </span>
          <span className="font-reading block text-2xl leading-snug sm:text-3xl">{question.q}</span>
          {hint >= 1 && <span className="block text-base text-hero-cyan">{question.qPl}</span>}
        </button>
      </div>

      {question.emoji && (
        <div className="animate-pop-in text-7xl sm:text-8xl" aria-hidden>
          {question.emoji}
        </div>
      )}

      {/* Sygnał zmiany ról: pytanie padło — teraz mówi dziecko. Znika, gdy gra gotowa odpowiedź. */}
      <p
        className={`rounded-full px-5 py-2 text-lg font-black transition-opacity duration-300 ${
          heard && !speaking && hint < MAX_HINT
            ? "animate-nudge bg-hero-lime/20 text-hero-lime opacity-100"
            : "opacity-0"
        }`}
        aria-hidden={!(heard && !speaking && hint < MAX_HINT)}
      >
        🗣️ Twoja kolej — powiedz na głos!
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => void ask()}
          className="min-h-11 rounded-full bg-white/10 px-4 text-sm font-bold"
        >
          🔊 Jeszcze raz
        </button>
        {hint >= 1 && (
          <button
            type="button"
            onClick={() => void ask(true)}
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
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-11 items-center self-start rounded-full bg-white/10 px-5 text-sm font-bold"
        >
          ↩ Poprzednie pytanie
        </button>
      )}
    </Card>
  );
}
