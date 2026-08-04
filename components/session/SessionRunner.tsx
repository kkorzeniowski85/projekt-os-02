"use client";

/**
 * Silnik jednej sesji nauki (10-15 minut, jeden cel).
 *
 * Przebieg wg briefu: wprowadzenie dźwięku → rozpoznanie ze słuchu → czytanie
 * słów (blending) → krótkie podsumowanie z nagrodą.
 *
 * Sesja jest sterowana danymi (lib/curriculum/lessons.ts), więc kolejny dźwięk
 * to nowy wpis w danych, a nie nowy kod.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeroAvatar } from "@/components/HeroAvatar";
import { BigButton, Card, ParentTip, PhonemeSpeaker, StepDots, WordSpeaker } from "@/components/ui";
import {
  playFeedbackTone,
  playPhonemeStrict,
  playWord,
  primeSpeech,
  unlockAudio,
} from "@/lib/audio";
import type { ChoiceRound, Lesson, ListenItem, WordCard } from "@/lib/curriculum/lessons";
import type { Sound } from "@/lib/curriculum/sounds";
import { getHero, HEROES_BY_ID } from "@/lib/heroes";
import { useProgress, type PendingAttempt, type SessionOutcome } from "@/lib/progress/store";
import type { DeviceRole, SessionMode } from "@/lib/progress/types";
import { useDeviceRole } from "@/lib/useDeviceRole";

type Screen =
  | { kind: "listen"; item: ListenItem }
  | { kind: "blend"; card: WordCard }
  | { kind: "choice"; round: ChoiceRound };

/** Fisher-Yates na kopii — wywoływane po kliknięciu startu, nigdy w renderze. */
function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Telefon dostaje krótszą sesję ("szybka misja" z briefu) — te same ćwiczenia,
 * mniej powtórzeń. Tablet i komputer dostają pełny zestaw.
 *
 * Kolejność słuchania i opcje wyboru są tasowane przy KAŻDYM starcie — inaczej
 * dziecko przy "Jeszcze raz" zapamiętuje pozycje odpowiedzi zamiast słuchać.
 * Sklejanie zostaje w kolejności z lekcji (ma progresję trudności).
 */
function buildScreens(lesson: Lesson, role: DeviceRole): Screen[] {
  const short = role === "phone";

  // Krótka sesja losuje słowa, ale zawsze po równo TAK i NIE — losowanie z całej
  // puli potrafiłoby dać same "NIE" i dziecko ani razu nie usłyszałoby dźwięku.
  const withTarget = shuffled(lesson.listen.filter((item) => item.hasTarget));
  const withoutTarget = shuffled(lesson.listen.filter((item) => !item.hasTarget));
  const listen = short
    ? shuffled([...withTarget.slice(0, 2), ...withoutTarget.slice(0, 2)])
    : shuffled(lesson.listen);

  const blend = short ? lesson.blend.slice(0, 2) : lesson.blend;
  const choice = shuffled(lesson.choice)
    .slice(0, short ? 2 : lesson.choice.length)
    .map((round) => ({ ...round, options: shuffled(round.options) }));

  return [
    ...listen.map<Screen>((item) => ({ kind: "listen", item })),
    ...blend.map<Screen>((card) => ({ kind: "blend", card })),
    ...choice.map<Screen>((round) => ({ kind: "choice", round })),
  ];
}

