import { notFound } from "next/navigation";
import { ScenkiList } from "@/components/session/ScenkiList";
import { getTopic, TOPICS } from "@/lib/curriculum/vocab";
import { phraseScene } from "@/lib/curriculum/vocabParent";

/** Strona scenek tylko dla tematów, które mają choć jedną scenkę. */
export function generateStaticParams() {
  return TOPICS.filter((topic) =>
    topic.phrases.some((phrase) => phraseScene(phrase.en).length > 0),
  ).map((topic) => ({ topicId: topic.id }));
}

/** Build statyczny: żadnych tras poza wygenerowanymi wyżej. */
export const dynamicParams = false;

export default async function TopicScenesPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const topic = getTopic(topicId);

  if (!topic) notFound();

  return <ScenkiList topic={topic} />;
}
