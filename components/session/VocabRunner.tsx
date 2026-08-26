"use client";

/**
 * Silnik sesji toru 2 (słownictwo, zwroty, kolokacje).
 *
 * ZASADA NACZELNA: żadne pytanie nie wymaga czytania po angielsku. Pytaniem
 * jest zawsze nagranie albo polski tekst, a odpowiedzią obrazek, polski opis
 * albo krótkie słowo. Angielski zapis pokazujemy obok — dla dziecka, które już
 * czyta (tor 1) — ale nigdy jako warunek rozwiązania. Bez tego moduł byłby
 * drugim torem czytania, a nie torem słuchania.
 *
 * PIĘĆ ĆWICZEŃ, w kolejności od najłatwiejszego:
 *  1. `meet`        — poznanie słowa (obrazek + nagranie), bez oceny,
 *  2. `vocab`       — które słowo słyszysz (nagranie → obrazek),
 *  3. `phrase`      — kiedy to mówisz (nagranie zwrotu → sytuacja),
 *  4. `command`     — co robisz (nagranie polecenia → czynność),
 *  5. `collocation` — które słowo pasuje (znaczenie → brakujące słowo),
 *  6. `say`         — powiedz to na głos (ocenia rodzic albo nikt).
 *
 * Rozdział `phrase` / `command` jest sednem modułu: zwroty własne dziecko ma
 * umieć powiedzieć (stąd dodatkowo `say`), a polecenia nauczyciela wyłącznie
 * zrozumieć. Dlatego przy poleceniach nie ma ćwiczenia mówionego — uczenie
 * dziecka wypowiadania „Line up, please” byłoby uczeniem roli, której nie
 * będzie grało.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Celebration } from "@/components/Celebration";
import { HeroAvatar } from "@/components/HeroAvatar";
import { InterruptDialog } from "@/components/session/InterruptDialog";
import {
  BigButton,
  Card,
  ParentTip,
  PhraseSpeaker,
  StepDots,
  WordSpeaker,
} from "@/components/ui";
import {
  playFeedbackTone,
  playPhrase,
  playStarDing,
  playVictoryFanfare,
  playWord,
  primeSpeech,
  stopVictoryFanfare,
  unlockAudio,
} from "@/lib/audio";
import {
  TOPICS,
  type Collocation,
  type Command,
  type Phrase,
  type Topic,
  type VocabWord,
} from "@/lib/curriculum/vocab";
import { phraseNote, phraseScene, wordExample } from "@/lib/curriculum/vocabParent";
import { getHero } from "@/lib/heroes";
import { useProgress, type PendingAttempt, type SessionOutcome } from "@/lib/progress/store";
import type { DeviceRole, SessionMode, TopicStatus } from "@/lib/progress/types";
import { useDeviceRole } from "@/lib/useDeviceRole";

type Screen =
  | { kind: "meet"; word: VocabWord }
  | { kind: "vocab"; word: VocabWord; options: VocabWord[] }
  | { kind: "phrase"; phrase: Phrase; options: Phrase[] }
  | { kind: "command"; command: Command; options: Command[] }
  | { kind: "collocation"; collocation: Collocation; options: string[] }
  | { kind: "say"; phrase: Phrase }
  | { kind: "act"; command: Command };

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
 * Odpowiedź plus dystraktory. Dystraktory bierzemy najpierw z tego samego
 * tematu (są wtedy sensownie mylące), a gdy temat ma za mało pozycji —
 * dobieramy z pozostałych tematów. Bez tego dobierania temat z dwoma
 * poleceniami dawałby wybór z dwóch, czyli rzut monetą.
 *
 * Odrzucamy po kluczu, nie po tożsamości obiektu: to samo słowo występuje w
 * kilku tematach („water" jest w Ratunku i w Obiedzie), więc pula globalna ma
 * duplikaty — bez tego wybór potrafiłby dostać dwa identyczne przyciski.
 */
function withDistractors<T>(
  answer: T,
  own: readonly T[],
  global: readonly T[],
  total: number,
  key: (item: T) => string,
): T[] {
  const seen = new Set([key(answer)]);
  const picked: T[] = [];

  for (const pool of [shuffled(own), shuffled(global)]) {
    for (const item of pool) {
      if (picked.length >= total - 1) break;
      const itemKey = key(item);
      if (seen.has(itemKey)) continue;
      seen.add(itemKey);
      picked.push(item);
    }
  }

  return shuffled([answer, ...picked]);
}

const ALL_WORDS = TOPICS.flatMap((topic) => topic.words);
const ALL_PHRASES = TOPICS.flatMap((topic) => topic.phrases);
const ALL_COMMANDS = TOPICS.flatMap((topic) => topic.commands);

/**
 * Telefon dostaje krótszą sesję („szybka misja" z briefu) — te same ćwiczenia,
 * mniej powtórzeń. Materiał jest tasowany przy KAŻDYM starcie, więc druga sesja
 * z tego samego tematu przerabia inne słowa i inne zwroty; przy ośmiu słowach i
 * pięciu zwrotach temat wystarcza na kilka różnych sesji.
 */
