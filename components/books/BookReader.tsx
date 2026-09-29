"use client";

/**
 * Czytanie książeczki (decodable reader): okładka z rozgrzewką → strony →
 * „Porozmawiajcie”.
 *
 * Kolejność na stronie jest nieprzypadkowa (jak w mini-czytance na koniec
 * lekcji): NAJPIERW dziecko czyta samo, DOPIERO POTEM gra nagranie — odwrotnie
 * ćwiczylibyśmy powtarzanie ze słuchu, nie czytanie. Ocenia rodzic
 * („Przeczytał sam” / „Z pomocą”); w trybie samodzielnym bez oceny. Aplikacja
 * nie słucha dziecka.
 *
 * Zapis: jedna sesja toru czytania pod dźwiękiem bramki, z próbą „book” na
 * stronę — szczegóły w lib/books/progress.ts. Przerwana książeczka też się
 * zapisuje (jak przerwana sesja), żeby historia mówiła prawdę.
 */

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { BookPrint } from "@/components/books/BookPrint";
import { BigButton, Card, ParentTip, PhraseSpeaker, StepDots } from "@/components/ui";
import { playPhoneme, playPhrase, playWord, unlockAudio } from "@/lib/audio";
import { bookItem } from "@/lib/books/progress";
import { type Book } from "@/lib/curriculum/books";
import { SOUNDS } from "@/lib/curriculum/sounds";
import { useProgress, type PendingAttempt } from "@/lib/progress/store";
import { type SessionMode } from "@/lib/progress/types";
import { useBusy } from "@/lib/sessionBusy";
import { useDeviceRole } from "@/lib/useDeviceRole";

type Stage = "cover" | "reading" | "done";

/** Dźwięk dla grafemu z okładki — pierwszy w sekwencji (dla „oo”/„ow” ten wcześniejszy). */
function soundForGrapheme(grapheme: string) {
  return SOUNDS.find((sound) => sound.grapheme === grapheme);
}

function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-11 text-sm text-paper/60 underline"
    >
      🖨️ Drukuj książeczkę do rysowania
    </button>
  );
}

/** Tekst strony: red words na różowo, jak w mini-czytance. */
function ReadingText({ text, red }: { text: string; red: Set<string> }) {
  return (
    <p className="font-reading flex max-w-2xl flex-wrap justify-center gap-x-3 gap-y-1 text-4xl leading-tight font-black">
      {text.split(/\s+/).map((word, index) => {
        const bare = word.toLowerCase().replace(/[^a-z]/g, "");
        return (
          <span key={index} className={red.has(bare) ? "text-hero-pink" : undefined}>
            {word}
          </span>
        );
      })}
    </p>
  );
}

