import { notFound } from "next/navigation";
import { VocabRunner } from "@/components/session/VocabRunner";
import { getTopic, TOPICS } from "@/lib/curriculum/vocab";

/** Sesje istnieją tylko dla tematów, które są w danych. */
export function generateStaticParams() {
  return TOPICS.map((topic) => ({ topicId: topic.id }));
}

/** Build statyczny: żadnych tras poza wygenerowanymi wyżej. */
export const dynamicParams = false;

export default async function TopicSessionPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const topic = getTopic(topicId);

  if (!topic) notFound();

  return <VocabRunner topic={topic} />;
}
