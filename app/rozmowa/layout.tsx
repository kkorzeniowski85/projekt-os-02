import type { Metadata } from "next";

/** Tytuł karty działu — strona jest komponentem klienckim bez metadanych. */
export const metadata: Metadata = { title: "Rozmowa" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
