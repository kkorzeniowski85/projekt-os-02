import type { Metadata, Viewport } from "next";
import { Andika } from "next/font/google";
import { ProgressProvider as LigaProgressProvider } from "@/lib/progress/store";
import { ProgressProvider as AkademiaProgressProvider } from "@/lib/akademia/progress/store";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

/**
 * Font czytelniczy (klasa `font-reading`) dla angielskiego tekstu, który
 * dziecko czyta. Andika jest projektowana pod wczesną naukę czytania —
 * jednopiętrowe "a", proste "g", wyraźnie różne b/d. next/font wbudowuje pliki
 * w build, więc działa offline i bez zapytań do Google w czasie działania.
 */
const andika = Andika({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  variable: "--font-andika",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Liga", template: "%s · Liga" },
  description:
    "Liga: czytanie po angielsku metodą phonics i słownictwo (dział Dźwięki) oraz tabliczka mnożenia, matematyka po angielsku, czytanie ze zrozumieniem i język klasy (dział Akademia)",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Liga" },
};

export const viewport: Viewport = {
  themeColor: "#10163a",
  // Blokada zoomu przy podwójnym stuknięciu — dziecko dużo stuka w karty.
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * Jedna aplikacja, dwa silniki: dział Dźwięki (dawna Liga Dźwięków) i dział
 * Akademia (dawna Akademia Ligi) mają własne magazyny postępu, własną
 * synchronizację i własne klucze w localStorage — dokładnie te same co w
 * osobnych aplikacjach, więc powrót do nich niczego nie gubi (docs/polaczenie.md).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`h-full ${andika.variable}`}>
      <body className="min-h-dvh antialiased">
        <LigaProgressProvider>
          <AkademiaProgressProvider>
            <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">{children}</main>
          </AkademiaProgressProvider>
        </LigaProgressProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