function buildScreens(topic: Topic, role: DeviceRole, mode: SessionMode): Screen[] {
  const short = role === "phone";
  const ile = (pelne: number, krotkie: number) => (short ? krotkie : pelne);

  const words = shuffled(topic.words);
  const meet = words.slice(0, ile(3, 2));
  // Pytamy o inne słowa niż te dopiero co pokazane: sprawdzanie słowa
  // widzianego trzy ekrany wcześniej mierzy pamięć krótkotrwałą, nie naukę.
  const pytane = [...words.slice(meet.length), ...meet].slice(0, ile(3, 2));

  const screens: Screen[] = [
    ...meet.map<Screen>((word) => ({ kind: "meet", word })),
    ...pytane.map<Screen>((word) => ({
      kind: "vocab",
      word,
      options: withDistractors(word, topic.words, ALL_WORDS, 3, (item) => item.en),
    })),
    ...shuffled(topic.phrases)
      .slice(0, ile(3, 2))
      .map<Screen>((phrase) => ({
        kind: "phrase",
        phrase,
        options: withDistractors(phrase, topic.phrases, ALL_PHRASES, 3, (item) => item.en),
      })),
    ...shuffled(topic.commands)
      .slice(0, ile(3, 1))
      .map<Screen>((command) => ({
        kind: "command",
        command,
        options: withDistractors(command, topic.commands, ALL_COMMANDS, 3, (item) => item.en),
      })),
    ...shuffled(topic.collocations)
      .slice(0, ile(3, 1))
      .map<Screen>((collocation) => ({
        kind: "collocation",
        collocation,
        options: shuffled([collocation.answer, ...collocation.distractors]),
      })),
  ];

  // „Pokaż ruchem!”: dziecko WYKONUJE polecenie ciałem, rodzic potwierdza.
  // Badania na 8-latkach: ruch i gest wzmacniają pamięć słów na miesiące
  // (Andrä 2020; metaanaliza TPR). Tylko w trybie z rodzicem — w trybie
  // samodzielnym nie ma komu ocenić, a udawany przycisk uczyłby klikania.
  if (mode === "parent") {
    const doPokazania = shuffled(topic.commands).slice(0, ile(2, 1));
    screens.push(...doPokazania.map<Screen>((command) => ({ kind: "act", command })));
  }

  // Mówienie na koniec: dziecko powtarza zwrot, który przed chwilą słyszało
  // kilka razy, więc ma się od czego odbić.
  const doPowiedzenia = shuffled(topic.phrases).slice(0, ile(2, 1));
  screens.push(...doPowiedzenia.map<Screen>((phrase) => ({ kind: "say", phrase })));

  return screens;
}

