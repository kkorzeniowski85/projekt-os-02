import type { Metadata } from "next";

/** Tytuł karty — strona panelu jest komponentem klienckim bez metadanych. */
export const metadata: Metadata = { title: "Panel rodzica" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
