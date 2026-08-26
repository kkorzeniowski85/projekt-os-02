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
import { Celebration } from "@/components/Celebration";
import { InterruptDialog } from "@/components/session/InterruptDialog";
import { HeroAvatar } from "@/components/HeroAvatar";
import { BigButton, Card, ParentTip, PhonemeSpeaker, PhraseSpeaker, StepDots, WordSpeaker } from "@/components/ui";
import {
  chantAvailable,
  playChantWithBeat,
  playFeedbackTone,
  playPhonemeStrict,
  playPhrase,
  playStarDing,
  playVictoryFanfare,
  playWord,
  primeSpeech,
  stopVictoryFanfare,
  unlockAudio,
} from "@/lib/audio";
import {
  allRedWords,
  chipSoundId,
  type ChoiceRound,
  type Lesson,
  type ListenItem,
  type WordCard,
} from "@/lib/curriculum/lessons";
import { getSentences, type LessonSentence } from "@/lib/curriculum/sentences";
import type { Sound } from "@/lib/curriculum/sounds";
import { getHero, HEROES_BY_ID } from "@/lib/heroes";
import { useProgress, type PendingAttempt, type SessionOutcome } from "@/lib/progress/store";
import type { DeviceRole, SessionMode } from "@/lib/progress/types";
import { useDeviceRole } from "@/lib/useDeviceRole";

type Screen =
  | { kind: "listen"; item: ListenItem }
  | { kind: "blend"; card: WordCard }
  | { kind: "redword"; answer: string; options: string[] }
  | { kind: "choice"; round: ChoiceRound }
  | { kind: "sentence"; sentence: LessonSentence };

/**
 * Czy ZAPIS słowa zawiera grafem lekcji. Służy do nazywania pułapek w
 * ćwiczeniu słuchania: słowo z literą, której nie słychać („blue" przy „u"),
 * i słowo z dźwiękiem pisanym inaczej („phone" przy „f"). Split digraphy
 * (a-e) pomijamy — ich zapis nie jest ciągły, porównanie nie ma sensu.
 */
function literaWZapisie(word: string, grapheme: string): boolean {
  if (grapheme.includes("-")) return false;
  return word.toLowerCase().includes(grapheme.toLowerCase());
}

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

  // Red words: rozpoznawanie całościowe. Dystraktory to INNE red words —
  // wszystkie czyta się z pamięci, więc wybór sprawdza pamięć wzrokową,
  // a nie technikę sklejania (którą red word właśnie łamie).
  const redPool = allRedWords();
  const redwords = shuffled(lesson.redWords)
    .slice(0, short ? 1 : 2)
    .map<Screen>((word) => ({
      kind: "redword",
      answer: word,
      options: shuffled([
        word,
        ...shuffled(redPool.filter((other) => other !== word)).slice(0, 2),
      ]),
    }));

  // Mini-czytanka na sam koniec: zdanie z już poznanych dźwięków — słowo
  // osadzone w zdaniu zapada głębiej niż słowo na fiszce, a RWI kończy
  // lekcję dokładnie tak samo (ditty). Audyt pilnuje, żeby zdanie nigdy
  // nie wyprzedzało sekwencji.
  const sentences = shuffled(getSentences(lesson.soundId))
    .slice(0, 1)
    .map<Screen>((sentence) => ({ kind: "sentence", sentence }));

  return [
    ...listen.map<Screen>((item) => ({ kind: "listen", item })),
    ...blend.map<Screen>((card) => ({ kind: "blend", card })),
    ...redwords,
    ...choice.map<Screen>((round) => ({ kind: "choice", round })),
    ...sentences,
  ];
}

