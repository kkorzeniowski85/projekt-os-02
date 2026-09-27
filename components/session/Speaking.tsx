"use client";

/**
 * Ćwiczenia MÓWIENIA toru 2: przycisk „Mów ze mną” (echo) i ekran scenki.
 *
 * Punkt wyjścia: dziecko dużo rozumie ze słuchu, prawie nie mówi i nie czyta
 * jeszcze po angielsku. Dlatego każde ćwiczenie tu zaczyna się od UCHA —
 * angielski tekst pokazuje się najpóźniej przy pierwszym odtworzeniu, nigdy
 * jako warunek. Stawka jest niska: nikt nie nagrywa, nikt nie mierzy; w trybie
 * z rodzicem ocenia rodzic dwoma przyciskami, w trybie samodzielnym nie ocenia
 * nikt (correct: null).
 *
 * ECHO (shadowing): nagranie → pauza na powtórzenie → nagranie jeszcze raz.
 * Powtarzanie tuż za wzorem to najniższy próg wejścia w mówienie: nie trzeba
 * niczego układać, wystarczy odbić usłyszany kształt zdania. Drugie odtworzenie
 * jest po to, żeby ostatnia wersja, jaką dziecko słyszy, była poprawna.
 *
 * SCENKA: cała rozmowa do posłuchania z podświetlaniem, potem „Twoja kolej” —
 * aplikacja gra kwestie pozostałych ról i zatrzymuje się przy kwestii dziecka.
 * Ile pomocy dziecko dostaje, zależy od poziomu podpowiedzi zwrotu
 * (lib/progress/rules.ts → speakingLevel): echo → z podpowiedzią → sam.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { HeroAvatar } from "@/components/HeroAvatar";
import { BigButton, Card } from "@/components/ui";
import { audioGeneration, playPhrase, playPhraseSequence, stopAudio } from "@/lib/audio";
import { heroSceneLine, isChildLine, roleEmoji } from "@/lib/curriculum/scenes";
import type { Phrase } from "@/lib/curriculum/vocab";
import type { ScenkaKwestia } from "@/lib/curriculum/vocabParent";
import type { Hero } from "@/lib/heroes";

export type SpeakingLevel = 0 | 1 | 2;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// --- Echo: „Mów ze mną” ------------------------------------------------------

/**
 * Pauza na powtórzenie ≈ 1,2 × długość nagrania, w granicach 1,5–4 s. Długość
 * bierzemy z metadanych pliku (playPhrase z `wait`), a gdy jej nie ma (synteza),
 * szacujemy z liczby słów — dziecko mówi wolniej niż lektor, stąd zapas.
 */
const ECHO_MIN_PAUSE_MS = 1500;
const ECHO_MAX_PAUSE_MS = 4000;
const ECHO_MS_PER_WORD = 450;

export function echoPauseMs(text: string, durationMs: number | undefined): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const base = durationMs ?? words * ECHO_MS_PER_WORD;
  return Math.min(ECHO_MAX_PAUSE_MS, Math.max(ECHO_MIN_PAUSE_MS, Math.round(base * 1.2)));
}

type EchoPhase = "idle" | "play" | "pause" | "replay";

/**
 * Duży przycisk echa. `auto` > 0 uruchamia sekwencję bez stuknięcia (przy
 * kwestii dziecka na poziomie echo i po „Z pomocą”) — każda zmiana wartości to
 * kolejne uruchomienie. `onReveal` woła się przy pierwszym odtworzeniu, żeby
 * ekran odsłonił angielski tekst; `onDone(ok)` po zakończeniu albo przerwaniu.
 */
