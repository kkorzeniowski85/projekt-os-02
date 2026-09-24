"use client";

/**
 * Ekran główny — "baza drużyny" z dwoma działami.
 *
 * Kolejność: misja na dziś (2 kroki + 1 dla chętnych, lib/dailyMission.ts),
 * potem dział Dźwięki (dotychczasowa strona główna Ligi Dźwięków: mapa
 * dźwięków, słowa i zwroty, drużyna), potem dział Akademia (kafelki hubów).
 *
 * Układ realnie się przebudowuje wg roli urządzenia (brief):
 *  - telefon: „szybka misja" + skrócona mapa dźwięków,
 *  - tablet: pełna mapa dźwięków, duże cele dotykowe,
 *  - komputer: dodatkowa kolumna dla rodzica (skrót postępu obu działów).
 *
 * Celowo bez odliczania do szkoły i bez dat — prośba rodzica: ekran dziecka
 * nie przypomina o przeprowadzce. Plan z datami jest w panelu rodzica.
 */

import Link from "next/link";
import { FactGrid } from "@/components/akademia/FactGrid";
import { HeroAvatar } from "@/components/HeroAvatar";
import { BigButton, Card } from "@/components/ui";
import { CLASSROOM_UNITS } from "@/lib/akademia/curriculum/classroom";
import { MATHS_TOPICS } from "@/lib/akademia/curriculum/maths";
import { READING_TEXTS } from "@/lib/akademia/curriculum/reading";
import { HEROES_BY_MODULE } from "@/lib/akademia/heroes";
import { useProgress as useAkademiaProgress } from "@/lib/akademia/progress/store";
import {
  unitKeyOf,
  type ModuleId,
  type ProgressState as AkademiaState,
} from "@/lib/akademia/progress/types";
import { tablesSummary } from "@/lib/akademia/tables/practice";
import { hasLesson } from "@/lib/curriculum/lessons";
import { getSound, SOUNDS, type Sound, type SoundSet } from "@/lib/curriculum/sounds";
import { TOPICS } from "@/lib/curriculum/vocab";
import { combinedMission, type MissionStepView } from "@/lib/dailyMission";
import { HEROES } from "@/lib/heroes";
import { recommendNextTopic } from "@/lib/progress/rules";
import { useProgress } from "@/lib/progress/store";
import type { SoundState, SoundStatus } from "@/lib/progress/types";
import { useDeviceRole } from "@/lib/useDeviceRole";

const SET_LABEL: Record<SoundSet, string> = {
  1: "Set 1 — litery i „special friends”",
  2: "Set 2 — 12 speed sounds",
  3: "Set 3 — dalsze dźwięki",
};

const STATUS_STYLE: Record<SoundStatus | "locked", string> = {
  mastered: "bg-hero-lime text-night",
  learning: "bg-hero-gold text-night",
  "needs-help": "bg-hero-pink text-white",
  new: "bg-white/15 text-paper",
  locked: "bg-white/5 text-paper/30",
};

function masteredIn(state: AkademiaState, module: ModuleId, ids: string[]): number {
  return ids.filter((id) => state.units[unitKeyOf(module, id)]?.status === "mastered").length;
}