export function SessionRunner({ sound, lesson }: { sound: Sound; lesson: Lesson }) {
  const { role } = useDeviceRole();
  const { commitSession } = useProgress();
  const hero = getHero(lesson.heroId);

  const [stage, setStage] = useState<"intro" | "running" | "done">("intro");
  const [mode, setMode] = useState<SessionMode>("parent");
  const [screens, setScreens] = useState<Screen[]>([]);
  /**
   * Dwa liczniki zamiast jednego, bo sesję można teraz PRZEGLĄDAĆ wstecz:
   * `frontier` to pierwszy nieukończony ekran (tylko on jest "na żywo"),
   * `index` to ekran właśnie oglądany (0..frontier). Wszystko przed frontier
   * renderuje się jako powtórka — do posłuchania, bez ponownego punktowania.
   */
  const [frontier, setFrontier] = useState(0);
  const [index, setIndex] = useState(0);
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [pytanieOWyjscie, setPytanieOWyjscie] = useState(false);

  /**
   * Wynik per ekran, zapisywany przy PIERWSZEJ odpowiedzi (nie przy przejściu
   * dalej). Dzięki temu naprawa błędu i cofanie się nie mają wpływu na ocenę:
   * pierwszy wybór jest ostateczny, a mapa nie przyjmie drugiego wpisu.
   */
  const attemptsByIndexRef = useRef(new Map<number, PendingAttempt>());
  const frontierRef = useRef(0);
  const startedTsRef = useRef(0);
  /** Indeks pierwszego ekranu rundy bonusowej; null = bonus jeszcze nie ruszyl. */
  const bonusStartRef = useRef<number | null>(null);

  useEffect(() => primeSpeech(), []);

  const start = useCallback(
    (chosenMode: SessionMode) => {
      // Kliknięcie startu to gest użytkownika — jedyny moment, w którym iOS
      // pozwala "odblokować" audio na resztę sesji.
      unlockAudio();
      setMode(chosenMode);
      setScreens(buildScreens(lesson, role));
      attemptsByIndexRef.current = new Map();
      frontierRef.current = 0;
      bonusStartRef.current = null;
      startedTsRef.current = Date.now();
      setFrontier(0);
      setIndex(0);
      setOutcome(null);
      setStage("running");
    },
    [lesson, role],
  );

  const zebraneProby = useCallback(
    () =>
      [...attemptsByIndexRef.current.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, attempt]) => attempt),
    [],
  );

  const zapisz = useCallback(
    () =>
      commitSession({
        soundId: sound.id,
        mode,
        device: role,
        startedTs: startedTsRef.current,
        endedTs: Date.now(),
        attempts: zebraneProby(),
      }),
    [commitSession, mode, role, sound.id, zebraneProby],
  );

  const finish = useCallback(() => {
    setOutcome(zapisz());
    setStage("done");
  }, [zapisz]);

  /** Ocena ekranu — wołane przy pierwszym wyborze; kolejne wpisy się nie liczą. */
  const onAnswer = useCallback((attempt: PendingAttempt) => {
    // Runda bonusowa nie zapisuje prób — patrz komentarz przy jej starcie.
    if (bonusStartRef.current !== null && frontierRef.current >= bonusStartRef.current) return;
    const map = attemptsByIndexRef.current;
    if (!map.has(frontierRef.current)) map.set(frontierRef.current, attempt);
  }, []);

  /** Ekran ukończony (dobra odpowiedź albo naprawiony błąd) — idziemy dalej. */
  const onNext = useCallback(() => {
    const nastepny = frontierRef.current + 1;
    frontierRef.current = nastepny;
    setFrontier(nastepny);
    setIndex(nastepny);
  }, []);

  // Ostatni ekran przerobiony → runda bonusowa albo koniec.
  //
  // RUNDA BONUSOWA (efekt testowania): pozycje, które w tej sesji poszły źle,
  // wracają na końcu jeszcze raz — drugie aktywne przypomnienie tuż po nauce
  // to jedna z najlepiej udokumentowanych dźwigni zapamiętywania. Bez
  // punktacji: wynik zapadł przy pierwszym podejściu, a bonus jest po to,
  // żeby ostatni kontakt z trudnym materiałem był udany, nie po to, by
  // poprawiać statystyki.
  useEffect(() => {
    if (stage !== "running" || screens.length === 0 || frontier < screens.length) return;

    if (bonusStartRef.current === null) {
      const nieudane = [...attemptsByIndexRef.current.entries()]
        .filter(([, attempt]) => attempt.correct === false)
        .slice(0, 3)
        .map(([i]) => screens[i])
        .filter(Boolean);
      if (nieudane.length > 0) {
        bonusStartRef.current = screens.length;
        setScreens((previous) => [...previous, ...nieudane]);
        return; // frontier zostaje — sesja biegnie dalej po dodanych ekranach
      }
    }
    finish();
  }, [stage, frontier, screens, finish]);

  const screen = screens[index];
  const powtorka = index < frontier;

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
      {pytanieOWyjscie && (
        <InterruptDialog
          zrobione={frontier}
          wszystkich={screens.length}
          ocenianych={
            [...attemptsByIndexRef.current.values()].filter(
              (attempt) => attempt.correct !== null,
            ).length
          }
          onZapisz={zapisz}
          onWroc={() => setPytanieOWyjscie(false)}
        />
      )}

      <div className="flex flex-col gap-4">
        <header className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setPytanieOWyjscie(true)}
            className="text-sm text-paper/60 underline"
          >
            ← Przerwij
          </button>
          <StepDots total={screens.length} current={index} />
          <div className="flex items-center gap-2">
            {/* Cofanie po ukończonych ekranach — powtórka, nie druga próba. */}
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex((previous) => Math.max(0, previous - 1))}
                aria-label="Poprzedni ekran"
                title="Wróć do poprzedniego ekranu"
                className="flex min-h-9 min-w-9 items-center justify-center rounded-full bg-white/10 text-lg"
              >
                ↩
              </button>
            )}
            <span className="font-reading rounded-full bg-white/10 px-3 py-1 text-sm font-bold">
              {sound.grapheme}
            </span>
          </div>
        </header>

        {bonusStartRef.current !== null && index >= bonusStartRef.current && (
          <p className="rounded-2xl border border-hero-gold/40 bg-hero-gold/10 p-3 text-center text-sm font-bold text-hero-gold">
            ⭐ Runda bonusowa — złap te, które uciekły! (bez punktów, sama chwała)
          </p>
        )}

        {powtorka && screen && (
          <PowtorkaEkranu
            key={`powtorka-${index}`}
            screen={screen}
            sound={sound}
            attempt={attemptsByIndexRef.current.get(index)}
            onDalej={() => setIndex((previous) => previous + 1)}
          />
        )}

        {!powtorka && screen?.kind === "listen" && (
          <ListenScreen
            key={`listen-${index}`}
            item={screen.item}
            sound={sound}
            mode={mode}
            onAnswer={onAnswer}
            onNext={onNext}
          />
        )}
        {!powtorka && screen?.kind === "blend" && (
          <BlendScreen
            key={`blend-${index}`}
            card={screen.card}
            sound={sound}
            mode={mode}
            onAnswer={onAnswer}
            onNext={onNext}
          />
        )}
        {!powtorka && screen?.kind === "redword" && (
          <RedWordScreen
            key={`redword-${index}`}
            answer={screen.answer}
            options={screen.options}
            sound={sound}
            mode={mode}
            onAnswer={onAnswer}
            onNext={onNext}
          />
        )}
        {!powtorka && screen?.kind === "sentence" && (
          <SentenceScreen
            key={`sentence-${index}`}
            sentence={screen.sentence}
            sound={sound}
            mode={mode}
            onAnswer={onAnswer}
            onNext={onNext}
          />
        )}
        {!powtorka && screen?.kind === "choice" && (
          <ChoiceScreen
            key={`choice-${index}`}
            round={screen.round}
            sound={sound}
            mode={mode}
            onAnswer={onAnswer}
            onNext={onNext}
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
  const [chantMozliwy, setChantMozliwy] = useState(false);
  const [chantGra, setChantGra] = useState(false);

  // Chant z bitem wymaga nagrania czystej głoski — bez niego przycisk się
  // nie pokazuje (syntezator przeczytałby nazwę litery).
  useEffect(() => {
    let aktywny = true;
    void chantAvailable(sound.id).then((jest) => aktywny && setChantMozliwy(jest));
    return () => {
      aktywny = false;
    };
  }, [sound.id]);

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

      {/* Rytmiczne skandowanie wspiera pamięć i wymowę u dzieci w tym wieku
          lepiej niż zwykłe powtarzanie — a dziecko może klaskać albo tupać. */}
      {chantMozliwy && (
        <button
          type="button"
          disabled={chantGra}
          onClick={() => {
            unlockAudio();
            setChantGra(true);
            void playChantWithBeat(sound.id).finally(() => setChantGra(false));
          }}
          className="flex items-center gap-2 rounded-blob bg-hero-cyan/20 px-5 py-3 text-lg font-bold text-hero-cyan transition active:translate-y-1 disabled:opacity-50"
        >
          🥁 {chantGra ? "Gra… klaszcz do rytmu!" : "Chant z bitem"}
        </button>
      )}

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
  onAnswer,
  onNext,
}: {
  item: ListenItem;
  sound: Sound;
  mode: SessionMode;
  onAnswer: (attempt: PendingAttempt) => void;
  onNext: () => void;
}) {
  const [answer, setAnswer] = useState<boolean | null>(null);
  /** Po błędzie dziecko musi samo stuknąć dobrą odpowiedź — patrz useEffect niżej. */
  const [naprawione, setNaprawione] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const startRef = useRef(Date.now());

  const correct = answer !== null && answer === item.hasTarget;
  // Słowo-pułapka (litera jest, dźwięku nie ma — albo odwrotnie) dostaje po
  // odpowiedzi wyjaśnienie; przy poprawnej odpowiedzi ekran musi postać
  // dłużej, bo 1 sekunda nie starcza nawet na zerknięcie na nie.
  const maPulapke =
    item.hasTarget !== literaWZapisie(item.word, sound.grapheme);

  useEffect(() => {
    // Gdy przeglądarka zablokuje automatyczne odtworzenie (iOS bez wcześniejszego
    // gestu), pokazujemy dziecku, że ma stuknąć w głośnik.
    void playWord(item.word).then((result) => setNeedsTap(result.source === "unavailable"));
  }, [item.word]);

  useEffect(() => {
    if (answer === null) return;
    playFeedbackTone(correct ? "good" : "try-again");
    if (correct) {
      const timer = setTimeout(onNext, maPulapke ? 2800 : 1100);
      return () => clearTimeout(timer);
    }
    // Po błędzie NIE idziemy dalej sami: słowo gra jeszcze raz, wyjaśnienie
    // zostaje na ekranie, a przejście wymaga stuknięcia poprawnej odpowiedzi.
    // Ostatni ruch dziecka ma być tym właściwym (jak w RWI: pokaz → powtórka),
    // a bierna pauza tego nie gwarantowała — dało się ją po prostu przeczekać.
    void playWord(item.word);
  }, [answer, correct, maPulapke, item.word, onNext]);

  useEffect(() => {
    if (!naprawione) return;
    playFeedbackTone("good");
    const timer = setTimeout(onNext, 900);
    return () => clearTimeout(timer);
  }, [naprawione, onNext]);

  function pick(choice: boolean) {
    setAnswer(choice);
    onAnswer({
      ts: Date.now(),
      soundId: sound.id,
      exercise: "listen",
      item: item.word,
      correct: choice === item.hasTarget,
      responseMs: Date.now() - startRef.current,
    });
  }

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
          <BigButton tone="yes" onClick={() => pick(true)} full>
            TAK
          </BigButton>
          <BigButton tone="no" onClick={() => pick(false)} full>
            NIE
          </BigButton>
        </div>
      ) : (
        <div className="animate-pop-in flex flex-col items-center gap-2">
          <p className="text-3xl font-black">
            {correct || naprawione ? "🎉 Tak jest!" : "🙂 Posłuchaj jeszcze raz"}
          </p>
          <p className="text-xl font-bold text-hero-cyan">
            <span className="font-reading">{item.word}</span> — {item.pl}
          </p>
          <p className="text-sm text-paper/70">
            {item.hasTarget
              ? `W tym słowie SŁYCHAĆ „${sound.grapheme}”.`
              : `W tym słowie NIE SŁYCHAĆ „${sound.grapheme}”.`}
          </p>
          {/* Sedno ćwiczenia wypowiedziane wprost — bez tego słowo-pułapka
              („blue" przy „u") wygląda na błąd aplikacji, a nie na lekcję
              najważniejszej prawdy angielskiego: litera to nie dźwięk. */}
          {!item.hasTarget && literaWZapisie(item.word, sound.grapheme) && (
            <p className="max-w-md rounded-2xl bg-hero-gold/10 p-3 text-xs text-hero-gold">
              ⚠️ Pułapka! W zapisie litera „{sound.grapheme}” JEST, ale czyta się tu
              inaczej — dlatego jej nie słychać. W tym ćwiczeniu liczy się UCHO, nie
              literki.
            </p>
          )}
          {item.hasTarget && !literaWZapisie(item.word, sound.grapheme) && (
            <p className="max-w-md rounded-2xl bg-hero-cyan/10 p-3 text-xs text-hero-cyan">
              🕵️ Ciekawostka: dźwięk „{sound.grapheme}” słychać, choć pisze się go tu
              inaczej. Ucho miało rację!
            </p>
          )}
          {!correct && !naprawione && (
            <div className="mt-2 flex w-full max-w-md flex-col items-center gap-2">
              <div className="animate-pulse-ring rounded-blob">
                <BigButton tone="yes" onClick={() => setNaprawione(true)} full>
                  {item.hasTarget ? "TAK — słychać!" : "NIE — nie słychać"}
                </BigButton>
              </div>
              <p className="text-xs text-paper/60">
                Stuknij dobrą odpowiedź, żeby iść dalej.
              </p>
            </div>
          )}
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
  onAnswer,
  onNext,
}: {
  card: WordCard;
  sound: Sound;
  mode: SessionMode;
  onAnswer: (attempt: PendingAttempt) => void;
  onNext: () => void;
}) {
  const [tapped, setTapped] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [missingClip, setMissingClip] = useState(false);
  const startRef = useRef(Date.now());

  const allTapped = tapped.length === card.graphemes.length;

  // Czytanie na głos ocenia rodzic, więc bramki naprawy tu nie ma — korekta
  // dzieje się w rozmowie, nie na ekranie.
  function report(correct: boolean | null) {
    onAnswer({
      ts: Date.now(),
      soundId: sound.id,
      exercise: "blend",
      item: card.word,
      correct,
      responseMs: Date.now() - startRef.current,
    });
    onNext();
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
                // chipSoundId: kafelek "oo" gra wariant tej lekcji (zoo vs look).
                const result = await playPhonemeStrict(chipSoundId(grapheme, sound.id));
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
  onAnswer,
  onNext,
}: {
  round: ChoiceRound;
  sound: Sound;
  mode: SessionMode;
  onAnswer: (attempt: PendingAttempt) => void;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [naprawione, setNaprawione] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const startRef = useRef(Date.now());

  const options = useMemo(() => round.options, [round]);
  const correct = picked !== null && picked === round.answer;
  const wNaprawie = picked !== null && !correct && !naprawione;

  useEffect(() => {
    void playWord(round.answer).then((result) =>
      setNeedsTap(result.source === "unavailable"),
    );
  }, [round.answer]);

  useEffect(() => {
    if (picked === null) return;
    playFeedbackTone(correct ? "good" : "try-again");
    if (correct) {
      const timer = setTimeout(onNext, 1100);
      return () => clearTimeout(timer);
    }
    // Po błędzie: słowo gra jeszcze raz przy podświetlonym poprawnym zapisie,
    // a dalej idzie się dopiero PO STUKNIĘCIU tego zapisu. Dziecko ma wykonać
    // poprawny ruch, nie obejrzeć go — bierne 3 sekundy dało się przeczekać
    // bez patrzenia na ekran.
    void playWord(round.answer);
  }, [picked, correct, round.answer, onNext]);

  useEffect(() => {
    if (!naprawione) return;
    playFeedbackTone("good");
    const timer = setTimeout(onNext, 900);
    return () => clearTimeout(timer);
  }, [naprawione, onNext]);

  function pick(option: string) {
    setPicked(option);
    onAnswer({
      ts: Date.now(),
      soundId: sound.id,
      exercise: "choice",
      item: round.answer,
      correct: option === round.answer,
      responseMs: Date.now() - startRef.current,
    });
  }

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
              // W naprawie klikalna jest wyłącznie poprawna odpowiedź.
              disabled={picked !== null && !(wNaprawie && isAnswer)}
              onClick={() => (wNaprawie ? setNaprawione(true) : pick(option))}
              className={`font-reading rounded-blob px-4 py-6 text-3xl font-black transition active:translate-y-1 ${
                state === "idle"
                  ? "bg-white/15 text-paper shadow-[0_6px_0_rgba(0,0,0,0.3)]"
                  : state === "correct"
                    ? `bg-hero-lime text-night ${wNaprawie ? "animate-pulse-ring" : ""}`
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

      {wNaprawie && (
        <p className="text-sm font-bold text-hero-gold">
          👆 Posłuchaj i stuknij dobre słowo, żeby iść dalej.
        </p>
      )}

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

  // Sekwencja zwycięstwa: gwiazdki wpadają jedna po drugiej z coraz wyższym
  // dzwoneczkiem, po ostatniej gra fanfara. Czasy zsynchronizowane z animacją
  // CSS gwiazdek (animationDelay niżej).
  const STAR_START = 400;
  const STAR_STEP = 420;
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < stars; i++) {
      timers.push(setTimeout(() => playStarDing(i), STAR_START + i * STAR_STEP));
    }
    timers.push(
      setTimeout(() => void playVictoryFanfare(), STAR_START + stars * STAR_STEP + 150),
    );
    // Wyjście z ekranu nagrody ucisza muzykę — hymn nie ma grać nad kolejną
    // sesją ani nad ekranem głównym.
    return () => {
      timers.forEach(clearTimeout);
      stopVictoryFanfare();
    };
  }, [stars]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <Celebration big={outcome.newHeroes.length > 0} />

      <h1 className="animate-pop-in text-3xl font-black">Misja zakończona!</h1>

      <div className="relative flex h-64 w-64 items-center justify-center">
        <svg
          viewBox="-100 -100 200 200"
          className="animate-spin-slow absolute inset-0 h-full w-full opacity-25"
          aria-hidden
        >
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * Math.PI) / 6;
            const x1 = (Math.cos(angle - 0.13) * 100).toFixed(1);
            const y1 = (Math.sin(angle - 0.13) * 100).toFixed(1);
            const x2 = (Math.cos(angle + 0.13) * 100).toFixed(1);
            const y2 = (Math.sin(angle + 0.13) * 100).toFixed(1);
            return <path key={i} d={`M0 0 L${x1} ${y1} L${x2} ${y2} Z`} fill="#ffc93c" />;
          })}
        </svg>
        <HeroAvatar hero={hero} emblem={sound.grapheme} size={170} cheering />
      </div>

      <div className="text-5xl" aria-label={`${stars} z 3 gwiazdek`}>
        {Array.from({ length: 3 }, (_, i) =>
          i < stars ? (
            <span
              key={i}
              className="animate-pop-in inline-block"
              style={{ animationDelay: `${STAR_START + i * STAR_STEP}ms` }}
            >
              ⭐
            </span>
          ) : (
            <span key={i} className="inline-block opacity-25">
              ⭐
            </span>
          ),
        )}
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
        <BigButton
          onClick={() => {
            stopVictoryFanfare();
            onAgain();
          }}
          full
        >
          Jeszcze raz
        </BigButton>
        <BigButton href="/" tone="quiet" full>
          Koniec
        </BigButton>
      </div>
      <button
        type="button"
        onClick={() => stopVictoryFanfare()}
        className="text-xs text-paper/40 underline"
      >
        wycisz muzykę
      </button>
    </div>
  );
}

// --- Powtórka ukończonego ekranu --------------------------------------------

/**
 * Widok ekranu, który już był — wejście strzałką ↩ w nagłówku sesji.
 *
 * To świadomie POWTÓRKA, a nie druga próba: wynik zapadł przy pierwszej
 * odpowiedzi i cofanie go nie zmienia (inaczej dałoby się wymazywać błędy,
 * a reguły adaptacji straciłyby dane, na których pracują). Za to wszystko,
 * co dźwiękowe, jest tu klikalne — po to się dziecko cofa: jeszcze raz
 * usłyszeć słowo albo postukać w literki.
 */
function PowtorkaEkranu({
  screen,
  sound,
  attempt,
  onDalej,
}: {
  screen: Screen;
  sound: Sound;
  attempt: PendingAttempt | undefined;
  onDalej: () => void;
}) {
  const wynik =
    attempt === undefined || attempt.correct === null
      ? null
      : attempt.correct
        ? ("dobrze" as const)
        : ("do-powtorki" as const);

  return (
    <Card className="no-select flex flex-col items-center gap-5 text-center">
      <div className="flex items-center gap-2 text-sm font-bold text-paper/60">
        <span className="rounded-full bg-white/10 px-3 py-1">↩ Powtórka — to już było</span>
        {wynik === "dobrze" && (
          <span className="rounded-full bg-hero-lime/20 px-3 py-1 text-hero-lime">✓ dobrze</span>
        )}
        {wynik === "do-powtorki" && (
          <span className="rounded-full bg-hero-gold/20 px-3 py-1 text-hero-gold">
            🙂 warto poćwiczyć
          </span>
        )}
      </div>

      {screen.kind === "listen" && (
        <>
          <div className="text-8xl" aria-hidden>
            {screen.item.emoji}
          </div>
          <p className="text-xl font-bold text-hero-cyan">
            <span className="font-reading">{screen.item.word}</span> — {screen.item.pl}
          </p>
          <WordSpeaker word={screen.item.word} label="Posłuchaj" size="lg" />
          <p className="text-sm text-paper/70">
            {screen.item.hasTarget
              ? `W tym słowie SŁYCHAĆ „${sound.grapheme}”.`
              : `W tym słowie NIE SŁYCHAĆ „${sound.grapheme}”.`}
          </p>
          {!screen.item.hasTarget && literaWZapisie(screen.item.word, sound.grapheme) && (
            <p className="max-w-md rounded-2xl bg-hero-gold/10 p-3 text-xs text-hero-gold">
              ⚠️ Pułapka: litera „{sound.grapheme}” w zapisie jest, ale czyta się inaczej.
            </p>
          )}
        </>
      )}

      {screen.kind === "blend" && (
        <>
          <div className="flex flex-wrap justify-center gap-3">
            {screen.card.graphemes.map((grapheme, position) => (
              <button
                key={`${grapheme}-${position}`}
                type="button"
                onClick={() => void playPhonemeStrict(chipSoundId(grapheme, sound.id))}
                className={`font-reading min-w-20 rounded-2xl px-5 py-4 text-4xl font-black transition active:translate-y-1 ${
                  position === screen.card.targetIndex
                    ? "bg-hero-gold text-night shadow-[0_6px_0_#c99a1f]"
                    : "bg-white/15 text-paper shadow-[0_6px_0_rgba(0,0,0,0.3)]"
                }`}
              >
                {grapheme}
              </button>
            ))}
          </div>
          <div className="text-6xl" aria-hidden>
            {screen.card.emoji}
          </div>
          <p className="text-xl font-bold text-hero-cyan">
            <span className="font-reading">{screen.card.word}</span> — {screen.card.pl}
          </p>
          <WordSpeaker word={screen.card.word} label="Całe słowo" />
        </>
      )}

      {screen.kind === "sentence" && (
        <>
          <p className="font-reading max-w-xl text-3xl font-black">{screen.sentence.en}</p>
          <p className="text-lg text-hero-cyan">{screen.sentence.pl}</p>
          <PhraseSpeaker text={screen.sentence.en} label="Posłuchaj" showText={false} />
        </>
      )}

      {screen.kind === "redword" && (
        <>
          <p className="font-reading text-4xl font-black text-hero-pink">{screen.answer}</p>
          <WordSpeaker word={screen.answer} label="Posłuchaj" size="lg" />
          <p className="text-sm text-paper/70">
            Red word — nie da się go skleić z dźwięków, czyta się w całości.
          </p>
        </>
      )}

      {screen.kind === "choice" && (
        <>
          <div className="text-7xl" aria-hidden>
            {screen.round.emoji}
          </div>
          <p className="font-reading text-4xl font-black">{screen.round.answer}</p>
          <p className="text-xl text-hero-cyan">{screen.round.pl}</p>
          <WordSpeaker word={screen.round.answer} label="Posłuchaj" size="lg" />
        </>
      )}

      <BigButton onClick={onDalej}>Dalej ▸</BigButton>
    </Card>
  );
}

// --- Ćwiczenie: red words (rozpoznawanie całościowe) -------------------------

/**
 * Red words czyta się w całości — sklejanie z dźwięków na nich zawodzi
 * (said ≠ s-a-i-d). Dotąd były tylko pokazywane na ekranie nagrody; teraz są
 * ćwiczone: dziecko słyszy słowo i wskazuje zapis wśród INNYCH red words.
 * Bramka naprawy działa jak wszędzie: błąd kończy się wykonaniem poprawnego
 * ruchu, a punktuje się pierwszy wybór.
 */
function RedWordScreen({
  answer,
  options,
  sound,
  mode,
  onAnswer,
  onNext,
}: {
  answer: string;
  options: string[];
  sound: Sound;
  mode: SessionMode;
  onAnswer: (attempt: PendingAttempt) => void;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [naprawione, setNaprawione] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const startRef = useRef(Date.now());

  const correct = picked !== null && picked === answer;
  const wNaprawie = picked !== null && !correct && !naprawione;

  useEffect(() => {
    void playWord(answer).then((result) => setNeedsTap(result.source === "unavailable"));
  }, [answer]);

  useEffect(() => {
    if (picked === null) return;
    playFeedbackTone(correct ? "good" : "try-again");
    if (correct) {
      const timer = setTimeout(onNext, 1100);
      return () => clearTimeout(timer);
    }
    void playWord(answer);
  }, [picked, correct, answer, onNext]);

  useEffect(() => {
    if (!naprawione) return;
    playFeedbackTone("good");
    const timer = setTimeout(onNext, 900);
    return () => clearTimeout(timer);
  }, [naprawione, onNext]);

  function pick(option: string) {
    setPicked(option);
    onAnswer({
      ts: Date.now(),
      soundId: sound.id,
      exercise: "redword",
      item: answer,
      correct: option === answer,
      responseMs: Date.now() - startRef.current,
    });
  }

  return (
    <Card className="no-select flex flex-col items-center gap-5 text-center">
      <h2 className="text-2xl font-bold">
        <span className="text-hero-pink">Słowo-łobuz!</span> Które słyszysz?
      </h2>
      <p className="max-w-md text-sm text-paper/70">
        Tego słowa nie da się skleić z dźwięków — czyta się je w całości, z pamięci.
      </p>
      <div
        className={needsTap ? "animate-pulse-ring rounded-blob" : undefined}
        onClickCapture={() => setNeedsTap(false)}
      >
        <WordSpeaker word={answer} label="Posłuchaj" size="lg" />
      </div>
      {needsTap && (
        <p className="text-sm font-bold text-hero-gold">Stuknij 🔊, żeby usłyszeć słowo</p>
      )}

      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const isAnswer = option === answer;
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
              disabled={picked !== null && !(wNaprawie && isAnswer)}
              onClick={() => (wNaprawie ? setNaprawione(true) : pick(option))}
              className={`font-reading rounded-blob px-4 py-6 text-3xl font-black transition active:translate-y-1 ${
                state === "idle"
                  ? "bg-white/15 text-paper shadow-[0_6px_0_rgba(0,0,0,0.3)]"
                  : state === "correct"
                    ? `bg-hero-lime text-night ${wNaprawie ? "animate-pulse-ring" : ""}`
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

      {wNaprawie && (
        <p className="text-sm font-bold text-hero-gold">
          👆 Posłuchaj i stuknij dobre słowo, żeby iść dalej.
        </p>
      )}

      {mode === "parent" && picked === null && (
        <p className="text-xs text-paper/50">
          Nie sklejajcie tego słowa z dźwięków — dziecko ma je poznać „z twarzy”, jak
          znajomego. Pomaga zdanie: „to jest słowo-łobuz, nie gra według zasad”.
        </p>
      )}
    </Card>
  );
}

// --- Mini-czytanka: przeczytaj zdanie ----------------------------------------

/**
 * Zwieńczenie lekcji: dziecko czyta CAŁE zdanie złożone wyłącznie z dźwięków,
 * które już zna, plus red words lekcji (te świecą na różowo — sygnał „nie
 * sklejaj, przeczytaj z pamięci”). Dokładnie tak kończy lekcję RWI.
 *
 * Kolejność jest nieprzypadkowa: najpierw dziecko czyta SAMO, dopiero potem
 * gra nagranie — odwrotnie ćwiczylibyśmy powtarzanie ze słuchu, nie czytanie.
 * Ocenia rodzic (jak przy sklejaniu); w trybie samodzielnym bez punktacji.
 */
function SentenceScreen({
  sentence,
  sound,
  mode,
  onAnswer,
  onNext,
}: {
  sentence: LessonSentence;
  sound: Sound;
  mode: SessionMode;
  onAnswer: (attempt: PendingAttempt) => void;
  onNext: () => void;
}) {
  const [odsluchane, setOdsluchane] = useState(false);
  const startRef = useRef(Date.now());
  const czerwone = useMemo(() => new Set(allRedWords().map((word) => word.toLowerCase())), []);

  function report(correct: boolean | null) {
    onAnswer({
      ts: Date.now(),
      soundId: sound.id,
      exercise: "sentence",
      item: sentence.en,
      correct,
      responseMs: Date.now() - startRef.current,
    });
    onNext();
  }

  const slowa = sentence.en.split(/\s+/);

  return (
    <Card className="no-select flex flex-col items-center gap-5 text-center">
      <h2 className="text-2xl font-bold">📖 Przeczytaj zdanie!</h2>

      <p className="font-reading flex max-w-2xl flex-wrap justify-center gap-x-3 gap-y-1 text-4xl font-black">
        {slowa.map((slowo, numer) => {
          const golo = slowo.toLowerCase().replace(/[^a-z]/g, "");
          const red = czerwone.has(golo);
          return (
            <span key={numer} className={red ? "text-hero-pink" : undefined}>
              {slowo}
            </span>
          );
        })}
      </p>
      <p className="text-xs text-paper/50">
        Różowe słowa to red words — nie sklejaj ich, przeczytaj w całości.
      </p>

      {!odsluchane ? (
        <BigButton
          onClick={() => {
            setOdsluchane(true);
            void playPhrase(sentence.en);
          }}
          tone="quiet"
        >
          Przeczytałem — sprawdź nagraniem 🔊
        </BigButton>
      ) : (
        <div className="animate-pop-in flex flex-col items-center gap-3">
          <p className="text-lg text-hero-cyan">{sentence.pl}</p>
          <PhraseSpeaker text={sentence.en} label="Jeszcze raz" showText={false} />

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

      {mode === "parent" && !odsluchane && (
        <p className="text-xs text-paper/50">
          Najpierw dziecko czyta samo (Fred Talk przy trudnym słowie), potem sprawdzacie
          nagraniem.
        </p>
      )}
    </Card>
  );
}