export function SessionRunner({ sound, lesson }: { sound: Sound; lesson: Lesson }) {
  const { role } = useDeviceRole();
  const { commitSession } = useProgress();
  const hero = getHero(lesson.heroId);

  const [stage, setStage] = useState<"intro" | "running" | "done">("intro");
  const [mode, setMode] = useState<SessionMode>("parent");
  const [screens, setScreens] = useState<Screen[]>([]);
  const [index, setIndex] = useState(0);
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);

  const attemptsRef = useRef<PendingAttempt[]>([]);
  const startedTsRef = useRef(0);

  useEffect(() => primeSpeech(), []);

  const start = useCallback(
    (chosenMode: SessionMode) => {
      // Kliknięcie startu to gest użytkownika — jedyny moment, w którym iOS
      // pozwala "odblokować" audio na resztę sesji.
      unlockAudio();
      setMode(chosenMode);
      setScreens(buildScreens(lesson, role));
      attemptsRef.current = [];
      startedTsRef.current = Date.now();
      setIndex(0);
      setOutcome(null);
      setStage("running");
    },
    [lesson, role],
  );

  const finish = useCallback(() => {
    const result = commitSession({
      soundId: sound.id,
      mode,
      device: role,
      startedTs: startedTsRef.current,
      endedTs: Date.now(),
      attempts: attemptsRef.current,
    });
    setOutcome(result);
    setStage("done");
  }, [commitSession, mode, role, sound.id]);

  const handleAttempt = useCallback((attempt: PendingAttempt) => {
    attemptsRef.current = [...attemptsRef.current, attempt];
    setIndex((previous) => previous + 1);
  }, []);

  // Ostatni ekran przerobiony → zamykamy sesję i zapisujemy postęp.
  useEffect(() => {
    if (stage === "running" && screens.length > 0 && index >= screens.length) {
      finish();
    }
  }, [stage, index, screens.length, finish]);

  const screen = screens[index];

  if (stage === "intro") {
    return <IntroScreen sound={sound} lesson={lesson} heroId={lesson.heroId} onStart={start} role={role} />;
  }

  if (stage === "done" && outcome) {
    return (
      <RewardScreen
        sound={sound}
        lesson={lesson}
        outcome={outcome}
        onAgain={() => start(mode)}
      />
    );
  }

  return (
    <div className={role === "desktop" ? "grid grid-cols-[1fr_320px] gap-6" : "flex flex-col gap-4"}>
      <div className="flex flex-col gap-4">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-paper/60 underline">
            ← Przerwij
          </Link>
          <StepDots total={screens.length} current={index} />
          <span className="font-reading rounded-full bg-white/10 px-3 py-1 text-sm font-bold">
            {sound.grapheme}
          </span>
        </header>

        {screen?.kind === "listen" && (
          <ListenScreen
            key={`listen-${index}`}
            item={screen.item}
            sound={sound}
            mode={mode}
            onDone={handleAttempt}
          />
        )}
        {screen?.kind === "blend" && (
          <BlendScreen
            key={`blend-${index}`}
            card={screen.card}
            sound={sound}
            mode={mode}
            onDone={handleAttempt}
          />
        )}
        {screen?.kind === "choice" && (
          <ChoiceScreen
            key={`choice-${index}`}
            round={screen.round}
            sound={sound}
            mode={mode}
            onDone={handleAttempt}
          />
        )}
      </div>

      {role === "desktop" && (
        <aside className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <HeroAvatar hero={hero} emblem={sound.grapheme} size={70} />
              <div>
                <p className="font-bold">{hero.codename}</p>
                <p className="text-xs text-paper/70">{hero.power}</p>
              </div>
            </div>
          </Card>
          <ParentTip>
            <p className="mb-2">{lesson.parentIntro}</p>
            {sound.parentHintPl && <p className="text-paper/80">{sound.parentHintPl}</p>}
          </ParentTip>
          <Card className="text-sm text-paper/70">
            <p className="mb-1 font-bold text-paper">Tryb: {mode === "parent" ? "z rodzicem" : "samodzielny"}</p>
            <p>
              Ćwiczenia mówione ocenia rodzic — aplikacja świadomie nie ocenia wymowy
              dziecka.
            </p>
          </Card>
        </aside>
      )}
    </div>
  );
}

// --- Ekran wprowadzenia -----------------------------------------------------

function IntroScreen({
  sound,
  lesson,
  heroId,
  onStart,
  role,
}: {
  sound: Sound;
  lesson: Lesson;
  heroId: string;
  onStart: (mode: SessionMode) => void;
  role: DeviceRole;
}) {
  const hero = getHero(heroId);
  const phone = role === "phone";

  const parentTip = (
    <div className="w-full max-w-xl">
      <ParentTip>
        <p className="mb-2">{lesson.parentIntro}</p>
        {sound.parentHintPl && <p className="text-paper/80">{sound.parentHintPl}</p>}
      </ParentTip>
    </div>
  );

  return (
    <div className={`flex flex-col items-center text-center ${phone ? "gap-4" : "gap-6"}`}>
      <Link href="/" className="self-start text-sm text-paper/60 underline">
        ← Wróć
      </Link>

      <div className="flex flex-col items-center gap-2">
        <HeroAvatar hero={hero} emblem={sound.grapheme} size={role === "phone" ? 120 : 170} />
        <p className="text-lg font-bold text-hero-cyan">{hero.codename}</p>
      </div>

      <h1 className="text-3xl font-black">
        Dziś dźwięk <span className="font-reading text-hero-gold">{sound.grapheme}</span>
      </h1>

      <PhonemeSpeaker soundId={sound.id} grapheme={sound.grapheme} exampleWord={sound.example} />

      <p className="font-reading text-2xl font-bold tracking-widest text-hero-lime">
        {lesson.chant}
      </p>

      {/* Na telefonie przyciski startu muszą być nad zgięciem — wskazówka dla
          rodzica ląduje pod nimi, bo to dorosły ją czyta, nie dziecko. */}
      {!phone && parentTip}

      <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
        <BigButton onClick={() => onStart("parent")} full>
          Z rodzicem
        </BigButton>
        <BigButton tone="quiet" onClick={() => onStart("solo")} full>
          Sam
        </BigButton>
      </div>
      <p className="max-w-md text-xs text-paper/50">
        Nowy dźwięk najlepiej wprowadzić razem — tryb samodzielny służy utrwalaniu
        tego, co dziecko już zna.
      </p>
      {phone && parentTip}
    </div>
  );
}

