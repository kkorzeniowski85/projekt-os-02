/**
 * Wersja książeczki do druku — widoczna tylko na wydruku (hidden print:block;
 * reguły @page w app/globals.css: A5, białe tło).
 *
 * Jedna strona historyjki = jedna kartka: duży tekst u góry, pod nim ramka na
 * rysunek. Dziecko czyta stronę i rysuje, co przeczytało — rysunek pokazuje,
 * czy tekst został zrozumiany, a zajęcie ręki wydłuża uwagę. Okładka powtarza
 * rozgrzewkę z ekranu; ostatnia kartka to pytania dla rodzica.
 *
 * Red words na papierze są czerwone i podkreślone (na drukarce czarno-białej
 * zostaje podkreślenie). Wymiary w milimetrach, bo ekranowe rem na wydruku
 * bywają zaokrąglane inaczej w każdej przeglądarce.
 */

import { type Book } from "@/lib/curriculum/books";

function PageText({ text, red }: { text: string; red: Set<string> }) {
  return (
    <p className="font-reading" style={{ fontSize: "24pt", lineHeight: 1.35, fontWeight: 700 }}>
      {text.split(/\s+/).map((word, index) => {
        const bare = word.toLowerCase().replace(/[^a-z]/g, "");
        const isRed = red.has(bare);
        return (
          <span
            key={index}
            style={isRed ? { color: "#c0392b", textDecoration: "underline" } : undefined}
          >
            {word}
            {index < text.split(/\s+/).length - 1 ? " " : ""}
          </span>
        );
      })}
    </p>
  );
}

export function BookPrint({ book }: { book: Book }) {
  const red = new Set(book.redWords.map((word) => word.toLowerCase()));

  return (
    <div className="hidden text-black print:block">
      {/* Okładka */}
      <section className="break-after-page" style={{ textAlign: "center" }}>
        <p style={{ fontSize: "48pt", margin: "8mm 0 4mm" }} aria-hidden>
          {book.emoji}
        </p>
        <h1 className="font-reading" style={{ fontSize: "30pt", fontWeight: 900, margin: 0 }}>
          {book.titleEn}
        </h1>
        <p style={{ fontSize: "14pt", margin: "2mm 0 10mm" }}>{book.titlePl}</p>
        <div style={{ textAlign: "left", fontSize: "11pt" }}>
          <h2 style={{ fontSize: "14pt", margin: "0 0 3mm" }}>Zanim przeczytasz</h2>
          <p style={{ margin: "0 0 3mm" }}>
            <strong>Dźwięki</strong> — powiedz każdy:
            <br />
            <span className="font-reading" style={{ fontSize: "22pt", fontWeight: 700 }}>
              {book.focusGraphemes.join("   ")}
            </span>
          </p>
          <p style={{ margin: "0 0 3mm" }}>
            <strong>Zielone słowa</strong> — sklej z dźwięków:
            <br />
            <span className="font-reading" style={{ fontSize: "20pt", fontWeight: 700 }}>
              {book.greenWords.join("   ")}
            </span>
          </p>
          <p style={{ margin: "0 0 6mm" }}>
            <strong>Słowa-łobuzy</strong> — przeczytaj w całości, bez sklejania:
            <br />
            <span
              className="font-reading"
              style={{ fontSize: "20pt", fontWeight: 700, color: "#c0392b", textDecoration: "underline" }}
            >
              {book.redWords.join("   ")}
            </span>
          </p>
          <p style={{ fontSize: "10pt", color: "#555" }}>
            Przeczytaj stronę, potem narysuj w ramce, co przeczytałeś. Na końcu porozmawiajcie o
            pytaniach.
          </p>
        </div>
      </section>

      {/* Strony historyjki */}
      {book.pages.map((page, index) => (
        <section
          key={index}
          className="break-after-page"
          style={{ display: "flex", flexDirection: "column", minHeight: "180mm" }}
        >
          <PageText text={page.en} red={red} />
          <div
            aria-hidden
            style={{
              flex: 1,
              minHeight: "105mm",
              margin: "6mm 0 4mm",
              border: "1.5pt dashed #999",
              borderRadius: "6mm",
            }}
          />
          <p style={{ fontSize: "10pt", color: "#777", textAlign: "center", margin: 0 }}>
            {index + 1} / {book.pages.length}
          </p>
        </section>
      ))}

      {/* Pytania */}
      <section>
        <h2 style={{ fontSize: "16pt", margin: "0 0 4mm" }}>Porozmawiajcie</h2>
        <ol style={{ paddingLeft: "6mm", fontSize: "12pt" }}>
          {book.questions.map((question) => (
            <li key={question.en} style={{ marginBottom: "5mm" }}>
              <span className="font-reading" style={{ fontSize: "15pt", fontWeight: 700 }}>
                {question.en}
              </span>
              <br />
              <span style={{ color: "#555" }}>{question.pl}</span>
            </li>
          ))}
        </ol>
        <p style={{ fontSize: "10pt", color: "#777", marginTop: "8mm" }}>
          Liga · książeczka do dekodowania · dźwięki: {book.focusGraphemes.join(", ")}
        </p>
      </section>
    </div>
  );
}
