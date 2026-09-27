import type { Metadata } from "next";

/** Tytuł karty zakładki — strona jest komponentem klienckim bez metadanych. */
export const metadata: Metadata = { title: "Jak pisać w zeszycie" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