export function VocabRunner({ topic }: { topic: Topic }) {
  const { role } = useDeviceRole();
  const { commitSession, state } = useProgress();
  const hero = getHero(topic.heroId);

  const [stage, setStage] = useState<"intro" | "running" | "done">("intro");
  const [mode, setMode] = useState<SessionMode>("parent");
  const [screens, setScreens] = useState<Screen[]>([]);
  /**
   * Jak w torze 1: `frontier` to pierwszy nieukończony ekran (jedyny „na
   * żywo"), `index` to ekran oglądany (0..frontier) — wszystko wcześniejsze
   * renderuje się jako powtórka, do posłuchania, bez ponownego punktowania.
   */
  const [frontier, setFrontier] = useState(0);
  const [index, setIndex] = useState(0);
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [pytanieOWyjscie, setPytanieOWyjscie] = useState(false);

  /** Wynik per ekran, zapisany przy PIERWSZEJ odpowiedzi — patrz tor 1. */
  const attemptsByIndexRef = useRef(new Map<number, PendingAttempt>());
  const frontierRef = useRef(0);
  const startedTsRef = useRef(0);
  /** Indeks pierwszego ekranu rundy bonusowej; null = bonus jeszcze nie ruszyl. */
  const bonusStartRef = useRef<number | null>(null);

  useEffect(() => primeSpeech(), []);

  const start = useCallback(
    (chosenMode: SessionMode) => {
      // Kliknięcie startu to gest użytkownika — jedyny moment, w którym iOS
      // pozwala „odblokować" audio na resztę sesji.
      unlockAudio();
      setMode(chosenMode);
      setScreens(buildScreens(topic, role, chosenMode));
      attemptsByIndexRef.current = new Map();
      frontierRef.current = 0;
      bonusStartRef.current = null;
      startedTsRef.current = Date.now();
      setFrontier(0);
      setIndex(0);
      setOutcome(null);
      setStage("running");
    },
    [topic, role],
  );

  const zapisz = useCallback(
    () =>
      commitSession({
        soundId: topic.id,
        track: "vocab",
        mode,
        device: role,
        startedTs: startedTsRef.current,
        endedTs: Date.now(),
        attempts: [...attemptsByIndexRef.current.entries()]
          .sort(([a], [b]) => a - b)
          .map(([, attempt]) => attempt),
      }),
    [commitSession, mode, role, topic.id],
  );

  const finish = useCallback(() => {
    setOutcome(zapisz());
    setStage("done");
  }, [zapisz]);

  /** Ocena ekranu — pierwszy wybór jest ostateczny, kolejne wpisy się nie liczą. */
  const onAnswer = useCallback((attempt: PendingAttempt) => {
    // Runda bonusowa nie zapisuje prób — patrz komentarz przy jej starcie.
    if (bonusStartRef.current !== null && frontierRef.current >= bonusStartRef.current) return;
    const map = attemptsByIndexRef.current;
    if (!map.has(frontierRef.current)) map.set(frontierRef.current, attempt);
  }, []);

  /** Ekran ukończony — dalej. Ekrany bez oceny (poznanie słowa) wołają tylko to. */
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
    return <IntroScreen topic={topic} onStart={start} role={role} />;
  }

  if (stage === "done" && outcome) {
    return (
      <RewardScreen
        topic={topic}
        outcome={outcome}
        status={state.topics[topic.id]?.status ?? "learning"}
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
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold">
              <span aria-hidden>{topic.emoji}</span> {topic.titlePl}
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
            attempt={attemptsByIndexRef.current.get(index)}
            mode={mode}
            onDalej={() => setIndex((previous) => previous + 1)}
          />
        )}

        {!powtorka && screen?.kind === "meet" && (
          <MeetScreen key={`meet-${index}`} word={screen.word} mode={mode} onNext={onNext} />
        )}
        {!powtorka && screen?.kind === "vocab" && (
          <VocabScreen
            key={`vocab-${index}`}
            word={screen.word}
            options={screen.options}
            topicId={topic.id}
            mode={mode}
            onAnswer={onAnswer}
            onNext={onNext}
          />
        )}
        {!powtorka && screen?.kind === "phrase" && (
          <PhraseScreen
            key={`phrase-${index}`}
            phrase={screen.phrase}
            options={screen.options}
            topicId={topic.id}
            mode={mode}
            onAnswer={onAnswer}
            onNext={onNext}
          />
        )}
        {!powtorka && screen?.kind === "command" && (
          <CommandScreen
            key={`command-${index}`}
            command={screen.command}
            options={screen.options}
            topicId={topic.id}
            onAnswer={onAnswer}
            onNext={onNext}
          />
        )}
        {!powtorka && screen?.kind === "collocation" && (
          <CollocationScreen
            key={`collocation-${index}`}
            collocation={screen.collocation}
            options={screen.options}
            topicId={topic.id}
            mode={mode}
            onAnswer={onAnswer}
            onNext={onNext}
          />
        )}
        {!powtorka && screen?.kind === "act" && (
          <ActScreen
            key={`act-${index}`}
            command={screen.command}
            topicId={topic.id}
            onAnswer={onAnswer}
            onNext={onNext}
          />
        )}
        {!powtorka && screen?.kind === "say" && (
          <SayScreen
            key={`say-${index}`}
            phrase={screen.phrase}
            topicId={topic.id}
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
              <HeroAvatar hero={hero} size={70} />
              <div>
                <p className="font-bold">{hero.codename}</p>
                <p className="text-xs text-paper/70">{topic.goalPl}</p>
              </div>
            </div>
          </Card>
          <ParentTip>
            <p>{topic.parentIntroPl}</p>
          </ParentTip>
          <Card className="text-sm text-paper/70">
            <p className="mb-1 font-bold text-paper">
              Tryb: {mode === "parent" ? "z rodzicem" : "samodzielny"}
            </p>
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
  topic,
  onStart,
  role,
}: {
  topic: Topic;
  onStart: (mode: SessionMode) => void;
  role: DeviceRole;
}) {
  const hero = getHero(topic.heroId);
  const phone = role === "phone";

  const parentTip = (
    <div className="w-full max-w-xl">
      <ParentTip>
        <p>{topic.parentIntroPl}</p>
      </ParentTip>
    </div>
  );

  return (
    <div className={`flex flex-col items-center text-center ${phone ? "gap-4" : "gap-6"}`}>
      <Link href="/slownictwo" className="self-start text-sm text-paper/60 underline">
        ← Wróć
      </Link>

      <div className="flex flex-col items-center gap-2">
        <HeroAvatar hero={hero} size={phone ? 120 : 170} />
        <p className="text-lg font-bold text-hero-cyan">{hero.codename}</p>
      </div>

      <div className="text-7xl" aria-hidden>
        {topic.emoji}
      </div>
      <h1 className="text-3xl font-black">{topic.titlePl}</h1>
      <p className="max-w-md text-lg text-hero-gold">{topic.goalPl}</p>

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
        W tym torze nic nie trzeba czytać — wystarczy słuchać i patrzeć na obrazki.
      </p>
      {phone && parentTip}
    </div>
  );
}

// --- Ćwiczenie 1: poznaj słowo ---------------------------------------------

function MeetScreen({
  word,
  mode,
  onNext,
}: {
  word: VocabWord;
  mode: SessionMode;
  onNext: () => void;
}) {
  useEffect(() => {
    void playWord(word.en);
  }, [word.en]);

  return (
    <Card className="no-select flex flex-col items-center gap-5 text-center">
      <h2 className="text-2xl font-bold">Nowe słowo</h2>
      <div className="animate-pop-in text-8xl" aria-hidden>
        {word.emoji}
      </div>
      <p className="font-reading text-4xl font-black">{word.en}</p>
      <p className="text-xl text-hero-cyan">{word.pl}</p>
      <WordSpeaker word={word.en} label="Jeszcze raz" size="lg" />
      {word.notePl && (
        <p className="max-w-md rounded-2xl bg-white/5 p-3 text-xs text-paper/60">
          {word.notePl}
        </p>
      )}
      {mode === "parent" && <ZdanieZeSlowem slowo={word.en} />}
      <BigButton onClick={onNext}>Dalej</BigButton>
    </Card>
  );
}

// --- Ćwiczenie 2: które słowo słyszysz -------------------------------------

