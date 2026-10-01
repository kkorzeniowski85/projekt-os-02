"use client";

/**
 * Kafelki słowa do sklejania — w KOLEJNOŚCI ZAPISU, także przy split digraph.
 *
 * Dane lekcji trzymają dźwięki: cake = ["c", "a-e", "k"]. Dawniej kafelki
 * pokazywały je wprost („c | a-e | k”), czyli zapis, którego nie ma — dziecko
 * mogło utrwalić „caek”. Uwaga rodzica (2026-10-01). Teraz słowo wygląda tak,
 * jak się je pisze: c | a | k | e, a „a” i „e” łączy złoty łuk pod spodem
 * (tak w brytyjskich szkołach oznacza się split digraph przy „sound
 * buttons”). Stuknięcie „a” albo „e” gra JEDEN dźwięk /eɪ/ i zapala oba —
 * liczą się dźwięki, nie kafelki (Fred Talk: c-ay-k → cake).
 *
 * Gdzie stoi „e”: zawsze na końcu słowa — ta sama zasada, którą audyt
 * (scripts/audit-lessons.mjs, spellFromGraphemes) sprawdza dla każdego słowa.
 */

type Tile = {
  label: string;
  /** Indeks dźwięku w card.graphemes — dwa kafelki split digraph mają ten sam. */
  sound: number;
  part: "whole" | "head" | "tail";
};

export function splitIndex(graphemes: readonly string[]): number {
  return graphemes.findIndex((grapheme) => grapheme.includes("-"));
}

function tilesOf(graphemes: readonly string[]): Tile[] {
  const tiles: Tile[] = [];
  let tail: Tile | null = null;
  graphemes.forEach((grapheme, sound) => {
    if (grapheme.includes("-")) {
      const [head, end] = grapheme.split("-");
      tiles.push({ label: head, sound, part: "head" });
      tail = { label: end, sound, part: "tail" };
    } else {
      tiles.push({ label: grapheme, sound, part: "whole" });
    }
  });
  if (tail) tiles.push(tail);
  return tiles;
}

export function WordTiles({
  graphemes,
  targetIndex,
  tapped = [],
  onTap,
}: {
  graphemes: readonly string[];
  targetIndex: number;
  /** Indeksy dźwięków już stukniętych (przyciemnione). */
  tapped?: readonly number[];
  onTap: (sound: number, grapheme: string) => void;
}) {
  const tiles = tilesOf(graphemes);
  const split = splitIndex(graphemes);
  const headColumn = tiles.findIndex((tile) => tile.part === "head");
  const tailColumn = tiles.findIndex((tile) => tile.part === "tail");

  return (
    <div
      className="grid justify-center gap-x-2 gap-y-1 sm:gap-x-3"
      style={{ gridTemplateColumns: `repeat(${tiles.length}, auto)` }}
      role="group"
      aria-label={`Kafelki słowa: ${tiles.map((tile) => tile.label).join(" ")}`}
    >
      {tiles.map((tile, column) => {
        const isTarget = tile.sound === targetIndex;
        const isTapped = tapped.includes(tile.sound);
        // Pojedyncza litera ma stałą szerokość — łuk mierzy się od środka
        // kafelka (mx-7 / sm:mx-10 = połowa szerokości).
        const single = tile.label.length === 1;
        return (
          <button
            key={`${tile.label}-${column}`}
            type="button"
            onClick={() => onTap(tile.sound, graphemes[tile.sound])}
            aria-label={tile.part === "whole" ? tile.label : `${graphemes[tile.sound]} (jeden dźwięk)`}
            className={`font-reading flex items-center justify-center rounded-2xl py-3 text-3xl font-black transition active:translate-y-1 sm:py-4 sm:text-4xl ${
              single ? "w-14 sm:w-20" : "min-w-14 px-3 sm:min-w-20 sm:px-5"
            } ${
              isTarget
                ? "bg-hero-gold text-night shadow-[0_6px_0_#c99a1f]"
                : "bg-white/15 text-paper shadow-[0_6px_0_rgba(0,0,0,0.3)]"
            } ${isTapped ? "opacity-60" : ""}`}
            style={{ gridColumn: column + 1, gridRow: 1 }}
          >
            {tile.label}
          </button>
        );
      })}
      {split >= 0 && headColumn >= 0 && tailColumn > headColumn && (
        <div
          aria-hidden
          className="mx-7 h-4 rounded-b-full border-4 border-t-0 border-hero-gold sm:mx-10 sm:h-5"
          style={{ gridColumn: `${headColumn + 1} / ${tailColumn + 2}`, gridRow: 2 }}
        />
      )}
    </div>
  );
}
