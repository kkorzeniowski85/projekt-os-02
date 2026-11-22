"use client";

/**
 * Ekran główny — "baza drużyny".
 *
 * Kolejność: misja na dziś (2 kroki + 1 dla chętnych, lib/dailyMission.ts),
 * potem MENU DZIAŁÓW: osiem jednakowych kafelków w dwóch grupach (Dźwięki i
 * słowa / Akademia), potem drużyna i tempo głosu.
 *
 * Do 2026-11-22 każdy dział wyglądał tu inaczej i leżał gdzie indziej (mapa
 * dźwięków w trzech kartach, Książeczki jako samotny przycisk, Słowa i zwroty
 * jako karta z przyciskami, Rymowanki w tej karcie, Akademia kafelkami).
 * Prośba rodzica: rozłożyć to porządnie. Dlatego jeden wzór kafelka dla
 * wszystkich, a mapa dźwięków ma własną stronę (/dzwieki) — cały ekran
 * główny mieści się teraz na jednym ekranie tabletu.
 *
 * Układ wg roli urządzenia: telefon — kafelki w 2 kolumnach, „szybka misja";
 * tablet — 4 kolumny; komputer — dodatkowa kolumna dla rodzica.
 *
 * Celowo bez odliczania do szkoły i bez dat — prośba rodzica: ekran dziecka
 * nie przypomina o przeprowadzce. Plan z datami jest w panelu rodzica.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { FactGrid } from "@/components/akademia/FactGrid";
import { HeroAvatar } from "@/components/HeroAvatar";
import { BigButton, Card } from "@/components/ui";
import { VoiceSpeedControl } from "@/components/VoiceSpeedControl";
import { CLASSROOM_UNITS } from "@/lib/akademia/curriculum/classroom";
import { MATHS_TOPICS } from "@/lib/akademia/curriculum/maths";
import { READING_TEXTS } from "@/lib/akademia/curriculum/reading";
import { useProgress as useAkademiaProgress } from "@/lib/akademia/progress/store";
import {
  unitKeyOf,
  type ModuleId,
  type ProgressState as AkademiaState,
} from "@/lib/akademia/progress/types";
import { tablesSummary } from "@/lib/akademia/tables/practice";
import { bookReads } from "@/lib/books/progress";
import { BOOKS } from "@/lib/curriculum/books";
import { RHYMES } from "@/lib/curriculum/rhymes";
import { SOUNDS } from "@/lib/curriculum/sounds";
import { TALK_ENTRIES } from "@/lib/curriculum/talk";
import { spellPoolSize } from "@/lib/progress/spell";
import { TOPICS } from "@/lib/curriculum/vocab";
import { combinedMission, type MissionStepView } from "@/lib/dailyMission";
import { HEROES } from "@/lib/heroes";
import { reviewCount } from "@/lib/progress/review";
import { useProgress } from "@/lib/progress/store";
import { useDeviceRole } from "@/lib/useDeviceRole";
import { DAY_LETTERS, WEEK_GOAL_DAYS, weekDays } from "@/lib/week";

function masteredIn(state: AkademiaState, module: ModuleId, ids: string[]): number {
  return ids.filter((id) => state.units[unitKeyOf(module, id)]?.status === "mastered").length;
}

/**
 * Kolor kafelka: obwódka ikony i pasek postępu. Ikona leży na jasnym kółku —
 * emoji są rysowane pod jasne tło i na granacie część z nich (nuty, czapka
 * absolwenta) prawie znikała. Pełne nazwy klas — Tailwind szuka ich w źródle.
 */
type Accent = "blue" | "violet" | "cyan" | "pink" | "gold" | "lime";

const ACCENT: Record<Accent, { icon: string; bar: string }> = {
  blue: { icon: "ring-hero-blue", bar: "bg-hero-blue" },
  violet: { icon: "ring-hero-violet", bar: "bg-hero-violet" },
  cyan: { icon: "ring-hero-cyan", bar: "bg-hero-cyan" },
  pink: { icon: "ring-hero-pink", bar: "bg-hero-pink" },
  gold: { icon: "ring-hero-gold", bar: "bg-hero-gold" },
  lime: { icon: "ring-hero-lime", bar: "bg-hero-lime" },
};

type Tile = {
  href: string;
  icon: string;
  title: string;
  /** Jedna krótka linijka pod tytułem (postęp). */
  detail: string;
  accent: Accent;
  /** Postęp 0–1 (pasek na dole kafelka); bez niego — sam kafelek. */
  progress?: number;
};

