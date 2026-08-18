"use client";

/**
 * Mapa tematów toru 2.
 *
 * Kolejność kafelków to kolejność PILNOŚCI, nie trudności — dlatego zamiast
 * blokad jest numeracja i wyraźna rekomendacja „zacznij tutaj". Wszystkie
 * tematy są otwarte od początku: rodzic, który wie, że dziecko jutro idzie do
 * szkoły, ma móc wejść od razu w „Kiedy coś boli", nie przechodząc reszty.
 */

import Link from "next/link";
import { BigButton, Card } from "@/components/ui";
import { TOPICS, topicSize } from "@/lib/curriculum/vocab";
import { recommendNextTopic } from "@/lib/progress/rules";
import { useProgress } from "@/lib/progress/store";
import type { TopicStatus } from "@/lib/progress/types";
import { useDeviceRole } from "@/lib/useDeviceRole";

const STATUS_STYLE: Record<TopicStatus, string> = {
  mastered: "bg-hero-lime text-night",
  learning: "bg-hero-gold text-night",
  "needs-help": "bg-hero-pink text-white",
  new: "bg-white/15 text-paper",
};

const STATUS_LABEL: Record<TopicStatus, string> = {
  mastered: "opanowany",
  learning: "w trakcie",
  "needs-help": "trudny",
  new: "nowy",
};

export default function VocabHomePage() {
  const { role } = useDeviceRole();
  const { state, ready } = useProgress();

  const recommendation = recommendNextTopic(state);
  const masteredCount = Object.values(state.topics).filter(
    (topic) => topic.status === "mastered",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Słowa i zwroty</h1>
          <p className="text-sm text-paper/60">
            {ready
              ? `Opanowane tematy: ${masteredCount} z ${TOPICS.length}`
              : "Wczytywanie…"}
          </p>
        </div>
        <Link
          href="/"
          className="flex min-h-11 items-center rounded-full bg-white/10 px-5 text-sm"
        >
          ← Baza
        </Link>
      </header>

      <Card className="border-hero-gold/40 bg-hero-gold/10">
        <p className="text-sm font-bold tracking-wide text-hero-gold uppercase">
          {role === "phone" ? "Szybka misja" : "Misja na dziś"}
        </p>
        <p className="mt-1 mb-4 text-2xl font-black">{recommendation.labelPl}</p>
        <BigButton href={`/slownictwo/${recommendation.topicId}`} full>
          {recommendation.reason === "repeat-hard" ? "Powtórka" : "Zaczynamy!"}
        </BigButton>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Tematy</h2>
        <p className="text-xs text-paper/60">
          Kolejność to kolejność pilności, a nie trudności: pierwsze cztery tematy to
          przetrwanie w szkole. Wszystkie są otwarte — jeśli dziecko jutro idzie do szkoły,
          zacznijcie od „Ratunek!”, a resztę róbcie po kolei.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {TOPICS.map((topic, position) => {
            const status = state.topics[topic.id]?.status ?? "new";
            const sessions = state.topics[topic.id]?.sessions ?? 0;
            return (
              <Link
                key={topic.id}
                href={`/slownictwo/${topic.id}`}
                className="rounded-blob border border-white/10 bg-white/5 p-5 transition active:translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <span className="text-5xl" aria-hidden>
                    {topic.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-paper/40">{position + 1}</span>
                      <h3 className="text-lg font-black">{topic.titlePl}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-paper/70">{topic.goalPl}</p>
                    <p className="mt-2 text-xs text-paper/45">
                      {topicSize(topic)} pozycji ·{" "}
                      {topic.words.length} słów ·{" "}
                      {topic.phrases.length} zwrotów ·{" "}
                      {topic.commands.length} poleceń ·{" "}
                      {topic.collocations.length} kolokacji
                      {sessions > 0 && ` · ćwiczone ${sessions}×`}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <Card className="text-sm text-paper/70">
        <p className="font-bold text-paper">Jak to działa</p>
        <p className="mt-2">
          W tym torze nic nie trzeba czytać: pytaniem jest zawsze nagranie albo polski tekst,
          a odpowiedzią obrazek. Angielski zapis jest obok dla dziecka, które już czyta —
          nigdy jako warunek.
        </p>
        <p className="mt-2">
          Polecenia nauczyciela („line up”, „tidy up”) ćwiczymy wyłącznie na rozumienie.
          Dziecko ma wiedzieć, co zrobić, a nie umieć je wypowiedzieć.
        </p>
      </Card>
    </div>
  );
}