function VocabScreen({
  word,
  options,
  topicId,
  mode,
  onAnswer,
  onNext,
}: {
  word: VocabWord;
  options: VocabWord[];
  topicId: string;
  mode: SessionMode;
  onAnswer: (attempt: PendingAttempt) => void;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [naprawione, setNaprawione] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const startRef = useRef(Date.now());

  const correct = picked !== null && picked === word.en;
  const wNaprawie = picked !== null && !correct && !naprawione;
  // W trybie z rodzicem pod odpowiedzią pojawia się zdanie przykładowe do
  // odsłuchania — automatyczne przejście zabierało na to szansę (sekunda to
  // za mało nawet na kliknięcie głośnika). Ekran czeka więc na „Dalej”.
  // W trybie samodzielnym pudełka nie ma, tempo zostaje.
  const czekaNaDalej = mode === "parent" && wordExample(word.en) !== null;
  const rozstrzygniete = correct || naprawione;

  useEffect(() => {
    void playWord(word.en).then((result) => setNeedsTap(result.source === "unavailable"));
  }, [word.en]);

  useEffect(() => {
    if (picked === null) return;
    playFeedbackTone(correct ? "good" : "try-again");
    if (correct) {
      if (czekaNaDalej) return;
      const timer = setTimeout(onNext, 1100);
      return () => clearTimeout(timer);
    }
    // Po błędzie dalej idzie się dopiero po stuknięciu dobrej odpowiedzi —
    // dziecko ma ją wykonać, nie przeczekać. Punktuje się pierwszy wybór.
    void playWord(word.en);
  }, [picked, correct, czekaNaDalej, word.en, onNext]);

  useEffect(() => {
    if (!naprawione) return;
    playFeedbackTone("good");
    if (czekaNaDalej) return;
    const timer = setTimeout(onNext, 900);
    return () => clearTimeout(timer);
  }, [naprawione, czekaNaDalej, onNext]);

  function pick(option: string) {
    setPicked(option);
    onAnswer({
      ts: Date.now(),
      soundId: topicId,
      exercise: "vocab",
      item: word.en,
      correct: option === word.en,
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
        <WordSpeaker word={word.en} label="Posłuchaj" size="lg" />
      </div>
      {needsTap && (
        <p className="text-sm font-bold text-hero-gold">Stuknij 🔊, żeby usłyszeć słowo</p>
      )}

      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const isAnswer = option.en === word.en;
          const state =
            picked === null ? "idle" : isAnswer ? "correct" : option.en === picked ? "wrong" : "dim";
          return (
            <button
              key={option.en}
              type="button"
              disabled={picked !== null && !(wNaprawie && isAnswer)}
              onClick={() => (wNaprawie ? setNaprawione(true) : pick(option.en))}
              className={`flex flex-col items-center gap-1 rounded-blob px-4 py-5 transition active:translate-y-1 ${
                state === "idle"
                  ? "bg-white/15 text-paper shadow-[0_6px_0_rgba(0,0,0,0.3)]"
                  : state === "correct"
                    ? `bg-hero-lime text-night ${wNaprawie ? "animate-pulse-ring" : ""}`
                    : state === "wrong"
                      ? "bg-hero-pink text-night"
                      : "bg-white/5 text-paper/40"
              }`}
            >
              <span className="text-5xl" aria-hidden>
                {option.emoji}
              </span>
              <span className="font-reading text-xl font-black">{option.en}</span>
            </button>
          );
        })}
      </div>

      {wNaprawie && (
        <p className="text-sm font-bold text-hero-gold">
          👆 Posłuchaj i stuknij dobry obrazek, żeby iść dalej.
        </p>
      )}

      {picked !== null && (
        <p className="animate-pop-in text-xl font-bold text-hero-cyan">
          <span className="font-reading">{word.en}</span> — {word.pl}
        </p>
      )}

      {mode === "parent" && picked !== null && <ZdanieZeSlowem slowo={word.en} />}

      {czekaNaDalej && rozstrzygniete && (
        <BigButton onClick={onNext}>Dalej ▸</BigButton>
      )}
    </Card>
  );
}

// --- Ćwiczenie 3: kiedy to mówisz ------------------------------------------

function PhraseScreen({
  phrase,
  options,
  topicId,
  mode,
  onAnswer,
  onNext,
}: {
  phrase: Phrase;
  options: Phrase[];
  topicId: string;
  mode: SessionMode;
  onAnswer: (attempt: PendingAttempt) => void;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [naprawione, setNaprawione] = useState(false);
  const startRef = useRef(Date.now());

  const correct = picked !== null && picked === phrase.en;
  const wNaprawie = picked !== null && !correct && !naprawione;

  useEffect(() => {
    void playPhrase(phrase.en);
  }, [phrase.en]);

  useEffect(() => {
    if (picked === null) return;
    playFeedbackTone(correct ? "good" : "try-again");
    if (correct) {
      const timer = setTimeout(onNext, 1200);
      return () => clearTimeout(timer);
    }
    void playPhrase(phrase.en);
  }, [picked, correct, phrase.en, onNext]);

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
      soundId: topicId,
      exercise: "phrase",
      item: phrase.en,
      correct: option === phrase.en,
      responseMs: Date.now() - startRef.current,
    });
  }

  return (
    <Card className="no-select flex flex-col items-center gap-5 text-center">
      <h2 className="text-2xl font-bold">Kiedy to mówisz?</h2>
      <PhraseSpeaker text={phrase.en} label="Posłuchaj" size="lg" showText={picked !== null} />

      <div className="grid w-full max-w-3xl gap-3">
        {options.map((option) => {
          const isAnswer = option.en === phrase.en;
          const state =
            picked === null ? "idle" : isAnswer ? "correct" : option.en === picked ? "wrong" : "dim";
          return (
            <button
              key={option.en}
              type="button"
              disabled={picked !== null && !(wNaprawie && isAnswer)}
              onClick={() => (wNaprawie ? setNaprawione(true) : pick(option.en))}
              className={`flex items-center gap-4 rounded-blob px-5 py-4 text-left transition active:translate-y-1 ${
                state === "idle"
                  ? "bg-white/15 text-paper shadow-[0_6px_0_rgba(0,0,0,0.3)]"
                  : state === "correct"
                    ? `bg-hero-lime text-night ${wNaprawie ? "animate-pulse-ring" : ""}`
                    : state === "wrong"
                      ? "bg-hero-pink text-night"
                      : "bg-white/5 text-paper/40"
              }`}
            >
              <span className="text-4xl" aria-hidden>
                {option.emoji}
              </span>
              <span className="text-lg font-bold">{option.situationPl}</span>
            </button>
          );
        })}
      </div>

      {wNaprawie && (
        <p className="text-sm font-bold text-hero-gold">
          👆 Posłuchaj i stuknij dobrą sytuację, żeby iść dalej.
        </p>
      )}

      {picked !== null && (
        <p className="animate-pop-in text-lg text-hero-cyan">
          <span className="font-reading font-bold">{phrase.en}</span> — {phrase.pl}
        </p>
      )}

      {/* Scenka pokazuje się, gdy przepływ i tak stoi (naprawa po błędzie) —
          po poprawnej odpowiedzi ekran za chwilę idzie dalej i nie byłoby
          czasu jej odegrać. Scenka jest też zawsze w powtórce (strzałka ↩)
          i na ekranie mówienia. */}
      {mode === "parent" && wNaprawie && <Scenka zwrot={phrase.en} />}

      {mode === "parent" && picked === null && (
        <p className="text-xs text-paper/50">
          Jeśli dziecko się waha, odtwórzcie zwrot jeszcze raz i przeczytajcie sytuacje na głos.
        </p>
      )}
    </Card>
  );
}

