"use client";

/**
 * Ekran główny — "baza drużyny".
 *
 * Układ realnie się przebudowuje wg roli urządzenia (brief):
 *  - telefon: jedna rekomendacja + skrócona mapa dźwięków ("szybka misja"),
 *  - tablet: pełna mapa dźwięków, duże cele dotykowe,
 *  - komputer: dodatkowa kolumna dla rodzica (skrót postępu + wejście w raport).
 */

import Link from "next/link";
import { HeroAvatar } from "@/components/HeroAvatar";
import { BigButton, Card } from "@/components/ui";
import { hasLesson } from "@/lib/curriculum/lessons";
import { getSound, SOUNDS, type Sound, type SoundSet } from "@/lib/curriculum/sounds";
import { TOPICS } from "@/lib/curriculum/vocab";
import { HEROES } from "@/lib/heroes";
import { recommendNext, recommendNextTopic } from "@/lib/progress/rules";
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

export default function HomePage() {
  const { role } = useDeviceRole();
  const { state, ready } = useProgress();

  const recommendation = recommendNext(state);
  const recommendedSound = getSound(recommendation.soundId);
  const masteredCount = Object.values(state.sounds).filter(
    (sound) => sound.status === "mastered",
  ).length;

  const topicRecommendation = recommendNextTopic(state);
  const masteredTopics = Object.values(state.topics).filter(
    (topic) => topic.status === "mastered",
  ).length;

  return (
    <div className={role === "desktop" ? "grid grid-cols-[1fr_340px] gap-8" : "flex flex-col gap-6"}>
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">Liga Dźwięków</h1>
            <p className="text-sm text-paper/60">
              {ready ? `Drużyna: ${state.childName}` : "Wczytywanie…"}
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

        {/* Rekomendacja z warstwy reguł — jedno wyraźne "co teraz". */}
        {recommendedSound && (
          <Card className="border-hero-gold/40 bg-hero-gold/10">
            <p className="text-sm font-bold tracking-wide text-hero-gold uppercase">
              {role === "phone" ? "Szybka misja" : "Misja na dziś"}
            </p>
            <p className="mt-1 mb-4 text-2xl font-black">
              Dźwięk{" "}
              <span className="font-reading text-hero-gold">{recommendedSound.grapheme}</span>
              {recommendedSound.variantNote && (
                <span className="ml-2 text-base font-normal text-paper/60">
                  {recommendedSound.variantNote}
                </span>
              )}
            </p>
            <BigButton href={`/sesja/${recommendation.soundId}`} full>
              {recommendation.reason === "repeat-hard"
                ? "Powtórka"
                : recommendation.reason === "refresh"
                  ? "Przypomnij sobie"
                  : "Zaczynamy!"}
            </BigButton>
            <p className="mt-3 text-xs text-paper/60">{recommendation.labelPl}</p>
          </Card>
        )}

        {/* Tor 1: czytanie / phonics */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Mapa dźwięków (RWI)</h2>
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
        </section>

        {/* Tor 2: słuchanie i słownictwo */}
        <Card className="border-hero-cyan/40 bg-hero-cyan/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Słowa i zwroty</h2>
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
          </div>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Drużyna</h2>
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
        </section>
      </div>

      {role === "desktop" && (
        <aside className="flex flex-col gap-4">
          <Card>
            <h2 className="mb-2 text-lg font-bold">Podgląd dla rodzica</h2>
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
            <div className="mt-4">
              <BigButton href="/rodzic" tone="quiet" full>
                Raport i ustawienia
              </BigButton>
            </div>
          </Card>
          <Card className="text-sm text-paper/70">
            <p className="font-bold text-paper">Jak to działa</p>
            <p className="mt-2">
              Aplikacja sama decyduje, czy powtórzyć dźwięk, czy iść dalej — na podstawie
              wyników ostatnich sesji. Progi widać w raporcie.
            </p>
          </Card>
        </aside>
      )}
    </div>
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