export default function HomePage() {
  const { role } = useDeviceRole();
  const { state, ready: ligaReady } = useProgress();
  const { state: akademia, ready: akademiaReady } = useAkademiaProgress();
  // Misja bierze kroki z obu działów — pokazujemy ją dopiero z kompletem danych.
  const ready = ligaReady && akademiaReady;

  const mission = combinedMission(state, akademia);
  const firstUndone = mission.steps.findIndex((step) => !step.done);
  const stepsDone = mission.steps.filter((step) => step.done).length;

  const masteredCount = Object.values(state.sounds).filter(
    (sound) => sound.status === "mastered",
  ).length;
  const masteredTopics = Object.values(state.topics).filter(
    (topic) => topic.status === "mastered",
  ).length;
  // Dyktando: słowa napisane samodzielnie / słowa z lekcji ćwiczonych dźwięków.
  const spelledOwn = new Set(
    state.attempts.filter((attempt) => attempt.exercise === "spell" && attempt.correct === true).map((attempt) => attempt.item),
  ).size;
  const spellTotal = spellPoolSize(state);
  const talkOwn = new Set(
    state.attempts.filter((attempt) => attempt.exercise === "talk" && attempt.correct === true).map((attempt) => attempt.item),
  ).size;
  const booksRead = new Set(
    bookReads(state)
      .filter((read) => read.finished)
      .map((read) => read.bookId),
  ).size;

  const summary = tablesSummary(akademia.facts);
  const lastMock = akademia.mocks[akademia.mocks.length - 1];
  const mathsDone = masteredIn(akademia, "maths", MATHS_TOPICS.map((t) => t.id));
  const readingDone = masteredIn(akademia, "reading", READING_TEXTS.map((t) => t.id));
  const tasksDone = masteredIn(akademia, "tasks", CLASSROOM_UNITS.map((u) => u.id));

  // Powtórka pomylonych słówek: osobny wiersz pod misją, chyba że misja już ją zawiera.
  const toReview = ready ? reviewCount(state) : 0;
  const reviewInMission =
    mission.steps.some((step) => step.href === "/powtorka") || mission.bonus?.href === "/powtorka";

  const of = (done: number, total: number, word: string, loaded: boolean) =>
    loaded ? `${done}/${total} ${word}` : "…";

  const soundTiles: Tile[] = [
    {
      href: "/dzwieki",
      icon: "🔤",
      title: "Dźwięki",
      detail: of(masteredCount, SOUNDS.length, "opanowane", ligaReady),
      accent: "blue",
      progress: masteredCount / SOUNDS.length,
    },
    {
      href: "/ksiazeczki",
      icon: "📖",
      title: "Książeczki",
      detail: of(booksRead, BOOKS.length, "przeczytane", ligaReady),
      accent: "violet",
      progress: booksRead / BOOKS.length,
    },
    {
      href: "/dyktando",
      icon: "✍️",
      title: "Dyktando",
      detail: of(spelledOwn, spellTotal, "słów", ligaReady),
      accent: "lime",
      progress: spellTotal > 0 ? spelledOwn / spellTotal : 0,
    },
    {
      href: "/slownictwo",
      icon: "🗣️",
      title: "Słowa i zwroty",
      detail: of(masteredTopics, TOPICS.length, "tematów", ligaReady),
      accent: "cyan",
      progress: masteredTopics / TOPICS.length,
    },
    {
      href: "/rozmowa",
      icon: "🦸",
      title: "Rozmowa",
      detail: of(talkOwn, TALK_ENTRIES.length, "pytań sam", ligaReady),
      accent: "gold",
      progress: talkOwn / TALK_ENTRIES.length,
    },
    {
      href: "/rymowanki",
      icon: "🎶",
      title: "Rymowanki",
      detail: `${RHYMES.length} do śpiewania`,
      accent: "pink",
    },
  ];

  const akademiaTiles: Tile[] = [
    {
      href: "/tabliczka/",
      icon: "🔢",
      title: "Tabliczka",
      detail: akademiaReady ? `⚡ ${summary.fluent}/66 płynnie` : "…",
      accent: "cyan",
      progress: summary.fluent / 66,
    },
    {
      href: "/matematyka/",
      icon: "🧮",
      title: "Matematyka",
      detail: of(mathsDone, MATHS_TOPICS.length, "opanowane", akademiaReady),
      accent: "gold",
      progress: mathsDone / MATHS_TOPICS.length,
    },
    {
      href: "/czytanie/",
      icon: "📚",
      title: "Czytanie",
      detail: of(readingDone, READING_TEXTS.length, "opanowane", akademiaReady),
      accent: "lime",
      progress: readingDone / READING_TEXTS.length,
    },
    {
      href: "/polecenia/",
      icon: "🏫",
      title: "Język klasy",
      detail: of(tasksDone, CLASSROOM_UNITS.length, "opanowane", akademiaReady),
      accent: "pink",
      progress: tasksDone / CLASSROOM_UNITS.length,
    },
  ];

  const week = weekDays(state, akademia);
  const weekDone = week.filter(Boolean).length;
  const todayIndex = (new Date().getDay() + 6) % 7;

  const unlockedHeroes = HEROES.filter((hero) => state.unlockedHeroes.includes(hero.id)).length;

  return (
    <div className={role === "desktop" ? "grid grid-cols-[1fr_340px] gap-8" : "flex flex-col gap-6"}>
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">Liga</h1>
            <p className="text-sm text-paper/60">
              {ligaReady ? `Drużyna: ${state.childName}` : "Wczytywanie…"}
            </p>
          </div>
          {role !== "desktop" && (
            <Link
              href="/rodzic"
              className="flex min-h-11 items-center rounded-full bg-white/10 px-5 text-sm"
            >
              Rodzic
            </Link>
          )}
        </header>

        {/* Misja z obu działów — jedno wyraźne „co teraz". */}
        <Card className="border-hero-gold/40 bg-hero-gold/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold tracking-wide text-hero-gold uppercase">
              {ready && mission.done
                ? "Misja na dziś wykonana! 🎉"
                : role === "phone"
                  ? "Szybka misja"
                  : "Misja na dziś"}
            </p>
            {ready && mission.steps.length > 0 && (
              <p
                className="flex items-center gap-2 text-sm font-bold text-paper/80"
                aria-label={`Zrobione kroki: ${stepsDone} z ${mission.steps.length}`}
              >
                <span className="flex gap-1.5" aria-hidden>
                  {mission.steps.map((step, index) => (
                    <span
                      key={index}
                      className={`h-3 w-3 rounded-full ${step.done ? "bg-hero-lime" : "bg-white/20"}`}
                    />
                  ))}
                </span>
                <span aria-hidden>
                  {stepsDone} z {mission.steps.length}
                </span>
              </p>
            )}
          </div>
          {!ready && (
            <div className="mt-3 flex flex-col gap-2" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/10" />
              ))}
            </div>
          )}
          <ol className={`mt-3 flex flex-col gap-3 ${ready ? "" : "hidden"}`}>
            {mission.steps.map((step, index) => (
              <li key={`${step.href}-${index}`}>
                <MissionLink step={step} highlighted={index === firstUndone} />
                {!step.done && (step.alternative || step.note) && (
                  <p className="mt-1.5 px-2 text-xs text-paper/60">
                    {step.alternative && (
                      <Link
                        href={step.alternative.href}
                        className="mr-2 inline-flex min-h-8 items-center font-bold text-hero-cyan underline"
                      >
                        {step.alternative.label}
                      </Link>
                    )}
                    {step.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
          {ready && mission.bonus && (
            <div className="mt-4 border-t border-dashed border-white/20 pt-3">
              <p className="mb-2 text-xs font-bold tracking-wide text-hero-cyan uppercase">
                ⭐ Dla chętnych — nieobowiązkowe
              </p>
              <MissionLink step={mission.bonus} bonus />
            </div>
          )}
          {/* Dni nauki w tym tygodniu — bez serii: opuszczony dzień niczego nie kasuje. */}
          {ready && (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-3">
              <span className="text-xs font-bold tracking-wide text-paper/60 uppercase">Ten tydzień</span>
              <span className="flex gap-1.5">
                {week.map((done, index) => (
                  <span
                    key={index}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      done ? "bg-hero-lime text-night" : "bg-white/10 text-paper/45"
                    } ${index === todayIndex ? "ring-2 ring-hero-gold" : ""}`}
                    aria-label={`${DAY_LETTERS[index]}: ${done ? "była nauka" : "bez nauki"}`}
                  >
                    {DAY_LETTERS[index]}
                  </span>
                ))}
              </span>
              <span className="text-sm font-bold text-paper/80">
                {weekDone >= WEEK_GOAL_DAYS ? `${weekDone} dni — cel tygodnia zdobyty! 🏆` : `${weekDone} z ${WEEK_GOAL_DAYS} dni`}
              </span>
            </div>
          )}
          {ready && mission.done && (
            <p className="mt-3 text-sm text-paper/75">
              Na dziś wystarczy. Krótko i codziennie działa lepiej niż długo raz w tygodniu.
              {mission.bonus && !mission.bonus.done ? " Masz ochotę na więcej? Zadanie dla chętnych czeka." : ""}
            </p>
          )}
        </Card>

        {/* Powtórka słówek pomylonych po przerwie — tylko gdy jest co powtarzać. */}
        {toReview > 0 && !reviewInMission && (
          <Link
            href="/powtorka"
            className="flex items-center gap-3 rounded-2xl border border-hero-lime/40 bg-hero-lime/15 p-3 transition active:translate-y-0.5"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/20 text-2xl"
              aria-hidden
            >
              🔁
            </span>
            <span className="flex-1">
              <span className="block text-lg leading-tight font-black">Powtórka ({toReview})</span>
              <span className="text-sm text-paper/70">słowa i zwroty, które się ostatnio myliły</span>
            </span>
            <span aria-hidden className="text-xl">
              ▸
            </span>
          </Link>
        )}

        {/* Menu działów: jeden wzór kafelka dla wszystkiego, w dwóch grupach. */}
        <TileGroup
          id="dzial-dzwieki"
          emoji="🔤"
          title="Dźwięki i słowa"
          subtitle="czytanie po angielsku i słowa na co dzień"
          tiles={soundTiles}
        />
        <TileGroup
          id="dzial-akademia"
          emoji="🎒"
          title="Akademia"
          subtitle="szkoła po angielsku: liczenie, czytanie, polecenia"
          tiles={akademiaTiles}
        />

        {/* Drużyna w skrócie — pełna galeria (moce, co odblokowuje kogo) jest przy mapie dźwięków. */}
        <Link
          href="/dzwieki#druzyna"
          className="flex flex-col gap-3 rounded-blob border border-white/10 bg-white/5 p-4 transition hover:bg-white/10 active:translate-y-0.5"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-lg font-black">Drużyna</span>
            <span className="text-xs text-paper/65">
              {ligaReady ? `${unlockedHeroes}/${HEROES.length} bohaterów` : "…"} <span aria-hidden>▸</span>
            </span>
          </span>
          <span className="flex flex-wrap gap-x-2 gap-y-1" aria-hidden>
            {HEROES.map((hero) => {
              const unlocked = state.unlockedHeroes.includes(hero.id);
              return (
                <HeroAvatar
                  key={hero.id}
                  hero={hero}
                  size={role === "phone" ? 40 : 48}
                  dimmed={!unlocked}
                  emblem={unlocked ? undefined : "?"}
                />
              );
            })}
          </span>
        </Link>

        <div className="flex justify-center">
          <VoiceSpeedControl compact />
        </div>
      </div>

      {role === "desktop" && (
        <aside className="flex flex-col gap-4">
          <Card>
            <h2 className="mb-2 text-lg font-bold">Podgląd dla rodzica</h2>
            <p className="mb-1 text-xs font-bold tracking-wide text-paper/50 uppercase">Dźwięki</p>
            <dl className="space-y-1 text-sm text-paper/80">
              <div className="flex justify-between">
                <dt>Opanowane dźwięki</dt>
                <dd className="font-bold">{masteredCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Opanowane tematy</dt>
                <dd className="font-bold">{masteredTopics}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Sesje łącznie</dt>
                <dd className="font-bold">{state.sessions.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Zapisane próby</dt>
                <dd className="font-bold">{state.attempts.length}</dd>
              </div>
            </dl>
            <p className="mt-4 mb-1 text-xs font-bold tracking-wide text-paper/50 uppercase">
              Akademia
            </p>
            <dl className="space-y-1 text-sm text-paper/80">
              <div className="flex justify-between">
                <dt>Tabliczka płynnie</dt>
                <dd className="font-bold">{akademiaReady ? summary.fluent : "…"}/66</dd>
              </div>
              {lastMock && (
                <div className="flex justify-between">
                  <dt>Ostatni próbny test</dt>
                  <dd className="font-bold">{lastMock.score}/25</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Sesje łącznie</dt>
                <dd className="font-bold">{akademia.sessions.length}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <BigButton href="/rodzic" tone="quiet" full>
                Raport i ustawienia
              </BigButton>
            </div>
          </Card>
          <Card>
            <p className="mb-2 text-sm font-bold">Mapa tabliczki</p>
            <FactGrid facts={akademia.facts} compact />
          </Card>
          <Card className="text-sm text-paper/70">
            <p className="font-bold text-paper">Jak to działa</p>
            <p className="mt-2">
              Aplikacja sama decyduje, czy powtórzyć dźwięk, czy iść dalej — na podstawie
              wyników ostatnich sesji. W Akademii tak samo wybiera fakty tabliczki do powtórki.
              Progi widać w raporcie.
            </p>
          </Card>
        </aside>
      )}
    </div>
  );
}

/** Grupa działów: nagłówek i rząd jednakowych kafelków (2 kolumny na telefonie, 4 dalej). */
function TileGroup({
  id,
  emoji,
  title,
  subtitle,
  tiles,
}: {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  tiles: Tile[];
}) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={id}>
      <div className="flex items-end gap-3 border-b border-white/10 pb-2">
        <span className="text-3xl" aria-hidden>
          {emoji}
        </span>
        <div>
          <h2 id={id} className="text-2xl font-black">
            {title}
          </h2>
          <p className="text-sm text-paper/60">{subtitle}</p>
        </div>
      </div>
      {/* 6 kafelków: 3 w rzędzie (2 równe rzędy); 4 kafelki: 4 w rzędzie. */}
      <div className={`grid grid-cols-2 gap-3 ${tiles.length % 3 === 0 ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
        {tiles.map((tile) => (
          <MenuTile key={tile.href} tile={tile} />
        ))}
      </div>
    </section>
  );
}

/** Kafelek działu — ten sam wzór dla wszystkich ośmiu: ikona, nazwa, postęp. */
function MenuTile({ tile }: { tile: Tile }) {
  const tone = ACCENT[tile.accent];
  const percent = Math.round(Math.min(1, Math.max(0, tile.progress ?? 0)) * 100);
  return (
    <Link
      href={tile.href}
      className="flex min-h-40 flex-col items-center gap-2 rounded-blob border border-white/10 bg-white/5 p-4 text-center shadow-[0_6px_0_rgba(0,0,0,0.25)] transition hover:bg-white/10 active:translate-y-1 active:shadow-none"
    >
      <TileIcon className={tone.icon}>{tile.icon}</TileIcon>
      <span className="text-lg leading-tight font-black">{tile.title}</span>
      <span className="text-xs text-paper/65">{tile.detail}</span>
      {tile.progress !== undefined && (
        <span
          className="mt-auto block h-1.5 w-full max-w-28 overflow-hidden rounded-full bg-white/10"
          aria-hidden
        >
          <span className={`block h-full rounded-full ${tone.bar}`} style={{ width: `${percent}%` }} />
        </span>
      )}
    </Link>
  );
}

function TileIcon({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span
      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-paper text-4xl ring-4 ${className}`}
      aria-hidden
    >
      {children}
    </span>
  );
}

/** Krok misji — cały wiersz to jeden cel dotykowy (jak w misji Akademii). */
function MissionLink({
  step,
  highlighted = false,
  bonus = false,
}: {
  step: MissionStepView;
  highlighted?: boolean;
  bonus?: boolean;
}) {
  const tone = step.done
    ? "bg-hero-lime/15"
    : highlighted
      ? "bg-hero-blue shadow-[0_6px_0_#1c47b3] active:shadow-none"
      : bonus
        ? "border border-dashed border-hero-cyan/40 bg-white/5"
        : "bg-white/10";
  return (
    <Link
      href={step.href}
      className={`flex items-center gap-3 rounded-2xl transition active:translate-y-0.5 ${highlighted ? "p-4" : "p-3"} ${tone}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-black/20 ${highlighted ? "h-12 w-12 text-3xl" : "h-10 w-10 text-2xl"}`}
      >
        {step.done ? "✅" : step.emoji}
      </span>
      <span className="flex-1">
        <span className={`block leading-tight font-black ${highlighted ? "text-xl" : "text-lg"}`}>
          {step.title}
          {step.titleReading && (
            <>
              {" "}
              <span className="font-reading">{step.titleReading}</span>
            </>
          )}
        </span>
        <span className={`text-sm ${step.done ? "text-paper/55" : "text-paper/75"}`}>{step.subtitle}</span>
      </span>
      {/* Następny krok ma wyraźne „Start"; pozostałe — samą strzałkę. */}
      {highlighted ? (
        <span className="shrink-0 rounded-full bg-white px-4 py-2 text-base font-black text-hero-blue" aria-hidden>
          Start ▸
        </span>
      ) : (
        <span aria-hidden className={`text-xl ${step.done ? "text-paper/40" : ""}`}>
          {step.done ? "✓" : "▸"}
        </span>
      )}
    </Link>
  );
}