// --- Ćwiczenie 4: co robisz ------------------------------------------------

function CommandScreen({
  command,
  options,
  topicId,
  onAnswer,
  onNext,
}: {
  command: Command;
  options: Command[];
  topicId: string;
  onAnswer: (attempt: PendingAttempt) => void;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [naprawione, setNaprawione] = useState(false);
  const startRef = useRef(Date.now());

  const correct = picked !== null && picked === command.en;
  const wNaprawie = picked !== null && !correct && !naprawione;

  useEffect(() => {
    void playPhrase(command.en);
  }, [command.en]);

  useEffect(() => {
    if (picked === null) return;
    playFeedbackTone(correct ? "good" : "try-again");
    if (correct) {
      const timer = setTimeout(onNext, 1200);
      return () => clearTimeout(timer);
    }
    void playPhrase(command.en);
  }, [picked, correct, command.en, onNext]);

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
      soundId: topicId,
      exercise: "command",
      item: command.en,
      correct: option === command.en,
      responseMs: Date.now() - startRef.current,
    });
  }

  return (
    <Card className="no-select flex flex-col items-center gap-5 text-center">
      <h2 className="text-2xl font-bold">Nauczyciel mówi… co robisz?</h2>
      <PhraseSpeaker text={command.en} label="Posłuchaj" size="lg" showText={picked !== null} />

      <div className="grid w-full max-w-3xl gap-3">
        {options.map((option) => {
          const isAnswer = option.en === command.en;
          const state =
            picked === null ? "idle" : isAnswer ? "correct" : option.en === picked ? "wrong" : "dim";
          return (
            <button
              key={option.en}
              type="button"
              disabled={picked !== null && !(wNaprawie && isAnswer)}
              onClick={() => (wNaprawie ? setNaprawione(true) : pick(option.en))}
              className={`flex items-center gap-4 rounded-blob px-5 py-4 text-left transition active:translate-y-1 ${
                state === "idle"
                  ? "bg-white/15 text-paper shadow-[0_6px_0_rgba(0,0,0,0.3)]"
                  : state === "correct"
                    ? `bg-hero-lime text-night ${wNaprawie ? "animate-pulse-ring" : ""}`
                    : state === "wrong"
                      ? "bg-hero-pink text-night"
                      : "bg-white/5 text-paper/40"
              }`}
            >
              <span className="text-4xl" aria-hidden>
                {option.emoji}
              </span>
              <span className="text-lg font-bold">{option.actionPl}</span>
            </button>
          );
        })}
      </div>

      {wNaprawie && (
        <p className="text-sm font-bold text-hero-gold">
          👆 Posłuchaj i stuknij, co trzeba zrobić, żeby iść dalej.
        </p>
      )}

      {picked !== null && (
        <p className="animate-pop-in text-lg text-hero-cyan">
          <span className="font-reading font-bold">{command.en}</span> — {command.pl}
        </p>
      )}

      <p className="text-xs text-paper/50">
        Tego zdania nie musisz mówić. Wystarczy, że wiesz, co zrobić.
      </p>
    </Card>
  );
}

// --- Ćwiczenie 5: które słowo pasuje ---------------------------------------

