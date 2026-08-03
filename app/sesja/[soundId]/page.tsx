import { notFound } from "next/navigation";
import { SessionRunner } from "@/components/session/SessionRunner";
import { getLesson, LESSONS } from "@/lib/curriculum/lessons";
import { getSound } from "@/lib/curriculum/sounds";

/** Sesje istnieją tylko dla dźwięków, które mają przygotowaną lekcję. */
export function generateStaticParams() {
  return Object.keys(LESSONS).map((soundId) => ({ soundId }));
}

/** Build statyczny: żadnych tras poza wygenerowanymi wyżej. */
export const dynamicParams = false;

export default async function SessionPage({
  params,
}: {
  params: Promise<{ soundId: string }>;
}) {
  const { soundId } = await params;
  const sound = getSound(soundId);
  const lesson = getLesson(soundId);

  if (!sound || !lesson) notFound();

  return <SessionRunner sound={sound} lesson={lesson} />;
}
