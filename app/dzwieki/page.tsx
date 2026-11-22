"use client";

/**
 * 🔤 Dźwięki — mapa dźwięków RWI (tor czytania) i drużyna bohaterów.
 *
 * Do 2026-11-22 mapa leżała na ekranie głównym i zajmowała dwa ekrany tabletu;
 * teraz ekran główny to misja + jednakowe kafelki działów, a mapa jest tutaj,
 * pod kafelkiem „Dźwięki” (prośba rodzica: działy były „każdy gdzie indziej i
 * wyglądały inaczej”). Drużyna jest tu, bo bohaterów odblokowują dźwięki.
 *
 * Układ wg roli urządzenia: na telefonie mapa jest skrótem (bez liter, które
 * nie mają lekcji), na tablecie i komputerze — pełna.
 */

import Link from "next/link";
import { HeroAvatar } from "@/components/HeroAvatar";
import { Card } from "@/components/ui";
import { hasLesson } from "@/lib/curriculum/lessons";
import { getSound, SET_LABEL, SOUNDS, type Sound, type SoundSet } from "@/lib/curriculum/sounds";
import { HEROES } from "@/lib/heroes";
import { useProgress } from "@/lib/progress/store";
import type { SoundState, SoundStatus } from "@/lib/progress/types";
import { useDeviceRole } from "@/lib/useDeviceRole";

const STATUS_STYLE: Record<SoundStatus | "locked", string> = {
  mastered: "bg-hero-lime text-night",
  learning: "bg-hero-gold text-night",
  "needs-help": "bg-hero-pink text-white",
  new: "bg-white/15 text-paper",
  locked: "bg-white/5 text-paper/30",
};

const LEGEND: { status: SoundStatus; label: string }[] = [
  { status: "new", label: "nowy" },
  { status: "learning", label: "w trakcie" },
  { status: "mastered", label: "opanowany" },
  { status: "needs-help", label: "do powtórki" },
];

export default function SoundsPage() {
  const { role } = useDeviceRole();
  const { state, ready } = useProgress();
  const masteredCount = Object.values(state.sounds).filter(
    (sound) => sound.status === "mastered",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Dźwięki</h1>
          <p className="text-sm text-paper/60">
            {ready ? `Opanowane dźwięki: ${masteredCount} z ${SOUNDS.length}` : "Wczytywanie…"}
          </p>
        </div>
        <Link href="/" className="flex min-h-11 items-center rounded-full bg-white/10 px-5 text-sm">
          ← Baza
        </Link>
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="mapa-dzwiekow">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <h2 id="mapa-dzwiekow" className="text-xl font-bold">
            Mapa dźwięków (RWI)
          </h2>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-paper/70" aria-label="Legenda kolorów">
            {LEGEND.map(({ status, label }) => (
              <li key={status} className="flex items-center gap-1.5">
                <span className={`inline-block h-3 w-3 rounded ${STATUS_STYLE[status]}`} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
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

      <section id="druzyna" className="flex flex-col gap-3" aria-labelledby="druzyna-tytul">
        <h2 id="druzyna-tytul" className="text-xl font-bold">
          Drużyna
        </h2>
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
          const label = <span className="font-reading text-lg font-black">{sound.grapheme}</span>;

          return playable ? (
            <Link
              key={sound.id}
              // ?z=mapa: „← Wróć" na ekranie lekcji wraca tutaj, nie do bazy.
              href={`/sesja/${sound.id}?z=mapa`}
              className={`flex min-h-11 min-w-14 items-center justify-center rounded-xl px-3 py-2 ${style}`}
              title={`${sound.grapheme} — ${sound.example}`}
            >
              {label}
            </Link>
          ) : (
            <span
              key={sound.id}
              className={`flex min-h-11 min-w-14 items-center justify-center rounded-xl px-3 py-2 ${style}`}
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
