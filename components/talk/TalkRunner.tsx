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
 * Trzy rzeczy dla skuteczniejszej nauki (prośba rodzica 2026-11-22):
 *  - NAJPIERW POSŁUCHAJ — pytanie, którego dziecko jeszcze nigdy nie dostało,
 *    bohater i Sam (dziecko-rozmówca, components/talk/parts.tsx) najpierw
 *    odgrywają jako krótki dialog z polskim znaczeniem; dopiero potem pytanie
 *    pada do dziecka. Najpierw wzór, potem własna próba.
 *  - WZÓR PO ODPOWIEDZI — gdy dziecko odpowie, Sam od razu mówi wzorcową
 *    odpowiedź (przy pytaniach o siebie: „Sam o sobie”), żeby dziecko mogło
 *    porównać. To zastępuje poprawianie przez rodzica. Pomijane, gdy gotową
 *    odpowiedź dziecko słyszało przed chwilą (podpowiedź 3).
 *  - ZAMIANA RÓL — po rozmowie dziecko samo zadaje te pytania, a bohater
 *    odpowiada (components/talk/RoleSwap.tsx). Dobrowolne, z ekranu końcowego.
 *
 * „Poprzednie pytanie” cofa o jedno pytanie i KASUJE jego ocenę (jeszcze
 * niezapisaną) — przydaje się, gdy ktoś stuknął za szybko albo dziecko chce
 * powiedzieć jeszcze raz. Liczy się dopiero nowa ocena.
 *
 * Ruch (app/globals.css): kto mówi, ten się kiwa i ma fale dźwięku; po pytaniu
 * pulsuje „Twoja kolej”; karta wjeżdża z boku; po odpowiedzi leci gwiazdka.
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
import { PARTNER_NAME, PartnerAvatar, SpeechBubble, sleep } from "./parts";
import { RoleSwap, type SwapResult } from "./RoleSwap";