function CollocationScreen({
  collocation,
  options,
  topicId,
  mode,
  onAnswer,
  onNext,
}: {
  collocation: Collocation;
  options: string[];
  topicId: string;
  mode: SessionMode;
  onAnswer: (attempt: PendingAttempt) => void;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [naprawione, setNaprawione] = useState(false);
  const startRef = useRef(Date.now());

  const correct = picked !== null && picked === collocation.answer;
  const wNaprawie = picked !== null && !correct && !naprawione;
  // Uwaga „dlaczego kalka nie działa” potrzebuje kilku sekund czytania —
  // w trybie z rodzicem ekran czeka na „Dalej” zamiast uciekać po 1,6 s.
  const czekaNaDalej = mode === "parent" && Boolean(collocation.whyPl);
  const rozstrzygniete = correct || naprawione;

  useEffect(() => {
    if (picked === null) return;
    playFeedbackTone(correct ? "good" : "try-again");
    // Ostatnie, co dziecko słyszy, ma być POPRAWNĄ całością — także po błędzie.
    // Odtworzenie samego wybranego słowa utrwalałoby kalkę.
    void playPhrase(collocation.en);
    if (correct && !czekaNaDalej) {
      const timer = setTimeout(onNext, 1600);
      return () => clearTimeout(timer);
    }
  }, [picked, correct, czekaNaDalej, collocation.en, onNext]);

  useEffect(() => {
    if (!naprawione) return;
    playFeedbackTone("good");
    // Naprawa = stuknięcie dobrego słowa; całość gra jeszcze raz, żeby klocek
    // wszedł do ucha w komplecie.
    void playPhrase(collocation.en);
    if (czekaNaDalej) return;
    const timer = setTimeout(onNext, 1600);
    return () => clearTimeout(timer);
  }, [naprawione, czekaNaDalej, collocation.en, onNext]);

  function pick(option: string) {
    setPicked(option);
    onAnswer({
      ts: Date.now(),
      soundId: topicId,
      exercise: "collocation",
      item: collocation.en,
      correct: option === collocation.answer,
      responseMs: Date.now() - startRef.current,
    });
  }

  const [before, after] = collocation.gap.split("___");

  return (
    <Card className="no-select flex flex-col items-center gap-5 text-center">
      <h2 className="text-2xl font-bold">Które słowo pasuje?</h2>
      <div className="text-7xl" aria-hidden>
        {collocation.emoji}
      </div>
      <p className="text-xl font-bold text-hero-cyan">{collocation.pl}</p>

      <p className="font-reading flex flex-wrap items-center justify-center gap-2 text-3xl font-black">
        {before}
        <span
          className={`inline-block min-w-24 rounded-xl px-3 py-1 ${
            picked === null ? "bg-white/15 text-paper/40" : "bg-hero-gold text-night"
          }`}
        >
          {picked === null ? "?" : collocation.answer}
        </span>
        {after}
      </p>

      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const isAnswer = option === collocation.answer;
          const state =
            picked === null ? "idle" : isAnswer ? "correct" : option === picked ? "wrong" : "dim";
          return (
            <button
              key={option}
              type="button"
              disabled={picked !== null && !(wNaprawie && isAnswer)}
              // Celowo bez odtwarzania stukniętego słowa: i tak przerwałoby je
              // pełne wyrażenie z efektu (jeden współdzielony element audio),
              // a po błędzie ostatnie, co słychać, ma być poprawną całością.
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
          👆 Stuknij słowo, które pasuje, żeby iść dalej.
        </p>
      )}

      {mode === "parent" && picked !== null && collocation.whyPl && (
        <p className="max-w-md rounded-2xl border border-hero-cyan/40 bg-hero-cyan/10 p-3 text-xs text-paper/85">
          <strong className="text-hero-cyan">Dla rodzica: </strong>
          {collocation.whyPl}
        </p>
      )}

      {czekaNaDalej && rozstrzygniete && (
        <BigButton onClick={onNext}>Dalej ▸</BigButton>
      )}
    </Card>
  );
}

// --- Ćwiczenie 6: powiedz to -----------------------------------------------

function SayScreen({
  phrase,
  topicId,
  mode,
  onAnswer,
  onNext,
}: {
  phrase: Phrase;
  topicId: string;
  mode: SessionMode;
  onAnswer: (attempt: PendingAttempt) => void;
  onNext: () => void;
}) {
  const startRef = useRef(Date.now());

  useEffect(() => {
    void playPhrase(phrase.en);
  }, [phrase.en]);

  // Mówienie ocenia rodzic — bramki naprawy nie ma, korekta dzieje się w
  // rozmowie ("posłuchaj i powtórz"), nie na ekranie.
  function report(correct: boolean | null) {
    onAnswer({
      ts: Date.now(),
      soundId: topicId,
      exercise: "say",
      item: phrase.en,
      correct,
      responseMs: Date.now() - startRef.current,
    });
    onNext();
  }

  return (
    <Card className="no-select flex flex-col items-center gap-5 text-center">
      <h2 className="text-2xl font-bold">Powiedz to na głos</h2>
      <div className="text-7xl" aria-hidden>
        {phrase.emoji}
      </div>
      <p className="max-w-md text-lg text-paper/80">{phrase.situationPl}</p>
      <PhraseSpeaker text={phrase.en} label="Posłuchaj wzoru" size="lg" />
      <p className="text-lg text-hero-cyan">{phrase.pl}</p>

      {mode === "parent" && <Scenka zwrot={phrase.en} />}

      {mode === "parent" ? (
        <>
          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <BigButton tone="yes" onClick={() => report(true)} full>
              Powiedział sam
            </BigButton>
            <BigButton tone="no" onClick={() => report(false)} full>
              Z pomocą
            </BigButton>
          </div>
          <p className="text-xs text-paper/50">
            To Ty oceniasz — aplikacja nie słucha dziecka i nie ocenia wymowy.
          </p>
        </>
      ) : (
        <>
          <BigButton onClick={() => report(null)}>Powiedziałem</BigButton>
          <p className="text-xs text-paper/50">
            W trybie samodzielnym to ćwiczenie nie jest punktowane — nikt nie słucha.
          </p>
        </>
      )}
    </Card>
  );
}

// --- Podsumowanie i nagroda -------------------------------------------------

