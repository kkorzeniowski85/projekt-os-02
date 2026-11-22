"use client";

/**
 * ✍️ Dyktando — lektor mówi słowo, dziecko układa je z liter (duża klawiatura
 * na ekranie; na komputerze działa też zwykła). Punkt 9 z aplikacji OET rodzica.
 *
 *  - „Sprawdź”: dobrze → brawo i słowo rozłożone na dźwięki (Fred Talk);
 *    jedna literka różnicy przy pierwszej próbie → „Prawie!” i poprawka;
 *    źle → poprawna pisownia, słowo wraca raz na końcu („Jeszcze raz”).
 *  - „Podpowiedź”: 1 — pierwsza litera i kreski (m _ _), 2 — co druga litera,
 *    3 — całe słowo. Dobrze po podpowiedzi liczy się jako „z pomocą” (słowo
 *    wraca na końcu i wcześniej w planie powtórek).
 * Wielkość liter i spacje nie mają znaczenia.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Celebration } from "@/components/Celebration";
import { BigButton, Card, ParentTip, StepDots } from "@/components/ui";
import { playFeedbackTone, playWord, stopAudio, unlockAudio } from "@/lib/audio";
import { SPELL_SESSION_ID, editDistance, spellHint, type SpellWord } from "@/lib/progress/spell";
import { useProgress, type PendingAttempt } from "@/lib/progress/store";
import { useBusy } from "@/lib/sessionBusy";
import { useDeviceRole } from "@/lib/useDeviceRole";

type Step = { word: SpellWord; again: boolean };
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const MAX_LETTERS = 12;

/** `onAgain` — nowe dyktando na tej samej stronie (strona losuje słowa od nowa). */
export function SpellRunner({ words, onAgain }: { words: SpellWord[]; onAgain: () => void }) {
  const { role } = useDeviceRole();
  const { commitSession } = useProgress();
  const [stage, setStage] = useState<"start" | "running" | "done">("start");
  const [steps, setSteps] = useState<Step[]>(() => words.map((word) => ({ word, again: false })));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState({ own: 0, helped: 0 });
  const attemptsRef = useRef<PendingAttempt[]>([]);
  const startedRef = useRef(0);
  const savedRef = useRef(false);

  useBusy(stage === "running");

  const save = useCallback(() => {
    if (savedRef.current || attemptsRef.current.length === 0) return;
    savedRef.current = true;
    commitSession({
      soundId: SPELL_SESSION_ID,
      track: "vocab",
      mode: "solo",
      device: role,
      startedTs: startedRef.current,
      endedTs: Date.now(),
      attempts: attemptsRef.current,
    });
  }, [commitSession, role]);
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => () => saveRef.current(), []);

  function resolved(ok: boolean, ms: number) {
    const step = steps[index];
    attemptsRef.current.push({
      ts: Date.now(),
      soundId: SPELL_SESSION_ID,
      exercise: "spell",
      item: step.word.word,
      correct: ok,
      responseMs: ms,
    });
    if (!step.again) setScore((s) => (ok ? { ...s, own: s.own + 1 } : { ...s, helped: s.helped + 1 }));
    if (!ok && !step.again) setSteps((list) => [...list, { word: step.word, again: true }]);
  }

  function next() {
    const total = steps.length;
    if (index + 1 >= total) {
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
        <Link href="/" className="flex min-h-11 items-center self-start rounded-full bg-white/10 px-5 text-sm">
          ← Baza
        </Link>
        <div className="text-7xl" aria-hidden>
          ✍️
        </div>
        <h1 className="text-3xl font-black">Dyktando</h1>
        <p className="max-w-md text-paper/80">
          Posłuchaj słowa i ułóż je z literek. {words.length} słów z dźwięków, które już znasz.
        </p>
        <div className="w-full max-w-xl">
          <ParentTip>
            <p>
              Słowa są tylko z poznanych dźwięków, więc da się je napisać ze słuchu. Zachęć dziecko, żeby najpierw
              powiedziało słowo dźwiękami na palcach (Fred Talk: c-a-t), potem pisało dźwięk po dźwięku. Po każdym
              słowie widać jego dźwięki.
            </p>
          </ParentTip>
        </div>
        <BigButton
          onClick={() => {
            unlockAudio();
            startedRef.current = Date.now();
            setStage("running");
          }}
        >
          Zaczynamy!
        </BigButton>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <Celebration />
        <h1 className="text-3xl font-black">Dyktando napisane! 🎉</h1>
        <Card>
          <p className="text-lg">
            Samo: <strong className="text-hero-lime">{score.own}</strong> · z pomocą:{" "}
            <strong className="text-hero-gold">{score.helped}</strong>
          </p>
          <p className="text-sm text-paper/60">Słowa z pomocą wrócą w kolejnych dniach.</p>
        </Card>
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <BigButton onClick={onAgain} full>
            Jeszcze raz
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
          href="/"
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
      <WordCardScreen key={`${index}-${step.word.word}`} step={step} onResolved={resolved} onNext={next} />
    </div>
  );
}