// --- Ćwiczenie 1: słyszę czy nie słyszę ------------------------------------

function ListenScreen({
  item,
  sound,
  mode,
  onDone,
}: {
  item: ListenItem;
  sound: Sound;
  mode: SessionMode;
  onDone: (attempt: PendingAttempt) => void;
}) {
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    // Gdy przeglądarka zablokuje automatyczne odtworzenie (iOS bez wcześniejszego
    // gestu), pokazujemy dziecku, że ma stuknąć w głośnik.
    void playWord(item.word).then((result) => setNeedsTap(result.source === "unavailable"));
  }, [item.word]);

  useEffect(() => {
    if (answer === null) return;
    const correct = answer === item.hasTarget;
    playFeedbackTone(correct ? "good" : "try-again");
    if (!correct) void playWord(item.word);

    // Po błędzie dłuższa pauza: słowo gra jeszcze raz, a dziecko ma zdążyć
    // je usłyszeć ZANIM ekran zniknie. 2 sekundy było za mało.
    const timer = setTimeout(
      () =>
        onDone({
          ts: Date.now(),
          soundId: sound.id,
          exercise: "listen",
          item: item.word,
          correct,
          responseMs: Date.now() - startRef.current,
        }),
      correct ? 1100 : 3200,
    );
    return () => clearTimeout(timer);
  }, [answer, item, sound.id, onDone]);

  const correct = answer !== null && answer === item.hasTarget;

  return (
    <Card className="no-select flex flex-col items-center gap-5 text-center">
      <h2 className="text-2xl font-bold">
        Słyszysz <span className="font-reading text-hero-gold">{sound.grapheme}</span>?
      </h2>
      <div className="text-8xl animate-pop-in" aria-hidden>
        {item.emoji}
      </div>
      <div
        className={needsTap ? "animate-pulse-ring rounded-blob" : undefined}
        onClickCapture={() => setNeedsTap(false)}
      >
        <WordSpeaker word={item.word} label="Jeszcze raz" size="lg" />
      </div>
      {needsTap && (
        <p className="text-sm font-bold text-hero-gold">Stuknij 🔊, żeby usłyszeć słowo</p>
      )}

      {answer === null ? (
        <div className="flex w-full max-w-md gap-3">
          <BigButton tone="yes" onClick={() => setAnswer(true)} full>
            TAK
          </BigButton>
          <BigButton tone="no" onClick={() => setAnswer(false)} full>
            NIE
          </BigButton>
        </div>
      ) : (
        <div className="animate-pop-in flex flex-col items-center gap-1">
          <p className="text-3xl font-black">{correct ? "🎉 Tak jest!" : "🙂 Posłuchaj jeszcze raz"}</p>
          <p className="text-xl font-bold text-hero-cyan">
            <span className="font-reading">{item.word}</span> — {item.pl}
          </p>
          <p className="text-sm text-paper/70">
            {item.hasTarget
              ? `W tym słowie JEST „${sound.grapheme}”.`
              : `W tym słowie NIE MA „${sound.grapheme}”.`}
          </p>
        </div>
      )}

      {mode === "parent" && answer === null && (
        <p className="text-xs text-paper/50">
          Poproś dziecko, żeby powtórzyło słowo na głos, zanim odpowie.
        </p>
      )}
    </Card>
  );
}

// --- Ćwiczenie 2: sklejanie dźwięków (Fred Talk) ---------------------------