export function Echo({
  text,
  size = "lg",
  auto = 0,
  onReveal,
  onDone,
}: {
  text: string;
  size?: "lg" | "sm";
  auto?: number;
  onReveal?: () => void;
  onDone?: (ok: boolean) => void;
}) {
  const [phase, setPhase] = useState<EchoPhase>("idle");
  const [dots, setDots] = useState(3);
  // Numer uruchomienia: nowsze (stuknięcie, odmontowanie) unieważnia starsze.
  const runRef = useRef(0);
  const phaseRef = useRef<EchoPhase>("idle");
  // Wywołania zwrotne przez ref, żeby zmiana ich tożsamości nie uruchamiała
  // echa od nowa (efekt zależy tylko od `auto`).
  const revealRef = useRef(onReveal);
  revealRef.current = onReveal;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const go = useCallback((next: EchoPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const run = useCallback(async () => {
    const run = ++runRef.current;
    revealRef.current?.();
    go("play");
    const first = await playPhrase(text, { wait: true });
    if (run !== runRef.current) return;
    if (first.source === "interrupted" || first.source === "unavailable") {
      go("idle");
      doneRef.current?.(false);
      return;
    }
    // Generacja dźwięku z chwili końca nagrania: jeśli w pauzie zagra coś
    // innego (stuknięty głośnik, stopAudio), nie gramy drugi raz.
    const generation = audioGeneration();
    const pauseMs = echoPauseMs(text, first.durationMs);
    go("pause");
    for (let left = 3; left > 0; left--) {
      setDots(left);
      await sleep(pauseMs / 3);
      if (run !== runRef.current) return;
      if (audioGeneration() !== generation) {
        go("idle");
        doneRef.current?.(false);
        return;
      }
    }
    setDots(0);
    go("replay");
    await playPhrase(text, { wait: true });
    if (run !== runRef.current) return;
    go("idle");
    doneRef.current?.(true);
  }, [text, go]);

  useEffect(() => {
    if (auto > 0) void run();
  }, [auto, run]);

  // Odmontowanie w trakcie (następny ekran, wyjście) ucisza echo — bez tego
  // drugie odtworzenie zagrałoby już na kolejnym ekranie.
  useEffect(
    () => () => {
      runRef.current += 1;
      if (phaseRef.current !== "idle") stopAudio();
    },
    [],
  );

  const label =
    phase === "idle"
      ? "Mów ze mną"
      : phase === "play"
        ? "Posłuchaj…"
        : phase === "pause"
          ? "Teraz ty!"
          : "Jeszcze raz…";
  const icon = phase === "idle" ? "🗣️" : phase === "pause" ? "🌟" : "🔊";

  return (
    <button
      type="button"
      onClick={() => void run()}
      aria-label={`Mów ze mną: ${text}`}
      className={`flex items-center justify-center gap-3 rounded-blob bg-hero-cyan font-bold text-night shadow-[0_6px_0_rgba(0,0,0,0.3)] transition active:translate-y-1 active:shadow-none ${
        size === "lg" ? "min-h-14 px-7 py-3 text-2xl" : "min-h-11 px-4 py-2 text-base"
      }`}
    >
      <span aria-hidden>{icon}</span>
      {label}
      {phase === "pause" && (
        // Trzy kropki gasną jak odliczanie — dziecko widzi, ile ma czasu.
        <span className="flex gap-1.5" aria-hidden>
          {[3, 2, 1].map((dot) => (
            <span
              key={dot}
              className={`h-3 w-3 rounded-full bg-night transition-opacity duration-500 ${
                dot <= dots ? "opacity-100" : "opacity-20"
              }`}
            />
          ))}
        </span>
      )}
    </button>
  );
}

// --- Scenka -------------------------------------------------------------------

/**
 * `parent` — ocenia rodzic („Powiedział sam” / „Z pomocą”);
 * `solo` — dziecko samo, „Powiedziałem ▸” bez oceny (także 🎭 Scenki poza sesją);
 * `listen` — tylko odsłuch z podświetlaniem (powtórka ↩), bez „Twoja kolej”.
 */
export type SceneMode = "parent" | "solo" | "listen";

type ScenePhase = "listen" | "turn" | "done";

export function SceneScreen({
  phrase,
  lines,
  hero,
  mode,
  levelOf,
  onSay,
  onNext,
  nextLabel = "Dalej ▸",
}: {
  phrase: Phrase;
  lines: ScenkaKwestia[];
  hero: Hero;
  mode: SceneMode;
  levelOf: (phraseEn: string) => SpeakingLevel;
  /** Kwestia dziecka wypowiedziana: tekst, ocena rodzica (null = bez oceny), czas. */
  onSay?: (item: string, correct: boolean | null, responseMs: number) => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  const [phase, setPhase] = useState<ScenePhase>("listen");
  const [current, setCurrent] = useState<number | null>(null);
  /** Faza „Twoja kolej”: indeks kwestii, na której stoi rozmowa. */
  const [cursor, setCursor] = useState(0);
  // Polski domyślnie widoczny: dziecko nie czyta po angielsku, a znaczenie ma
  // rozumieć, nie zgadywać. Przełącznik chowa go, gdy już nie jest potrzebny.
  const [showPl, setShowPl] = useState(true);
  const [heard, setHeard] = useState(false);
  const [hintEn, setHintEn] = useState(false);
  const [hintPl, setHintPl] = useState(false);
  const [echoKey, setEchoKey] = useState(0);
  const [recast, setRecast] = useState(false);
  const [stalled, setStalled] = useState(false);
  const [retry, setRetry] = useState(0);
  // Numer odtworzenia (stuknięta kwestia albo całość) — jak w Akademii: ramkę
  // gasi tylko odtworzenie, którego nic później nie zastąpiło.
  const playRef = useRef(0);
  const lineStartRef = useRef(Date.now());
  // Bieżąca faza dla odroczonego startu (niżej) — timer nie widzi świeżego stanu.
  const phaseRef = useRef<ScenePhase>("listen");
  phaseRef.current = phase;
  // Kwestie i poziomy przez ref: efekty niżej zależą tylko od fazy i kursora,
  // a nie od tożsamości tablicy czy funkcji z zewnątrz — nowa tożsamość przy
  // re-renderze rodzica nie może uruchomić rozmowy od nowa.
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const levelOfRef = useRef(levelOf);
  levelOfRef.current = levelOf;

  const playAll = useCallback(() => {
    playRef.current += 1;
    void playPhraseSequence(
      linesRef.current.map((line, index) => ({ text: line.en, onStart: () => setCurrent(index) })),
      350,
    ).then((finished) => {
      if (finished) {
        setCurrent(null);
        setHeard(true);
      }
    });
  }, []);

  // Faza 1: rozmowa czyta się sama po chwili — najpierw uchem. Start tylko,
  // jeśli ekran wciąż słucha: stuknięcie „Twoja kolej” przed upływem 400 ms
  // uruchamiałoby całą rozmowę w poprzek fazy 2 (stopAudio nie cofa timera).
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phaseRef.current === "listen") playAll();
    }, 400);
    return () => {
      clearTimeout(timer);
      stopAudio();
    };
  }, [playAll]);

  // Faza 2: kwestie pozostałych ról grają po kolei; przy kwestii dziecka
  // rozmowa staje i czeka na nie (i na ocenę rodzica).
  useEffect(() => {
    if (phase !== "turn") return;
    const kwestie = linesRef.current;
    // Stuknięta wcześniej kwestia (playLine) nie może zgasić podświetlenia,
    // które należy już do „Twojej kolei” — jej sprzątanie staje się nieaktualne.
    playRef.current += 1;
    if (cursor >= kwestie.length) {
      setCurrent(null);
      setPhase("done");
      return;
    }
    if (isChildLine(kwestie[cursor])) {
      setCurrent(cursor);
      setHintEn(false);
      setHintPl(false);
      setRecast(false);
      lineStartRef.current = Date.now();
      // Poziom echo: kwestia gra od razu, potem pauza na powtórzenie.
      if (levelOfRef.current(kwestie[cursor].en) === 0) setEchoKey((key) => key + 1);
      return;
    }
    let end = cursor;
    while (end < kwestie.length && !isChildLine(kwestie[end])) end += 1;
    let cancelled = false;
    setStalled(false);
    void playPhraseSequence(
      kwestie
        .slice(cursor, end)
        .map((line, offset) => ({ text: line.en, onStart: () => setCurrent(cursor + offset) })),
      350,
    ).then((finished) => {
      if (cancelled) return;
      // Przerwana sekwencja (inne odtworzenie) nie może zawiesić rozmowy —
      // ekran pokazuje wtedy „Graj dalej”.
      if (finished) setCursor(end);
      else setStalled(true);
    });
    return () => {
      cancelled = true;
    };
  }, [phase, cursor, retry]);

  const playLine = (index: number) => {
    const play = ++playRef.current;
    setCurrent(index);
    void playPhrase(lines[index].en, { wait: true }).then(() => {
      if (play === playRef.current) setCurrent(null);
    });
  };

  const beginTurn = () => {
    stopAudio();
    playRef.current += 1;
    setCurrent(null);
    setCursor(0);
    setPhase("turn");
  };

  const pendingLine =
    phase === "turn" && cursor < lines.length && isChildLine(lines[cursor]) ? lines[cursor] : null;
  const level: SpeakingLevel = pendingLine ? levelOf(pendingLine.en) : 0;

  function rate(correct: boolean | null) {
    if (!pendingLine) return;
    onSay?.(pendingLine.en, correct, Date.now() - lineStartRef.current);
    if (correct === false) {
      // Ostatni ruch dziecka ma być właściwy: po „Z pomocą” kwestia gra jeszcze
      // raz w trybie echo (recast), zanim rozmowa pójdzie dalej.
      setRecast(true);
      setHintEn(true);
      setEchoKey((key) => key + 1);
      return;
    }
    setCursor((value) => value + 1);
  }

  const onEchoDone = () => {
    if (recast) {
      setRecast(false);
      setCursor((value) => value + 1);
    }
  };

  const heading =
    phase === "listen" ? "Posłuchaj rozmowy" : phase === "turn" ? "Twoja kolej" : "Scenka zagrana!";

  return (
    <Card className="no-select flex flex-col items-center gap-4 text-center">
      {/* Bohater tematu zapowiada scenkę — tylko tekst, bez nagrania. */}
      <div className="flex w-full max-w-2xl items-center gap-3 text-left">
        <HeroAvatar hero={hero} size={56} />
        <p className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-paper/90">
          {heroSceneLine(lines)}
        </p>
      </div>

      <h2 className="text-2xl font-bold">
        <span aria-hidden>🎭</span> {heading}
      </h2>
      <p className="max-w-md text-sm text-paper/70">
        <span aria-hidden>{phrase.emoji}</span> {phrase.situationPl}
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {phase !== "turn" && (
          <button
            type="button"
            onClick={playAll}
            className="flex min-h-14 items-center gap-3 rounded-blob bg-hero-gold px-6 py-3 text-xl font-bold text-night shadow-[0_6px_0_#c99a1f] transition active:translate-y-1 active:shadow-none"
          >
            <span aria-hidden>🔊</span>
            {heard ? "Jeszcze raz" : "Posłuchaj całości"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowPl((value) => !value)}
          className="min-h-11 rounded-blob bg-white/10 px-4 py-2 text-sm font-bold"
          aria-pressed={showPl}
        >
          🇵🇱 {showPl ? "ukryj polski" : "po polsku"}
        </button>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-2 text-left">
        {lines.map((line, index) => {
          const child = isChildLine(line);
          const isCurrent = current === index;
          const lineLevel = child ? levelOf(line.en) : 0;
          // W „Twojej kolei” kwestie dziecka, które jeszcze nie padły, są
          // zasłonięte według poziomu: angielski od poziomu 1, polski na 2.
          const notYet = phase === "turn" && child && index >= cursor;
          const showEn = !notYet || lineLevel === 0 || (index === cursor && hintEn);
          const showPlHere = showPl && (!notYet || lineLevel < 2 || (index === cursor && hintPl));
          return (
            <button
              key={index}
              type="button"
              disabled={phase === "turn"}
              onClick={() => playLine(index)}
              className={`rounded-2xl px-4 py-3 text-left transition ${
                isCurrent
                  ? child
                    ? "bg-hero-lime/20 ring-2 ring-hero-lime"
                    : "bg-hero-gold/25 ring-2 ring-hero-gold"
                  : child
                    ? "bg-hero-gold/10"
                    : "bg-white/5"
              }`}
            >
              <span className="block text-xs font-bold tracking-wide text-paper/60 uppercase">
                <span aria-hidden>{roleEmoji(line.kto)}</span> {child ? "Ty" : line.kto}
              </span>
              <span className="font-reading block text-xl leading-snug sm:text-2xl">
                {showEn ? line.en : "…"}
              </span>
              {showPlHere && <span className="block text-base text-hero-cyan">{line.pl}</span>}
            </button>
          );
        })}
      </div>

      {phase === "listen" && (
        <>
          <p className="text-xs text-paper/50">Stuknij kwestię, żeby usłyszeć ją jeszcze raz.</p>
          {mode === "listen" ? (
            <BigButton onClick={onNext}>{nextLabel}</BigButton>
          ) : (
            <BigButton onClick={beginTurn}>Twoja kolej ▸</BigButton>
          )}
        </>
      )}

      {pendingLine && (
        <div className="flex w-full max-w-2xl flex-col items-center gap-3">
          <p className="text-lg font-bold text-hero-gold">
            <span aria-hidden>🌟</span> Twoja kolej — powiedz to!
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {level === 2 && !hintPl && (
              <button
                type="button"
                onClick={() => setHintPl(true)}
                className="min-h-11 rounded-blob bg-white/10 px-4 py-2 text-base font-bold"
              >
                Pokaż znaczenie
              </button>
            )}
            {level >= 1 && !hintEn && (
              <button
                type="button"
                onClick={() => {
                  setHintEn(true);
                  void playPhrase(pendingLine.en);
                }}
                className="flex min-h-14 items-center gap-3 rounded-blob bg-hero-gold px-6 py-3 text-xl font-bold text-night shadow-[0_6px_0_#c99a1f] transition active:translate-y-1 active:shadow-none"
              >
                <span aria-hidden>🔊</span> Podpowiedz
              </button>
            )}
            <Echo
              text={pendingLine.en}
              auto={echoKey}
              onReveal={() => setHintEn(true)}
              onDone={onEchoDone}
            />
          </div>

          {recast ? (
            <p className="text-sm font-bold text-hero-cyan">Posłuchaj i powtórz jeszcze raz…</p>
          ) : mode === "parent" ? (
            <>
              <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                <BigButton tone="yes" onClick={() => rate(true)} full>
                  Powiedział sam
                </BigButton>
                <BigButton tone="no" onClick={() => rate(false)} full>
                  Z pomocą
                </BigButton>
              </div>
              <p className="text-xs text-paper/50">
                To Ty oceniasz — aplikacja nie słucha dziecka i nie ocenia wymowy. Jedno słowo
                to też odpowiedź.
              </p>
            </>
          ) : (
            <BigButton onClick={() => rate(null)}>Powiedziałem ▸</BigButton>
          )}
        </div>
      )}

      {stalled && phase === "turn" && (
        <BigButton tone="quiet" onClick={() => setRetry((value) => value + 1)}>
          ▶ Graj dalej
        </BigButton>
      )}

      {phase === "done" && (
        <>
          <p className="animate-pop-in text-2xl font-black text-hero-lime">
            <span aria-hidden>🎉</span> Brawo! Cała rozmowa po angielsku.
          </p>
          <BigButton onClick={onNext}>{nextLabel}</BigButton>
        </>
      )}
    </Card>
  );
}