export default function HomePage() {
  const { role } = useDeviceRole();
  const { state, ready: ligaReady } = useProgress();
  const { state: akademia, ready: akademiaReady } = useAkademiaProgress();
  // Misja bierze kroki z obu działów — pokazujemy ją dopiero z kompletem danych.
  const ready = ligaReady && akademiaReady;

  const mission = combinedMission(state, akademia);
  const firstUndone = mission.steps.findIndex((step) => !step.done);

  const masteredCount = Object.values(state.sounds).filter(
    (sound) => sound.status === "mastered",
  ).length;

  const topicRecommendation = recommendNextTopic(state);
  const masteredTopics = Object.values(state.topics).filter(
    (topic) => topic.status === "mastered",
  ).length;

  const summary = tablesSummary(akademia.facts);
  const lastMock = akademia.mocks[akademia.mocks.length - 1];

  const modules: { module: ModuleId; href: string; title: string; detail: string }[] = [
    {
      module: "tables",
      href: "/tabliczka/",
      title: "Tabliczka",
      detail: akademiaReady ? `⚡ ${summary.fluent}/66 płynnie` : "…",
    },
    {
      module: "maths",
      href: "/matematyka/",
      title: "Matematyka po angielsku",
      detail: akademiaReady
        ? `${masteredIn(akademia, "maths", MATHS_TOPICS.map((t) => t.id))}/${MATHS_TOPICS.length} opanowane`
        : "…",
    },
    {
      module: "reading",
      href: "/czytanie/",
      title: "Czytanie",
      detail: akademiaReady
        ? `${masteredIn(akademia, "reading", READING_TEXTS.map((t) => t.id))}/${READING_TEXTS.length} opanowane`
        : "…",
    },
    {
      module: "tasks",
      href: "/polecenia/",
      title: "Język klasy",
      detail: akademiaReady
        ? `${masteredIn(akademia, "tasks", CLASSROOM_UNITS.map((u) => u.id))}/${CLASSROOM_UNITS.length} opanowane`
        : "…",
    },
  ];

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
          <p className="text-sm font-bold tracking-wide text-hero-gold uppercase">
            {ready && mission.done
              ? "Misja na dziś wykonana! 🎉"
              : role === "phone"
                ? "Szybka misja"
                : "Misja na dziś"}
          </p>
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
          {ready && mission.done && (
            <p className="mt-3 text-sm text-paper/75">
              Na dziś wystarczy. Krótko i codziennie działa lepiej niż długo raz w tygodniu.
              {mission.bonus && !mission.bonus.done ? " Masz ochotę na więcej? Zadanie dla chętnych czeka." : ""}
            </p>
          )}
        </Card>

        {/* Dział Dźwięki — dotychczasowa strona główna Ligi Dźwięków. */}
        <section className="flex flex-col gap-6" aria-labelledby="dzial-dzwieki">
          <SectionTitle id="dzial-dzwieki" emoji="🔤" title="Dźwięki" subtitle="czytanie po angielsku i słowa na co dzień" />

          {/* Tor 1: czytanie / phonics */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-bold">Mapa dźwięków (RWI)</h3>
            {([1, 2, 3] as SoundSet[]).map((set) => (
              <SoundSetRow
                key={set}
                set={set}
                sounds={SOUNDS.filter((sound) => sound.set === set)}
                statuses={state.sounds}
                compact={role === "phone"}
              />
            ))}
            <p className="text-xs text-paper/60">
              Wszystkie 60 dźwięków ma gotowe sesje — można grać w dowolnej kolejności, choć
              kolejność RWI (od lewej do prawej) ma sens. Lekcje pojedynczych liter nie uczą
              kształtu litery (to dziecko zna z polskiego), tylko tego, JAK BRZMI PO ANGIELSKU
              — przy 11 z 25 polski nawyk myli, np. „w”, „y”, „j” i „c” to zupełnie inne dźwięki.
            </p>
          </div>

          {/* Tor 2: słuchanie i słownictwo */}
          <Card className="border-hero-cyan/40 bg-hero-cyan/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-bold">Słowa i zwroty</h3>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-paper/70">
                {masteredTopics} z {TOPICS.length} tematów
              </span>
            </div>
            <p className="mt-1 mb-4 text-sm text-paper/70">
              Drugi tor: rozumienie ze słuchu, zwroty i kolokacje. Bez czytania — pytaniem jest
              nagranie, odpowiedzią obrazek. {topicRecommendation.labelPl}
            </p>
            <div className="flex flex-wrap gap-3">
              <BigButton href={`/slownictwo/${topicRecommendation.topicId}`}>
                {topicRecommendation.reason === "repeat-hard"
                  ? "Powtórka"
                  : topicRecommendation.reason === "refresh"
                    ? "Przypomnij sobie"
                    : "Zaczynamy!"}
              </BigButton>
              <BigButton href="/slownictwo" tone="quiet">
                Wszystkie tematy
              </BigButton>
              <BigButton href="/rymowanki" tone="quiet">
                🎵 Rymowanki
              </BigButton>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-bold">Drużyna</h3>
            <div className="flex flex-wrap gap-4">
              {HEROES.map((hero) => {
                const unlocked = state.unlockedHeroes.includes(hero.id);
                return (
                  <div key={hero.id} className="flex w-36 flex-col items-center text-center">
                    <HeroAvatar
                      hero={hero}
                      size={90}
                      dimmed={!unlocked}
                      emblem={unlocked ? undefined : "?"}
                    />
                    <p className="text-sm font-bold">{unlocked ? hero.codename : "???"}</p>
                    <p className="text-xs text-paper/50">
                      {unlocked
                        ? hero.power
                        : typeof hero.unlockedBy === "object"
                          ? `Odblokuj: dźwięk ${getSound(hero.unlockedBy.soundId)?.grapheme ?? ""}`
                          : ""}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-paper/50">
              Imiona postaci są robocze — do wymyślenia razem z dzieckiem (plik lib/heroes.ts).
            </p>
          </div>
        </section>

        {/* Dział Akademia — kafelki hubów, jak na stronie głównej Akademii Ligi. */}
        <section className="flex flex-col gap-4" aria-labelledby="dzial-akademia">
          <SectionTitle
            id="dzial-akademia"
            emoji="🎓"
            title="Akademia"
            subtitle="tabliczka, matematyka, czytanie i język klasy"
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {modules.map(({ module, href, title, detail }) => {
              const hero = HEROES_BY_MODULE[module];
              return (
                <Link
                  key={module}
                  href={href}
                  className="flex flex-col items-center gap-2 rounded-blob border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10 active:translate-y-0.5"
                >
                  <HeroAvatar hero={hero} size={role === "phone" ? 64 : 84} />
                  <span className="text-xs font-bold text-hero-cyan">{hero.codename}</span>
                  <span className="text-lg leading-tight font-black">{title}</span>
                  <span className="text-xs text-paper/65">{detail}</span>
                </Link>
              );
            })}
          </div>
        </section>
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

function SectionTitle({
  id,
  emoji,
  title,
  subtitle,
}: {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-end gap-3 border-b border-white/10 pb-2">
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <div>
        <h2 id={id} className="text-2xl font-black sm:text-3xl">
          {title}
        </h2>
        <p className="text-sm text-paper/60">{subtitle}</p>
      </div>
    </div>
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
      ? "bg-hero-blue"
      : bonus
        ? "border border-dashed border-hero-cyan/40 bg-white/5"
        : "bg-white/10";
  return (
    <Link
      href={step.href}
      className={`flex items-center gap-3 rounded-2xl p-3 transition active:translate-y-0.5 ${tone}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/20 text-2xl">
        {step.done ? "✅" : step.emoji}
      </span>
      <span className="flex-1">
        <span className="block text-lg leading-tight font-black">
          {step.title}
          {step.titleReading && (
            <>
              {" "}
              <span className="font-reading">{step.titleReading}</span>
            </>
          )}
        </span>
        <span className="text-sm text-paper/70">{step.subtitle}</span>
      </span>
      <span aria-hidden className="text-xl">
        ▸
      </span>
    </Link>
  );
}

function SoundSetRow({
  set,
  sounds,
  statuses,
  compact,
}: {
  set: SoundSet;
  sounds: Sound[];
  statuses: Record<string, SoundState>;
  compact: boolean;
}) {
  // Na telefonie mapa ma być skrótem, nie ścianą kafelków.
  const visible = compact
    ? sounds.filter((sound) => hasLesson(sound.id) || sound.kind !== "single-letter")
    : sounds;

  return (
    <Card>
      <p className="mb-3 text-sm font-bold text-paper/70">{SET_LABEL[set]}</p>
      <div className="flex flex-wrap gap-2">
        {visible.map((sound) => {
          const playable = hasLesson(sound.id);
          const status = statuses[sound.id]?.status ?? "new";
          const style = playable ? STATUS_STYLE[status] : STATUS_STYLE.locked;
          const label = (
            <span className="font-reading text-lg font-black">{sound.grapheme}</span>
          );

          return playable ? (
            <Link
              key={sound.id}
              href={`/sesja/${sound.id}`}
              className={`flex min-w-14 items-center justify-center rounded-xl px-3 py-2 ${style}`}
              title={`${sound.grapheme} — ${sound.example}`}
            >
              {label}
            </Link>
          ) : (
            <span
              key={sound.id}
              className={`flex min-w-14 items-center justify-center rounded-xl px-3 py-2 ${style}`}
              title={`${sound.grapheme} — wkrótce`}
            >
              {label}
            </span>
          );
        })}
      </div>
    </Card>
  );
}
