import type { MetadataRoute } from "next";
import { TEST_MODE } from "@/lib/testMode";

// Na GitHub Pages aplikacja stoi w podkatalogu — adresy w manifeście muszą to
// uwzględniać, inaczej instalacja na telefonie prowadzi do pustej strony.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Build statyczny (output: export) wymaga tego wprost dla tras generowanych. */
export const dynamic = "force-static";

/**
 * Bez pola `id`, jak w dawnej Lidze Dźwięków: tożsamość instalacji liczy się
 * wtedy ze start_url, więc aplikacja zainstalowana na tablecie przed
 * połączeniem działów zostaje tą samą aplikacją — tylko z nową nazwą.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // Wersja testowa (lib/testMode.ts) ma się odróżniać już na ekranie głównym.
    name: TEST_MODE ? "Liga (test)" : "Liga",
    short_name: TEST_MODE ? "Liga (test)" : "Liga",
    description:
      "Dźwięki: czytanie po angielsku metodą phonics (sekwencja Read Write Inc.) i słownictwo. Akademia: tabliczka mnożenia, matematyka po angielsku, czytanie ze zrozumieniem i język klasy.",
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