function BlendScreen({
  card,
  sound,
  mode,
  onDone,
}: {
  card: WordCard;
  sound: Sound;
  mode: SessionMode;
  onDone: (attempt: PendingAttempt) => void;
}) {
  const [tapped, setTapped] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [missingClip, setMissingClip] = useState(false);
  const startRef = useRef(Date.now());

  const allTapped = tapped.length === card.graphemes.length;

  function report(correct: boolean | null) {
    onDone({
      ts: Date.now(),
      soundId: sound.id,
      exercise: "blend",
      item: card.word,
      correct,
      responseMs: Date.now() - startRef.current,
    });
  }

  return (
    <Card className="no-select flex flex-col items-center gap-5 text-center">
      <h2 className="text-2xl font-bold">Sklej dźwięki w słowo</h2>

      <div className="flex flex-wrap justify-center gap-3">
        {card.graphemes.map((grapheme, position) => {
          const isTarget = position === card.targetIndex;
          const isTapped = tapped.includes(position);
          return (
            <button
              key={`${grapheme}-${position}`}
              type="button"
              onClick={async () => {
                setTapped((previous) =>
                  previous.includes(position) ? previous : [...previous, position],
                );
                const result = await playPhonemeStrict(grapheme);
                if (result.source === "unavailable") setMissingClip(true);
              }}
              className={`font-reading min-w-20 rounded-2xl px-5 py-4 text-4xl font-black transition active:translate-y-1 ${
                isTarget
                  ? "bg-hero-gold text-night shadow-[0_6px_0_#c99a1f]"
                  : "bg-white/15 text-paper shadow-[0_6px_0_rgba(0,0,0,0.3)]"
              } ${isTapped ? "opacity-60" : ""}`}
            >
              {grapheme}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-paper/50">
        Żółty kawałek to „special friends” — dwie litery, jeden dźwięk.
      </p>
      {missingClip && (
        <p className="max-w-md text-xs text-hero-gold/80">
          🎤 Brak nagrania tej głoski — wypowiada ją rodzic. Syntezator mowy przeczytałby
          nazwę litery zamiast dźwięku, więc celowo milczy.
        </p>
      )}

      {!revealed ? (
        <BigButton
          onClick={() => {
            setRevealed(true);
            void playWord(card.word);
          }}
          disabled={!allTapped}
        >
          {allTapped ? "Przeczytaj całe słowo!" : "Stuknij każdy kawałek"}
        </BigButton>
      ) : (
        <div className="animate-pop-in flex flex-col items-center gap-3">
          <div className="text-7xl" aria-hidden>
            {card.emoji}
          </div>
          <p className="font-reading text-4xl font-black">{card.word}</p>
          <p className="text-lg text-hero-cyan">{card.pl}</p>
          <WordSpeaker word={card.word} label="Posłuchaj" />

          {mode === "parent" ? (
            <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <BigButton tone="yes" onClick={() => report(true)} full>
                Przeczytał sam
              </BigButton>
              <BigButton tone="no" onClick={() => report(false)} full>
                Z pomocą
              </BigButton>
            </div>
          ) : (
            <BigButton onClick={() => report(null)}>Dalej</BigButton>
          )}
        </div>
      )}

      {mode === "parent" && (
        <p className="text-xs text-paper/50">
          To Ty oceniasz czytanie na głos — aplikacja nie słucha dziecka.
        </p>
      )}
    </Card>
  );
}

// --- Ćwiczenie 3: które słowo słyszysz -------------------------------------

function ChoiceScreen({
  round,
  sound,
  mode,
  onDone,
}: {
  round: ChoiceRound;
  sound: Sound;
  mode: SessionMode;
  onDone: (attempt: PendingAttempt) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const startRef = useRef(Date.now());

  const options = useMemo(() => round.options, [round]);

  useEffect(() => {
    void playWord(round.answer).then((result) =>
      setNeedsTap(result.source === "unavailable"),
    );
  }, [round.answer]);

  useEffect(() => {
    if (picked === null) return;
    const correct = picked === round.answer;
    playFeedbackTone(correct ? "good" : "try-again");
    // Po błędzie: słowo jeszcze raz, przy podświetlonej poprawnej odpowiedzi —
    // dziecko łączy dźwięk z właściwym zapisem, a nie tylko widzi "źle".
    if (!correct) void playWord(round.answer);

    const timer = setTimeout(
      () =>
        onDone({
          ts: Date.now(),
          soundId: sound.id,
          exercise: "choice",
          item: round.answer,
          correct,
          responseMs: Date.now() - startRef.current,
        }),
      correct ? 1100 : 3200,
    );
    return () => clearTimeout(timer);
  }, [picked, round, sound.id, onDone]);

  return (
    <Card className="no-select flex flex-col items-center gap-5 text-center">
      <h2 className="text-2xl font-bold">Które słowo słyszysz?</h2>
      <div
        className={needsTap ? "animate-pulse-ring rounded-blob" : undefined}
        onClickCapture={() => setNeedsTap(false)}
      >
        <WordSpeaker word={round.answer} label="Posłuchaj" size="lg" />
      </div>
      {needsTap && (
        <p className="text-sm font-bold text-hero-gold">Stuknij 🔊, żeby usłyszeć słowo</p>
      )}

      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const isAnswer = option === round.answer;
          const state =
            picked === null
              ? "idle"
              : isAnswer
                ? "correct"
                : option === picked
                  ? "wrong"
                  : "dim";
          return (
            <button
              key={option}
              type="button"
              disabled={picked !== null}
              onClick={() => setPicked(option)}
              className={`font-reading rounded-blob px-4 py-6 text-3xl font-black transition active:translate-y-1 ${
                state === "idle"
                  ? "bg-white/15 text-paper shadow-[0_6px_0_rgba(0,0,0,0.3)]"
                  : state === "correct"
                    ? "bg-hero-lime text-night"
                    : state === "wrong"
                      ? "bg-hero-pink text-night"
                      : "bg-white/5 text-paper/40"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="animate-pop-in flex flex-col items-center gap-1">
          <div className="text-6xl" aria-hidden>
            {round.emoji}
          </div>
          <p className="text-xl font-bold text-hero-cyan">
            <span className="font-reading">{round.answer}</span> — {round.pl}
          </p>
        </div>
      )}

      {mode === "parent" && picked === null && (
        <p className="text-xs text-paper/50">
          Jeśli dziecko się waha, przeczytajcie opcje razem, głoska po głosce.
        </p>
      )}
    </Card>
  );
}

// --- Podsumowanie i nagroda -------------------------------------------------

function RewardScreen({
  sound,
  lesson,
  outcome,
  onAgain,
}: {
  sound: Sound;
  lesson: Lesson;
  outcome: SessionOutcome;
  onAgain: () => void;
}) {
  const hero = getHero(lesson.heroId);
  const accuracy = outcome.accuracy;
  // Zawsze co najmniej jedna gwiazdka — brief: bez kar za błędy.
  const stars = accuracy === null ? 2 : accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h1 className="text-3xl font-black">Misja zakończona!</h1>

      <HeroAvatar hero={hero} emblem={sound.grapheme} size={170} cheering />

      <div className="text-5xl" aria-label={`${stars} z 3 gwiazdek`}>
        {"⭐".repeat(stars)}
        <span className="opacity-25">{"⭐".repeat(3 - stars)}</span>
      </div>

      <Card className="w-full max-w-md">
        <p className="text-xl font-bold">
          Dźwięk <span className="font-reading text-hero-gold">{sound.grapheme}</span>
        </p>
        <p className="text-paper/80">
          {outcome.session.scored > 0
            ? `Dobrze: ${outcome.session.correct} z ${outcome.session.scored}`
            : "Sesja ćwiczeń mówionych — bez punktacji"}
        </p>
      </Card>

      {outcome.newHeroes.length > 0 && (
        <Card className="w-full max-w-md border-hero-gold/50 bg-hero-gold/10">
          <p className="mb-3 text-lg font-bold text-hero-gold">Nowa postać w drużynie!</p>
          <div className="flex flex-col items-center gap-2">
            {outcome.newHeroes.map((heroId) => {
              const unlocked = HEROES_BY_ID[heroId];
              if (!unlocked) return null;
              return (
                <div key={heroId} className="flex items-center gap-3 text-left">
                  <HeroAvatar hero={unlocked} size={70} />
                  <div>
                    <p className="font-bold">{unlocked.codename}</p>
                    <p className="text-sm text-paper/70">{unlocked.power}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {lesson.redWords.length > 0 && (
        <Card className="w-full max-w-md">
          <p className="mb-2 font-bold text-hero-pink">Red words na dziś</p>
          <p className="text-sm text-paper/70">
            Tych słów nie da się skleić z dźwięków — czyta się je w całości.
          </p>
          <div className="mt-3 flex justify-center gap-3">
            {lesson.redWords.map((word) => (
              <WordSpeaker key={word} word={word} label={word} reading />
            ))}
          </div>
        </Card>
      )}

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