/** `model` — nowe pytanie: najpierw wzorcowy dialog. `again` — runda „Jeszcze raz”. */
type Step = { entry: TalkEntry; again: boolean; model: boolean };
type Stage = "start" | "running" | "done" | "swap" | "swapDone";
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
  // Obsada i lista „nowych” pytań liczone raz — zapis w trakcie niczego nie podmienia.
  const [cast] = useState(() => talkCast(state));
  const [steps, setSteps] = useState<Step[]>(() => {
    const seen = new Set(
      state.attempts.filter((attempt) => attempt.exercise === "talk").map((attempt) => attempt.item),
    );
    return entries.map((entry) => ({ entry, again: false, model: !seen.has(entry.key) }));
  });
  // Lustro `steps` czytane od razu po dopisaniu rundy „Jeszcze raz” (stan Reacta
  // zmieni się dopiero przy następnym rysowaniu).
  const stepsRef = useRef(steps);
  const [stage, setStage] = useState<Stage>("start");
  const [mode, setMode] = useState<SessionMode>("parent");
  const [index, setIndex] = useState(0);
  const attemptsRef = useRef<PendingAttempt[]>([]);
  const startedRef = useRef(0);
  const [result, setResult] = useState({ own: 0, helped: 0 });
  const [swapResult, setSwapResult] = useState<SwapResult>({ own: 0, helped: 0 });
  const historyRef = useRef<Answered[]>([]);
  // Skąd wjeżdża karta: następne pytanie z prawej, poprzednie z lewej.
  const [direction, setDirection] = useState<"next" | "back">("next");
  // Gwiazdka (sam) albo kciuk (z pomocą) po odpowiedzi; `id` uruchamia animację od nowa.
  const [burst, setBurst] = useState<{ id: number; own: boolean } | null>(null);

  useBusy(stage === "running" || stage === "swap");

  // Pytania do zamiany ról: każde raz; bez tych, na które bohater nie odpowie
  // sensownie (imię — on nie nazywa się Sam).
  const swapEntries = useMemo(() => entries.filter((entry) => entry.question.swap !== false), [entries]);

  /** Zapisuje to, co się zebrało (rozmowę, potem osobno zamianę ról) — można wołać wiele razy. */
  const save = useCallback(() => {
    if (attemptsRef.current.length === 0) return;
    const attempts = attemptsRef.current;
    attemptsRef.current = [];
    historyRef.current = [];
    commitSession({
      soundId: TALK_SESSION_ID,
      track: "vocab",
      mode,
      device: role,
      startedTs: startedRef.current,
      endedTs: Date.now(),
      attempts,
    });
    startedRef.current = Date.now();
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

  /** Ocena pada od razu po stuknięciu — przejście dalej osobno (`advance`), po wzorze odpowiedzi. */
  function record(hints: number, ms: number) {
    const step = stepsRef.current[index];
    attemptsRef.current.push({
      ts: Date.now(),
      soundId: TALK_SESSION_ID,
      exercise: "talk",
      item: step.entry.key,
      correct: hints === 0,
      responseMs: ms,
    });
    if (!step.again) setResult((r) => (hints === 0 ? { ...r, own: r.own + 1 } : { ...r, helped: r.helped + 1 }));
    // Z pomocą → jeszcze raz na końcu rozmowy (tylko raz, już bez wzorcowego dialogu).
    const addedAgain = hints > 0 && !step.again;
    if (addedAgain) {
      stepsRef.current = [...stepsRef.current, { entry: step.entry, again: true, model: false }];
      setSteps(stepsRef.current);
    }
    historyRef.current.push({ hints, counted: !step.again, addedAgain });
    setBurst((previous) => ({ id: (previous?.id ?? 0) + 1, own: hints === 0 }));
  }

  function advance() {
    if (index + 1 >= stepsRef.current.length) {
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
    if (last?.addedAgain) {
      stepsRef.current = stepsRef.current.slice(0, -1);
      setSteps(stepsRef.current);
    }
    setBurst(null);
    setDirection("back");
    setIndex(index - 1);
  }

  function quit() {
    stopAudio();
    save();
    onExit();
  }

  const heroSmall = <HeroAvatar hero={cast.hero} size={role === "phone" ? 64 : 80} />;

  if (stage === "start") {
    const fresh = steps.filter((step) => step.model).length;
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
          {fresh > 0 && ` Nowe pytania najpierw usłyszysz w rozmowie z ${PARTNER_NAME}em.`}
        </p>
        <div className="w-full max-w-xl">
          <ParentTip>
            <p>
              Aplikacja nie słucha dziecka i nie ocenia wymowy — oceniasz Ty: „Sam” albo, po podpowiedzi, „Z pomocą”.
              Jedno słowo to też odpowiedź. Czekaj spokojnie kilka sekund, zanim zaproponujesz podpowiedź. Nie trzeba
              poprawiać: po każdej odpowiedzi {PARTNER_NAME} mówi wzór, a dziecko samo słyszy różnicę. Na końcu warto
              zrobić zamianę ról — wtedy pyta dziecko.
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

  if (stage === "done" || stage === "swapDone") {
    const afterSwap = stage === "swapDone";
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <Celebration />
        <HeroAvatar hero={cast.hero} size={140} cheering />
        <h1 className="text-3xl font-black">
          {afterSwap ? "Brawo! Umiesz pytać po angielsku 🎉" : "Brawo! Cała rozmowa po angielsku 🎉"}
        </h1>
        <Card className="flex flex-col gap-1">
          <p className="text-lg">
            {afterSwap ? "Zapytane samodzielnie" : "Sam"}:{" "}
            <strong className="text-hero-lime">{afterSwap ? swapResult.own : result.own}</strong> · z pomocą:{" "}
            <strong className="text-hero-gold">{afterSwap ? swapResult.helped : result.helped}</strong>
          </p>
          {!afterSwap && <p className="text-sm text-paper/60">Pytania z pomocą wrócą w kolejnych dniach.</p>}
        </Card>
        {!afterSwap && swapEntries.length > 0 && (
          <div className="flex w-full max-w-md flex-col items-center gap-2">
            <BigButton
              tone="yes"
              onClick={() => {
                unlockAudio();
                startedRef.current = Date.now();
                setStage("swap");
              }}
              full
            >
              🔄 Zamiana ról — teraz Ty pytasz!
            </BigButton>
            <p className="text-sm text-paper/60">
              Ty zadajesz pytania, a {cast.hero.codename} odpowiada.
            </p>
          </div>
        )}
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <BigButton tone={afterSwap ? "primary" : "quiet"} onClick={onExit} full>
            Inne rozmowy
          </BigButton>
          <BigButton href="/" tone="quiet" full>
            Koniec
          </BigButton>
        </div>
      </div>
    );
  }

  if (stage === "swap") {
    return (
      <RoleSwap
        entries={swapEntries}
        mode={mode}
        heroVoice={cast.asker}
        helperVoice={cast.answerer}
        hero={heroSmall}
        heroName={cast.hero.codename}
        onAttempt={(attempt) => attemptsRef.current.push(attempt)}
        onDone={(swap) => {
          setSwapResult(swap);
          save();
          setStage("swapDone");
        }}
        onQuit={quit}
      />
    );
  }

  const step = steps[index];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={quit}
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
        hero={heroSmall}
        partnerSize={role === "phone" ? 56 : 68}
        enter={direction}
        onAnswered={record}
        onNext={advance}
        onBack={index > 0 ? back : undefined}
      />
    </div>
  );
}

/**
 * Etapy karty: `listen` — wzorcowy dialog (tylko nowe pytanie); `ask` — pytanie
 * do dziecka; `after` — Sam mówi wzór po odpowiedzi dziecka.
 */
type Phase = "listen" | "ask" | "after";

function QuestionCard({
  step,
  mode,
  asker,
  answerer,
  hero,
  heroName,
  partnerSize,
  enter,
  onAnswered,
  onNext,
  onBack,
}: {
  step: Step;
  mode: SessionMode;
  asker: Voice;
  answerer: Voice;
  hero: React.ReactNode;
  heroName: string;
  partnerSize: number;
  /** Z której strony wjeżdża karta. */
  enter: "next" | "back";
  /** Ocena — od razu po stuknięciu. */
  onAnswered: (hints: number, ms: number) => void;
  /** Przejście do następnego pytania — po wzorze odpowiedzi. */
  onNext: () => void;
  /** Powrót do poprzedniego pytania (brak przy pierwszym). */
  onBack?: () => void;
}) {
  const { question } = step.entry;
  const [phase, setPhase] = useState<Phase>(step.model ? "listen" : "ask");
  const [hint, setHint] = useState(0);
  const [echoKey, setEchoKey] = useState(0);
  // Kto teraz mówi: bohater (pytanie) czy Sam (odpowiedź) — do animacji.
  const [speaker, setSpeaker] = useState<"q" | "a" | null>(null);
  // W dialogu wzorcowym odpowiedź pojawia się dopiero po pytaniu.
  const [answerShown, setAnswerShown] = useState(false);
  // Pytanie do dziecka padło do końca → „Twoja kolej”.
  const [heard, setHeard] = useState(false);
  const startRef = useRef(Date.now());
  // Numer odtwarzania: nowsze (stuknięcie, wyjście z karty) unieważnia starsze.
  const runRef = useRef(0);
  const leftRef = useRef(false);
  // Zawsze najnowsze `onNext` — wołamy je po przerwie, już po kolejnym rysowaniu.
  const nextRef = useRef(onNext);
  nextRef.current = onNext;

  /** Jedna kwestia: animacja mówcy na czas nagrania. False = przerwane przez nowsze odtwarzanie. */
  const say = useCallback(
    async (who: "q" | "a", run: number, slow = false, minMs = 0) => {
      const began = Date.now();
      setSpeaker(who);
      await playPhrase(who === "q" ? question.q : question.answer, {
        voice: who === "q" ? asker : answerer,
        slow,
        wait: true,
      });
      if (run !== runRef.current) return false;
      // Bez dźwięku (wyciszony tablet) kwestia i tak ma chwilę postać na ekranie.
      const left = minMs - (Date.now() - began);
      if (left > 0) {
        await sleep(left);
        if (run !== runRef.current) return false;
      }
      setSpeaker(null);
      return true;
    },
    [question.q, question.answer, asker, answerer],
  );

  /** Pytanie do dziecka (także „Jeszcze raz” i „Wolniej”). */
  const ask = useCallback(
    async (slow = false) => {
      const run = ++runRef.current;
      if (await say("q", run, slow)) setHeard(true);
    },
    [say],
  );

  const startAsk = useCallback(() => {
    setPhase("ask");
    setAnswerShown(false);
    startRef.current = Date.now();
    void ask();
  }, [ask]);

  /** Wzorcowy dialog: bohater pyta, Sam odpowiada, potem pytanie pada do dziecka. */
  const listen = useCallback(async () => {
    const run = ++runRef.current;
    setAnswerShown(false);
    if (!(await say("q", run, false, 1000))) return;
    await sleep(350);
    if (run !== runRef.current) return;
    setAnswerShown(true);
    if (!(await say("a", run, false, 1400))) return;
    await sleep(1000);
    if (run !== runRef.current) return;
    startAsk();
  }, [say, startAsk]);

  // Karta zaczyna sama: nowe pytanie od dialogu, znane — od razu od pytania.
  useEffect(() => {
    const timer = setTimeout(() => void (step.model ? listen() : ask()), 350);
    return () => {
      clearTimeout(timer);
      runRef.current += 1;
      stopAudio();
    };
  }, [step.model, listen, ask]);

  function goNext() {
    if (leftRef.current) return;
    leftRef.current = true;
    runRef.current += 1;
    stopAudio();
    nextRef.current();
  }

  /** Dziecko odpowiedziało: ocena od razu, potem Sam mówi wzór i karta idzie dalej. */
  async function answered() {
    if (phase !== "ask") return;
    playFeedbackTone("good");
    onAnswered(hint, Date.now() - startRef.current);
    // Gotową odpowiedź dziecko słyszało przed chwilą (echo) — nie powtarzamy.
    if (hint >= MAX_HINT) {
      goNext();
      return;
    }
    const run = ++runRef.current;
    stopAudio();
    setPhase("after");
    setSpeaker(null);
    await sleep(450);
    if (run !== runRef.current) return;
    if (!(await say("a", run, false, 1400))) return;
    await sleep(900);
    if (run !== runRef.current) return;
    goNext();
  }

  /** Stuknięty dymek odpowiedzi: jeszcze raz, już bez samoczynnego przejścia. */
  function replayAnswer() {
    const run = ++runRef.current;
    void say("a", run);
  }

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
  const yourTurn = phase === "ask" && heard && speaker === null && hint < MAX_HINT;
  const answerVisible = phase === "after" || (phase === "listen" && answerShown);

  return (
    <Card
      className={`no-select flex flex-col items-center gap-4 text-center ${
        enter === "back" ? "animate-slide-in-left" : "animate-slide-in-right"
      }`}
    >
      {step.again && (
        <p className="rounded-full bg-hero-gold/20 px-4 py-1 text-sm font-bold text-hero-gold">🔁 Jeszcze raz</p>
      )}
      {phase === "listen" && (
        <p className="rounded-full bg-hero-cyan/20 px-4 py-1 text-sm font-bold text-hero-cyan">
          👂 Nowe pytanie — najpierw posłuchaj
        </p>
      )}

      <SpeechBubble
        avatar={hero}
        label={`${heroName} pyta`}
        text={question.q}
        textPl={phase === "listen" || hint >= 1 ? question.qPl : undefined}
        speaking={speaker === "q"}
        onPlay={() => void (phase === "listen" ? listen() : phase === "ask" ? ask() : undefined)}
      />

      {answerVisible && (
        <div className="animate-pop-in w-full max-w-2xl">
          <SpeechBubble
            avatar={<PartnerAvatar size={partnerSize} />}
            side="right"
            label={
              question.personal
                ? `${PARTNER_NAME} mówi o sobie`
                : phase === "after"
                  ? `${PARTNER_NAME} mówi tak`
                  : `${PARTNER_NAME} odpowiada`
            }
            text={question.answer}
            textPl={question.answerPl}
            speaking={speaker === "a"}
            tone="answer"
            onPlay={() => (phase === "listen" ? void listen() : replayAnswer())}
          />
        </div>
      )}

      {question.emoji && (
        <div className="animate-pop-in text-7xl sm:text-8xl" aria-hidden>
          {question.emoji}
        </div>
      )}

      {phase === "listen" && (
        <>
          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <BigButton onClick={startAsk} full>
              Teraz ja ▸
            </BigButton>
            <BigButton tone="quiet" onClick={() => void listen()} full>
              🔁 Jeszcze raz
            </BigButton>
          </div>
          <p className="text-xs text-paper/50">
            Posłuchaj, jak {heroName} pyta, a {PARTNER_NAME} odpowiada. Zaraz pytanie będzie do Ciebie.
          </p>
        </>
      )}

      {phase === "after" && (
        <>
          <BigButton onClick={goNext}>Dalej ▸</BigButton>
          <p className="text-xs text-paper/50">
            {question.personal
              ? `${PARTNER_NAME} odpowiada o sobie — Ty mówisz o sobie.`
              : "Posłuchaj i porównaj ze swoją odpowiedzią."}
          </p>
        </>
      )}

      {phase === "ask" && (
        <>
          {/* Sygnał zmiany ról: pytanie padło — teraz mówi dziecko. Znika, gdy gra gotowa odpowiedź. */}
          <p
            className={`rounded-full px-5 py-2 text-lg font-black transition-opacity duration-300 ${
              yourTurn ? "animate-nudge bg-hero-lime/20 text-hero-lime opacity-100" : "opacity-0"
            }`}
            aria-hidden={!yourTurn}
          >
            🗣️ Twoja kolej — {question.personal ? "powiedz o sobie!" : "powiedz na głos!"}
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
            <BigButton tone="yes" onClick={() => void answered()} full>
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
        </>
      )}

      {onBack && phase !== "after" && (
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