type Phase = "typing" | "almost" | "right" | "wrong";

function WordCardScreen({
  step,
  onResolved,
  onNext,
}: {
  step: Step;
  onResolved: (ok: boolean, ms: number) => void;
  onNext: () => void;
}) {
  const target = step.word.word.toLowerCase();
  const [typed, setTyped] = useState("");
  const [hint, setHint] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [wrongTyped, setWrongTyped] = useState("");
  const startRef = useRef(Date.now());
  const done = phase === "right" || phase === "wrong";

  const say = useCallback(() => void playWord(step.word.word), [step.word.word]);
  useEffect(() => {
    const timer = setTimeout(say, 300);
    return () => {
      clearTimeout(timer);
      stopAudio();
    };
  }, [say]);

  const press = useCallback(
    (letter: string) => {
      if (done) return;
      setTyped((value) => (value.length >= MAX_LETTERS ? value : value + letter));
    },
    [done],
  );
  const erase = useCallback(() => !done && setTyped((value) => value.slice(0, -1)), [done]);

  const check = useCallback(() => {
    if (done) return;
    const answer = typed.trim().toLowerCase();
    if (answer === "") return;
    const ms = Date.now() - startRef.current;
    if (answer === target) {
      playFeedbackTone("good");
      setPhase("right");
      onResolved(hint === 0, ms);
      setTimeout(say, 450);
      return;
    }
    if (phase === "typing" && hint === 0 && target.length >= 4 && editDistance(answer, target) === 1) {
      playFeedbackTone("try-again");
      setPhase("almost");
      return;
    }
    playFeedbackTone("try-again");
    setWrongTyped(answer);
    setPhase("wrong");
    onResolved(false, ms);
    setTimeout(say, 450);
  }, [done, typed, target, hint, phase, onResolved, say]);

  // Klawiatura komputera: litery, Backspace, Enter.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^[a-zA-Z]$/.test(event.key)) press(event.key.toLowerCase());
      else if (event.key === "Backspace") erase();
      else if (event.key === "Enter") (done ? onNext : check)();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, erase, check, done, onNext]);

  function giveHint() {
    const level = Math.min(3, hint + 1);
    setHint(level);
    if (level === 3) {
      // Całe słowo: to już „z pomocą” — dziecko przepisuje i idzie dalej.
      setTyped("");
    }
  }

  return (
    <Card className="no-select flex flex-col items-center gap-4 text-center">
      {step.again && (
        <p className="rounded-full bg-hero-gold/20 px-4 py-1 text-sm font-bold text-hero-gold">🔁 Jeszcze raz</p>
      )}
      <div className="flex items-center gap-4">
        <span className="text-6xl" aria-hidden>
          {step.word.emoji}
        </span>
        <button
          type="button"
          onClick={say}
          className="flex min-h-14 items-center gap-2 rounded-blob bg-hero-gold px-6 py-3 text-xl font-bold text-night shadow-[0_6px_0_#c99a1f] transition active:translate-y-1 active:shadow-none"
        >
          <span aria-hidden>🔊</span> Posłuchaj
        </button>
      </div>

      {hint > 0 && hint < 3 && !done && (
        <p className="font-reading text-3xl tracking-widest text-hero-cyan" aria-label="Podpowiedź">
          {spellHint(target, hint)}
        </p>
      )}
      {hint >= 3 && !done && (
        <p className="font-reading text-4xl text-hero-cyan">
          {target} <span className="block text-sm font-normal text-paper/60">Przepisz to słowo</span>
        </p>
      )}

      <div
        className={`font-reading flex min-h-20 min-w-48 items-center justify-center rounded-2xl border-4 px-4 text-5xl tracking-wide ${
          phase === "right"
            ? "border-hero-lime bg-hero-lime/15"
            : phase === "wrong"
              ? "border-hero-pink bg-hero-pink/10"
              : phase === "almost"
                ? "border-hero-gold bg-hero-gold/10"
                : "border-white/20 bg-black/20"
        } ${phase === "almost" || phase === "wrong" ? "animate-shake" : phase === "right" ? "animate-pop-in" : ""}`}
        aria-live="polite"
      >
        {done ? (
          target
        ) : typed ? (
          // Każda nowa litera „wskakuje” — widać, że stuknięcie zadziałało.
          typed.split("").map((letter, i) => (
            <span key={i} className="animate-pop-in inline-block">
              {letter}
            </span>
          ))
        ) : (
          <span className="opacity-30">…</span>
        )}
      </div>

      {phase === "almost" && <p className="text-lg font-bold text-hero-gold">Prawie! Sprawdź literki i popraw.</p>}
      {phase === "right" && (
        <p className="text-xl font-black text-hero-lime">{hint === 0 ? "Brawo! 🎉" : "Dobrze — z podpowiedzią 👍"}</p>
      )}
      {phase === "wrong" && (
        <p className="text-base text-paper/80">
          Napisane: <strong className="text-hero-pink">{wrongTyped || "—"}</strong> · tak się pisze:{" "}
          <strong className="text-hero-lime">{target}</strong>
        </p>
      )}
      {done && (
        <div className="flex flex-wrap justify-center gap-2" aria-label="Dźwięki słowa">
          {/* Dźwięki pojawiają się po kolei, jak przy Fred Talk (c-a-t). */}
          {step.word.graphemes.map((grapheme, i) => (
            <span
              key={i}
              className="font-reading animate-pop-in rounded-xl bg-white/15 px-3 py-2 text-2xl font-black"
              style={{ animationDelay: `${500 + i * 260}ms` }}
            >
              {grapheme}
            </span>
          ))}
        </div>
      )}

      {done ? (
        <BigButton onClick={onNext}>Dalej ▸</BigButton>
      ) : (
        <>
          <div className="flex w-full max-w-xl flex-col gap-2">
            {ROWS.map((row) => (
              <div key={row} className="flex justify-center gap-1.5">
                {row.split("").map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => press(letter)}
                    className="font-reading flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl bg-white/15 text-2xl font-bold shadow-[0_3px_0_rgba(0,0,0,0.3)] transition active:translate-y-0.5 active:shadow-none sm:h-14 sm:max-w-14"
                  >
                    {letter}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="flex w-full max-w-xl flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={erase}
              className="min-h-14 rounded-2xl bg-white/10 px-5 text-lg font-bold"
              aria-label="Usuń literę"
            >
              ⌫
            </button>
            {hint < 3 && (
              <button type="button" onClick={giveHint} className="min-h-14 rounded-2xl bg-white/10 px-5 text-lg font-bold">
                💡 Podpowiedź
              </button>
            )}
            <button
              type="button"
              onClick={check}
              disabled={typed.trim() === ""}
              className="min-h-14 rounded-2xl bg-hero-lime px-6 text-lg font-black text-night shadow-[0_5px_0_#4fae42] transition active:translate-y-1 active:shadow-none disabled:opacity-40"
            >
              Sprawdź ✓
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