function RewardScreen({
  topic,
  outcome,
  status,
  onAgain,
}: {
  topic: Topic;
  outcome: SessionOutcome;
  status: TopicStatus;
  onAgain: () => void;
}) {
  const hero = getHero(topic.heroId);
  const accuracy = outcome.accuracy;
  // Zawsze co najmniej jedna gwiazdka — brief: bez kar za błędy.
  const stars = accuracy === null ? 2 : accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;
  const odznaka = status === "mastered";

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
    return () => {
      timers.forEach(clearTimeout);
      stopVictoryFanfare();
    };
  }, [stars]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <Celebration big={odznaka} />

      <h1 className="animate-pop-in text-3xl font-black">Misja zakończona!</h1>

      <HeroAvatar hero={hero} size={150} cheering />

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
          <span aria-hidden>{topic.emoji}</span> {topic.titlePl}
        </p>
        <p className="text-paper/80">
          {outcome.session.scored > 0
            ? `Dobrze: ${outcome.session.correct} z ${outcome.session.scored}`
            : "Sesja ćwiczeń mówionych — bez punktacji"}
        </p>
      </Card>

      {/* Nagroda toru 2 to odznaka tematu, a nie postać: drużyna zostaje
          nagrodą za czytanie, żeby dwie waluty motywacji się nie mieszały. */}
      {odznaka && (
        <Card className="w-full max-w-md border-hero-gold/50 bg-hero-gold/10">
          <p className="text-lg font-bold text-hero-gold">Odznaka tematu zdobyta!</p>
          <div className="my-2 text-6xl" aria-hidden>
            {topic.emoji}
          </div>
          <p className="text-sm text-paper/80">
            Temat „{topic.titlePl}” opanowany. Warto do niego wracać co jakiś czas — zwroty,
            których się nie używa, cichną.
          </p>
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
        <BigButton href="/slownictwo" tone="quiet" full>
          Inne tematy
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
 * Zasada jak w torze 1: powtórka, nie druga próba. Wynik zapadł przy pierwszej
 * odpowiedzi; tutaj wszystko da się jeszcze raz USŁYSZEĆ, niczego nie da się
 * przepunktować.
 */
function PowtorkaEkranu({
  screen,
  attempt,
  mode,
  onDalej,
}: {
  screen: Screen;
  attempt: PendingAttempt | undefined;
  mode: SessionMode;
  onDalej: () => void;
}) {
  const wynik =
    attempt === undefined || attempt.correct === null
      ? null
      : attempt.correct
        ? ("dobrze" as const)
        : ("do-powtorki" as const);

  const tresc = (() => {
    switch (screen.kind) {
      case "meet":
      case "vocab":
        return {
          emoji: screen.word.emoji,
          en: screen.word.en,
          pl: screen.word.pl,
          audio: <WordSpeaker word={screen.word.en} label="Posłuchaj" size="lg" />,
          opis: null,
        };
      case "phrase":
      case "say":
        return {
          emoji: screen.phrase.emoji,
          en: screen.phrase.en,
          pl: screen.phrase.pl,
          audio: <PhraseSpeaker text={screen.phrase.en} label="Posłuchaj" size="lg" showText={false} />,
          opis: screen.phrase.situationPl,
        };
      case "command":
      case "act":
        return {
          emoji: screen.command.emoji,
          en: screen.command.en,
          pl: screen.command.pl,
          audio: <PhraseSpeaker text={screen.command.en} label="Posłuchaj" size="lg" showText={false} />,
          opis: screen.command.actionPl,
        };
      case "collocation":
        return {
          emoji: screen.collocation.emoji,
          en: screen.collocation.en,
          pl: screen.collocation.pl,
          audio: (
            <PhraseSpeaker
              text={screen.collocation.en}
              label="Posłuchaj"
              size="lg"
              showText={false}
            />
          ),
          opis: null,
        };
    }
  })();

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

      <div className="text-7xl" aria-hidden>
        {tresc.emoji}
      </div>
      <p className="font-reading max-w-md text-3xl font-black">{tresc.en}</p>
      <p className="text-xl text-hero-cyan">{tresc.pl}</p>
      {tresc.opis && <p className="max-w-md text-sm text-paper/70">{tresc.opis}</p>}
      {tresc.audio}

      {/* Powtórka to najlepszy moment na materiał rodzica: nic nie tyka,
          można spokojnie odegrać scenkę albo posłuchać słowa w zdaniu. */}
      {mode === "parent" && (screen.kind === "meet" || screen.kind === "vocab") && (
        <ZdanieZeSlowem slowo={screen.word.en} />
      )}
      {mode === "parent" && (screen.kind === "phrase" || screen.kind === "say") && (
        <Scenka zwrot={screen.phrase.en} />
      )}

      <BigButton onClick={onDalej}>Dalej ▸</BigButton>
    </Card>
  );
}

// --- Materiał trybu „z rodzicem" --------------------------------------------

/** Mały głośnik do kwestii scenki — celowo nie WordSpeaker, żeby nie krzyczał. */
function MalyGlosnik({ tekst }: { tekst: string }) {
  return (
    <button
      type="button"
      onClick={() => void playPhrase(tekst)}
      aria-label={`Posłuchaj: ${tekst}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hero-gold/25 text-base transition active:translate-y-0.5"
    >
      🔊
    </button>
  );
}

/**
 * Zdanie przykładowe do słowa — tryb z rodzicem.
 *
 * Po co: samo słowo z obrazkiem to etykieta; dziecko musi je jeszcze USŁYSZEĆ
 * wewnątrz zdania, bo w szkole nigdy nie przyjdzie samo. Rodzic odtwarza
 * zdanie, dziecko łapie znajome słowo w środku — to najprostsze ćwiczenie
 * rozumienia ze słuchu, jakie istnieje.
 */
function ZdanieZeSlowem({ slowo }: { slowo: string }) {
  const zdanie = wordExample(slowo);
  if (!zdanie) return null;

  return (
    <div className="w-full max-w-md rounded-2xl border border-hero-cyan/40 bg-hero-cyan/10 p-4 text-left">
      <p className="mb-2 text-xs font-bold tracking-wide text-hero-cyan uppercase">
        Dla rodzica — to słowo w zdaniu
      </p>
      <div className="flex items-center gap-3">
        <MalyGlosnik tekst={zdanie.en} />
        <div>
          <p className="font-reading text-lg font-bold">{zdanie.en}</p>
          <p className="text-sm text-paper/70">{zdanie.pl}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-paper/50">
        Odtwórz i zapytaj: „Usłyszałeś nasze słowo?” — dziecko ma je wyłapać ze środka
        zdania.
      </p>
    </div>
  );
}

/**
 * Scenka do odegrania + niuans — tryb z rodzicem.
 *
 * To jest serce „modułu z rodzicem": zwrot odegrany w roli utrwala się lepiej
 * niż zwrot wyjaśniony. Rodzic gra podpisaną rolę (nauczycielkę, kolegę, panią
 * ze stołówki), dziecko odpowiada swoją kwestią — tą samą, którą właśnie
 * ćwiczyło. Każdą kwestię można odsłuchać, żeby nie zgadywać wymowy.
 */
function Scenka({ zwrot }: { zwrot: string }) {
  const kwestie = phraseScene(zwrot);
  const niuans = phraseNote(zwrot);
  if (kwestie.length === 0 && !niuans) return null;

  return (
    <div className="w-full max-w-xl rounded-2xl border border-hero-cyan/40 bg-hero-cyan/10 p-4 text-left">
      {kwestie.length > 0 && (
        <>
          <p className="mb-2 text-xs font-bold tracking-wide text-hero-cyan uppercase">
            Dla rodzica — odegrajcie scenkę
          </p>
          <div className="flex flex-col gap-2">
            {kwestie.map((kwestia, numer) => {
              const dziecko = kwestia.kto === "Ty";
              return (
                <div
                  key={numer}
                  className={`flex items-start gap-3 rounded-xl p-2 ${
                    dziecko ? "bg-hero-gold/15" : "bg-black/20"
                  }`}
                >
                  <MalyGlosnik tekst={kwestia.en} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-paper/50 uppercase">
                      {dziecko ? "🌟 dziecko" : `Ty grasz: ${kwestia.kto}`}
                    </p>
                    <p className="font-reading font-bold">{kwestia.en}</p>
                    <p className="text-xs text-paper/60">{kwestia.pl}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-paper/50">
            Zamieńcie się potem rolami — dziecko lubi grać nauczycielkę, a pytanie uczy tak
            samo jak odpowiedź.
          </p>
        </>
      )}
      {niuans && (
        <p
          className={`rounded-xl bg-black/20 p-3 text-xs leading-relaxed text-paper/80 ${
            kwestie.length > 0 ? "mt-3" : ""
          }`}
        >
          <strong className="text-hero-cyan">💡 Warto wiedzieć: </strong>
          {niuans}
        </p>
      )}
    </div>
  );
}

// --- Ćwiczenie: pokaż ruchem (TPR) ------------------------------------------

/**
 * Dziecko słyszy polecenie i WYKONUJE je ciałem — wstaje, podnosi rękę, dosuwa
 * krzesło. Rodzic potwierdza, aplikacja niczego nie mierzy.
 *
 * Dlaczego to osobne ćwiczenie: ruch sprzężony ze słowem wzmacnia pamięć
 * u dzieci w tym wieku na miesiące (Andrä i in. 2020 — badanie na 8-latkach;
 * metaanalizy TPR). To też najbliższe prawdziwej szkole użycie poleceń:
 * nauczycielka mówi — dziecko robi, nie odpowiada.
 *
 * Tylko w trybie z rodzicem (buildScreens pomija w samodzielnym): bez dorosłego
 * nie ma komu zobaczyć ruchu, a przycisk „zrobiłem” bez świadka uczyłby
 * klikania, nie reagowania.
 */
function ActScreen({
  command,
  topicId,
  onAnswer,
  onNext,
}: {
  command: Command;
  topicId: string;
  onAnswer: (attempt: PendingAttempt) => void;
  onNext: () => void;
}) {
  const startRef = useRef(Date.now());

  useEffect(() => {
    void playPhrase(command.en);
  }, [command.en]);

  function report(correct: boolean) {
    onAnswer({
      ts: Date.now(),
      soundId: topicId,
      exercise: "act",
      item: command.en,
      correct,
      responseMs: Date.now() - startRef.current,
    });
    onNext();
  }

  return (
    <Card className="no-select flex flex-col items-center gap-5 text-center">
      <h2 className="text-2xl font-bold">
        <span className="text-hero-cyan">Pokaż ruchem!</span>
      </h2>
      <div className="animate-pop-in text-8xl" aria-hidden>
        {command.emoji}
      </div>
      <PhraseSpeaker text={command.en} label="Posłuchaj" size="lg" showText={false} />
      <p className="max-w-md text-lg text-paper/80">
        Usłyszałeś polecenie? <strong>Zrób to naprawdę</strong> — całym ciałem, jak w szkole.
      </p>

      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <BigButton tone="yes" onClick={() => report(true)} full>
          Pokazał sam
        </BigButton>
        <BigButton tone="no" onClick={() => report(false)} full>
          Z podpowiedzią
        </BigButton>
      </div>
      <p className="text-xs text-paper/50">
        Ty potwierdzasz — aplikacja nie widzi ruchu. Jeśli dziecko się waha, pokaż ruch
        razem z nim i odtwórzcie polecenie jeszcze raz.
      </p>
      <p className="animate-pop-in text-lg text-hero-cyan">
        <span className="font-reading font-bold">{command.en}</span> — {command.pl}
      </p>
    </Card>
  );
}
