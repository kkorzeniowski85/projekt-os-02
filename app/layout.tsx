import type { Metadata, Viewport } from "next";
import { Andika } from "next/font/google";
import { ProgressProvider } from "@/lib/progress/store";
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
  title: "Liga Dźwięków",
  description: "Nauka czytania po angielsku metodą phonics (Read Write Inc.)",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Liga Dźwięków" },
};

export const viewport: Viewport = {
  themeColor: "#10163a",
  // Blokada zoomu przy podwójnym stuknięciu — dziecko dużo stuka w karty.
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`h-full ${andika.variable}`}>
      <body className="min-h-dvh antialiased">
        <ProgressProvider>
          <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">{children}</main>
        </ProgressProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