export function BookReader({ book }: { book: Book }) {
  const { commitSession } = useProgress();
  const { role } = useDeviceRole();
  const [stage, setStage] = useState<Stage>("cover");
  const [mode, setMode] = useState<SessionMode>("solo");
  const [page, setPage] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [alone, setAlone] = useState(0);
  const attemptsRef = useRef<PendingAttempt[]>([]);
  const startedTsRef = useRef(0);
  const pageStartRef = useRef(0);
  const savedRef = useRef(false);
  // W trakcie czytania ekran nie gaśnie, a aktualizacja aplikacji czeka.
  useBusy(stage === "reading");

  const red = useMemo(() => new Set(book.redWords.map((word) => word.toLowerCase())), [book]);
  const phone = role === "phone";

  function start(chosen: SessionMode) {
    // Gest użytkownika — jedyny moment, w którym iOS odblokuje audio na resztę.
    unlockAudio();
    setMode(chosen);
    setPage(0);
    setRevealed(false);
    setAlone(0);
    attemptsRef.current = [];
    savedRef.current = false;
    startedTsRef.current = Date.now();
    pageStartRef.current = Date.now();
    setStage("reading");
  }

  const save = useCallback(() => {
    if (savedRef.current || attemptsRef.current.length === 0) return;
    savedRef.current = true;
    commitSession({
      soundId: book.afterSoundId,
      mode,
      device: role,
      startedTs: startedTsRef.current,
      endedTs: Date.now(),
      attempts: attemptsRef.current,
    });
  }, [book.afterSoundId, commitSession, mode, role]);

  function judge(correct: boolean | null) {
    attemptsRef.current.push({
      ts: Date.now(),
      soundId: book.afterSoundId,
      exercise: "book",
      item: bookItem(book.id, page + 1),
      correct,
      responseMs: Date.now() - pageStartRef.current,
    });
    if (correct) setAlone((count) => count + 1);
    if (page + 1 >= book.pages.length) {
      save();
      setStage("done");
      return;
    }
    setPage(page + 1);
    setRevealed(false);
    pageStartRef.current = Date.now();
  }

  const parentTip = (
    <div className="w-full max-w-2xl text-left">
      <ParentTip>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Najpierw dziecko czyta stronę samo. Trudne słowo — głoska po głosce, potem sklejcie
            (Fred Talk). Dopiero potem „sprawdź nagraniem”.
          </li>
          <li>
            Oceń stronę: „Przeczytał sam” albo „Z pomocą”. To nie ocena dziecka, tylko informacja,
            czy książeczka jest w sam raz.
          </li>
          <li>Za trudna? Przeczytajcie ją razem i wróćcie za kilka dni. Za łatwa — świetnie, następna.</li>
          <li>„Drukuj” daje wersję na papier: dziecko czyta stronę i rysuje, co przeczytało.</li>
        </ul>
      </ParentTip>
    </div>
  );

  let screen: React.ReactNode;

  if (stage === "cover") {
    screen = (
      <div className={`flex flex-col items-center text-center ${phone ? "gap-4" : "gap-6"}`}>
        <Link href="/ksiazeczki" className="self-start text-sm text-paper/60 underline">
          ← Książeczki
        </Link>
        <div className="text-8xl" aria-hidden>
          {book.emoji}
        </div>
        <h1 className="font-reading text-4xl font-black">{book.titleEn}</h1>
        <p className="text-lg text-hero-cyan">{book.titlePl}</p>

        <Card className="w-full max-w-2xl text-left">
          <h2 className="mb-3 text-lg font-bold">Zanim przeczytasz</h2>
          <p className="mb-2 text-sm text-paper/60">Dźwięki — powiedz każdy (stuknij, żeby sprawdzić):</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {book.focusGraphemes.map((grapheme) => {
              const sound = soundForGrapheme(grapheme);
              return (
                <button
                  key={grapheme}
                  type="button"
                  onClick={() => void playPhoneme(sound?.id ?? grapheme, sound?.example ?? grapheme)}
                  className="font-reading flex min-h-12 min-w-14 items-center justify-center rounded-xl bg-hero-gold px-4 text-2xl font-black text-night shadow-[0_4px_0_#c99a1f] transition active:translate-y-1 active:shadow-none"
                >
                  {grapheme}
                </button>
              );
            })}
          </div>
          <p className="mb-2 text-sm text-paper/60">Zielone słowa — sklej z dźwięków:</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {book.greenWords.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => void playWord(word)}
                className="font-reading flex min-h-12 items-center rounded-xl bg-hero-lime px-4 text-2xl font-bold text-night shadow-[0_4px_0_#4fae42] transition active:translate-y-1 active:shadow-none"
              >
                {word}
              </button>
            ))}
          </div>
          <p className="mb-2 text-sm text-paper/60">
            Słowa-łobuzy — przeczytaj w całości, bez sklejania:
          </p>
          <div className="flex flex-wrap gap-2">
            {book.redWords.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => void playWord(word)}
                className="font-reading flex min-h-12 items-center rounded-xl bg-hero-pink px-4 text-2xl font-bold text-night shadow-[0_4px_0_#c93c76] transition active:translate-y-1 active:shadow-none"
              >
                {word}
              </button>
            ))}
          </div>
        </Card>

        {!phone && parentTip}
        <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
          <BigButton onClick={() => start("parent")} full>
            Z rodzicem
          </BigButton>
          <BigButton tone="quiet" onClick={() => start("solo")} full>
            Sam
          </BigButton>
        </div>
        {phone && parentTip}
        <PrintButton />
      </div>
    );
  } else if (stage === "reading") {
    const current = book.pages[page];
    const last = page + 1 >= book.pages.length;
    screen = (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          {/* Wyjście w trakcie zapisuje przeczytane strony — jak przerwana sesja. */}
          <Link href="/ksiazeczki" onClick={save} className="text-sm text-paper/60 underline">
            ← Książeczki
          </Link>
          <span className="text-sm text-paper/60">
            Strona {page + 1} z {book.pages.length}
          </span>
        </div>
        <StepDots total={book.pages.length} current={page} />

        <Card key={page} className="no-select flex flex-col items-center gap-5 text-center">
          <div className="animate-pop-in text-8xl" aria-hidden>
            {current.emoji}
          </div>
          <ReadingText text={current.en} red={red} />

          {!revealed ? (
            <BigButton
              tone="quiet"
              onClick={() => {
                setRevealed(true);
                void playPhrase(current.en);
              }}
            >
              Przeczytałem — sprawdź nagraniem 🔊
            </BigButton>
          ) : (
            <div className="animate-pop-in flex flex-col items-center gap-3">
              <p className="text-lg text-hero-cyan">{current.pl}</p>
              <PhraseSpeaker text={current.en} label="Jeszcze raz" />
              {mode === "parent" ? (
                <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                  <BigButton tone="yes" onClick={() => judge(true)} full>
                    Przeczytał sam
                  </BigButton>
                  <BigButton tone="no" onClick={() => judge(false)} full>
                    Z pomocą
                  </BigButton>
                </div>
              ) : (
                <BigButton onClick={() => judge(null)}>{last ? "Koniec ▸" : "Dalej ▸"}</BigButton>
              )}
            </div>
          )}

          {mode === "parent" && !revealed && (
            <p className="text-xs text-paper/50">
              Dziecko czyta samo — trudne słowo głoska po głosce. Potem sprawdźcie nagraniem.
            </p>
          )}
        </Card>
      </div>
    );
  } else {
    screen = (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="animate-pop-in text-7xl" aria-hidden>
          🎉
        </div>
        <h1 className="text-3xl font-black">Koniec! Cała książeczka przeczytana.</h1>
        {mode === "parent" && (
          <p className="text-lg text-hero-cyan">
            Sam: {alone} z {book.pages.length} stron
          </p>
        )}

        <Card className="w-full max-w-2xl text-left">
          <h2 className="mb-1 text-lg font-bold">Porozmawiajcie</h2>
          <p className="mb-3 text-sm text-paper/60">
            Stuknij pytanie, żeby je usłyszeć. Odpowiedź może być po polsku — chodzi o to, czy
            historyjka została zrozumiana.
          </p>
          <ol className="flex flex-col gap-3">
            {book.questions.map((question) => (
              <li key={question.en}>
                <PhraseSpeaker text={question.en} label="Pytanie" />
                <p className="mt-1 text-sm text-paper/60">{question.pl}</p>
              </li>
            ))}
          </ol>
        </Card>

        <div className="flex flex-wrap justify-center gap-3">
          <BigButton tone="quiet" onClick={() => setStage("cover")}>
            Jeszcze raz
          </BigButton>
          <BigButton href="/ksiazeczki">Do książeczek</BigButton>
        </div>
        <PrintButton />
      </div>
    );
  }

  return (
    <>
      <div className="print:hidden">{screen}</div>
      <BookPrint book={book} />
    </>
  );
}
