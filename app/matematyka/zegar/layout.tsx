import type { Metadata } from "next";

/** Tytuł karty ściągi zegara — strona jest komponentem klienckim bez metadanych. */
export const metadata: Metadata = { title: "Zegar po angielsku" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
