import type { MetadataRoute } from "next";

// Na GitHub Pages aplikacja stoi w podkatalogu — adresy w manifeście muszą to
// uwzględniać, inaczej instalacja na telefonie prowadzi do pustej strony.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Build statyczny (output: export) wymaga tego wprost dla tras generowanych. */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Liga Dźwięków — angielski przez phonics",
    short_name: "Liga Dźwięków",
    description:
      "Nauka czytania po angielsku metodą synthetic phonics (sekwencja Read Write Inc.)",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    orientation: "any",
    background_color: "#10163a",
    theme_color: "#10163a",
    lang: "pl",
    icons: [
      { src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: `${base}/icon-maskable.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
