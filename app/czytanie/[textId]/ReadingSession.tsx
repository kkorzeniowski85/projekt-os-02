"use client";

import { SessionRunner } from "@/components/akademia/session/SessionRunner";
import { buildReadingSession, getReadingText } from "@/lib/akademia/curriculum/reading";

export function ReadingSession({ textId }: { textId: string }) {
  const text = getReadingText(textId)!;
  return (
    <SessionRunner
      module="reading"
      unitId={text.id}
      kind="lesson"
      title={text.titleEn}
      emoji={text.emoji}
      goalPl={text.titlePl}
      parentIntroPl={text.parentPl}
      startNotePl="Historię włączasz przyciskiem Start — można ją wstrzymać, zatrzymać i zacząć od początku oraz wybrać tempo. Każde zdanie i pytanie można też odsłuchać."
      exitHref="/czytanie/"
      exitLabel="Inne teksty"
      build={() => buildReadingSession(text)}
    />
  );
}
