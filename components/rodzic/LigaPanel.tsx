"use client";

/**
 * Panel rodzica — dział Dźwięki (dawna Liga Dźwięków): przegląd postępu,
 * ściąga szkolna, stan nagrań, studio głosek i ustawienia działu.
 *
 * Wydzielone bez zmian logiki z dawnego app/rodzic/page.tsx Ligi. Raport,
 * synchronizacja, kopie zapasowe i wersja aplikacji są wspólne dla obu
 * działów i siedzą w osobnych zakładkach (ReportPanel, SyncPanel).
 *
 * Świadomie bez ładnych wykresów: na tym etapie ważniejsze jest, żeby dane dało
 * się WYNIEŚĆ (markdown/CSV), niż żeby ładnie wyglądały w środku.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BigButton, Card } from "@/components/ui";
import {
  auditClips,
  getVoiceStatus,
  playRhyme,
  phonemeClipBase,
  phraseClipBase,
  phraseClipPath,
  playClipFile,
  primeSpeech,
  wordClipBase,
  wordClipPath,
  type VoiceStatus,
} from "@/lib/audio";
import { PhonemeRecorder } from "@/components/PhonemeRecorder";
import { lessonGraphemes, lessonWords } from "@/lib/curriculum/lessons";
import { IPA_BY_GRAPHEME, trickyHint } from "@/lib/curriculum/ipa";
import { getSound } from "@/lib/curriculum/sounds";
import { RHYMES } from "@/lib/curriculum/rhymes";
import { sentenceTexts } from "@/lib/curriculum/sentences";
import { getTopic, TOPICS, vocabPhrases, vocabWords } from "@/lib/curriculum/vocab";
import { parentPhrases } from "@/lib/curriculum/vocabParent";
import { importRecordingFiles, listRecordings } from "@/lib/recordings";
import { RECORDINGS_CHANGED } from "@/lib/progress/recordingsSync";
import { subscribeSync, type SyncStatus } from "@/lib/progress/sync";
import { accuracyOf, recommendNext, recommendNextTopic, RULES } from "@/lib/progress/rules";
import { useProgress } from "@/lib/progress/store";
import { trackOf, type SoundState } from "@/lib/progress/types";
import { plural, soundsWord } from "./plural";

const STATUS_LABEL: Record<SoundState["status"], string> = {
  new: "nowy",
  learning: "w trakcie",
  mastered: "opanowany",
  "needs-help": "trudny",
};

/** Lista słów do odsłuchania: obecne można kliknąć, brakujące są wyszarzone. */
function WordClipList({
  words,
  resolved,
  title = "Słowa",
}: {
  words: string[];
  resolved: Record<string, string | null> | null;
  title?: string;
}) {
  const availableCount = resolved
    ? words.filter((word) => resolved[wordClipBase(word)]).length
    : null;

  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-bold text-paper/80">
        {title}{" "}
        <span className="font-normal text-paper/50">
          {availableCount === null ? "" : `(${availableCount}/${words.length} nagrań)`}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {words.map((word) => {
          const path = resolved?.[wordClipBase(word)] ?? null;
          return (
            <button
              key={word}
              type="button"
              disabled={!path}
              onClick={() => path && void playClipFile(path)}
              title={path ?? `brak pliku: ${wordClipPath(word)}`}
              className={`rounded-xl px-3 py-2 text-sm ${
                path ? "bg-white/15 text-paper hover:bg-white/25" : "bg-white/5 text-paper/30"
              }`}
            >
              {path && <span aria-hidden>▶ </span>}
              <span className="font-reading font-bold">{word}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** To samo co wyżej, ale dla całych zwrotów toru 2 (jeden wiersz na zdanie). */
function PhraseClipList({
  phrases,
  resolved,
}: {
  phrases: string[];
  resolved: Record<string, string | null> | null;
}) {
  const availableCount = resolved
    ? phrases.filter((phrase) => resolved[phraseClipBase(phrase)]).length
    : null;

  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-bold text-paper/80">
        Zwroty, scenki i czytanki{" "}
        <span className="font-normal text-paper/50">
          {availableCount === null ? "" : `(${availableCount}/${phrases.length} nagrań)`}
        </span>
      </p>
      <div className="flex max-h-96 flex-col gap-1 overflow-y-auto pr-1">
        {phrases.map((phrase) => {
          const path = resolved?.[phraseClipBase(phrase)] ?? null;
          return (
            <button
              key={phrase}
              type="button"
              disabled={!path}
              onClick={() => path && void playClipFile(path)}
              title={path ?? `brak pliku: ${phraseClipPath(phrase)}`}
              className={`rounded-xl px-3 py-2 text-left text-sm ${
                path ? "bg-white/15 text-paper hover:bg-white/25" : "bg-white/5 text-paper/30"
              }`}
            >
              <span aria-hidden>{path ? "▶ " : "· "}</span>
              <span className="font-reading font-bold">{phrase}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-paper/50">
        Zwrot bez nagrania NIE blokuje ćwiczenia — czyta go wtedy syntezator urządzenia. Całe
        zdania syntezator wymawia sensownie (w przeciwieństwie do pojedynczych głosek), więc to
        uczciwe rozwiązanie awaryjne, a nie namiastka.
      </p>
    </div>
  );
}

export function LigaPanel() {
  const { state, setChildName, resetAll } = useProgress();
  const [sync, setSync] = useState<SyncStatus | null>(null);
  useEffect(() => subscribeSync(setSync), []);
  const audioImportRef = useRef<HTMLInputElement>(null);
  const [audioImportMessage, setAudioImportMessage] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Record<string, string | null> | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [recordedIds, setRecordedIds] = useState<string[]>([]);

  const words = useMemo(lessonWords, []);
  const graphemes = useMemo(lessonGraphemes, []);
  // Tor 2 dokłada własne słowa (te idą do tego samego katalogu co słowa lekcji)
  // i całe zwroty (te mają katalog osobny — patrz phraseClipBase).
  const vocabOnlyWords = useMemo(
    () => vocabWords().filter((word) => !words.includes(word)),
    [words],
  );
  // Pełna pula wypowiedzi do odsłuchu — ta sama, którą zna generator i audyt:
  // ćwiczenia toru 2 + scenki/przykłady trybu z rodzicem + mini-czytanki.
  // Rodzic ma móc przesłuchać KAŻDE zdanie, zanim usłyszy je dziecko.
  const phrases = useMemo(
    () => [...new Set([...vocabPhrases(), ...parentPhrases(), ...sentenceTexts()])].sort(),
    [],
  );

  const recommendation = recommendNext(state);
  const topicRecommendation = recommendNextTopic(state);

  // Lista głosów ładuje się asynchronicznie, więc pytamy o nią po zamontowaniu
  // (i raz jeszcze chwilę później) zamiast w trakcie renderu.
  const [voice, setVoice] = useState<VoiceStatus | null>(null);
  useEffect(() => {
    primeSpeech();
    setVoice(getVoiceStatus());
    const timer = setTimeout(() => setVoice(getVoiceStatus()), 600);
    return () => clearTimeout(timer);
  }, []);

  const sounds = Object.values(state.sounds).sort(
    (a, b) => (b.lastSeenTs ?? 0) - (a.lastSeenTs ?? 0),
  );
  const topics = Object.values(state.topics).sort(
    (a, b) => (b.lastSeenTs ?? 0) - (a.lastSeenTs ?? 0),
  );
  const recentSessions = [...state.sessions].slice(-10).reverse();

  const bases = useMemo(
    () => [
      ...words.map(wordClipBase),
      ...vocabOnlyWords.map(wordClipBase),
      ...graphemes.map(phonemeClipBase),
      ...phrases.map(phraseClipBase),
    ],
    [words, vocabOnlyWords, graphemes, phrases],
  );

  const runAudit = useCallback(async () => {
    setAuditing(true);
    const result = await auditClips(bases);
    setResolved(Object.fromEntries(result.map((entry) => [entry.base, entry.path])));
    setAuditing(false);
  }, [bases]);

  const refreshRecordings = useCallback(async () => {
    setRecordedIds((await listRecordings()).map((recording) => recording.id));
  }, []);

  useEffect(() => {
    void runAudit();
    void refreshRecordings();

    // Nagrania potrafią przyjechać z innego urządzenia w trakcie patrzenia na
    // panel — bez tego lista pokazywałaby stan sprzed synchronizacji.
    const naZmiane = () => void refreshRecordings();
    window.addEventListener(RECORDINGS_CHANGED, naZmiane);
    return () => window.removeEventListener(RECORDINGS_CHANGED, naZmiane);
  }, [runAudit, refreshRecordings]);

  const missingWords = resolved
    ? words.filter((word) => !resolved[wordClipBase(word)]).length
    : null;

  const missingVocab = resolved
    ? vocabOnlyWords.filter((word) => !resolved[wordClipBase(word)]).length
    : null;

  const missingPhrases = resolved
    ? phrases.filter((phrase) => !resolved[phraseClipBase(phrase)]).length
    : null;

  async function onImportAudio(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0) return;

    const { imported, skipped } = await importRecordingFiles(files, graphemes);
    await refreshRecordings();

    const parts: string[] = [];
    if (imported.length > 0) {
      parts.push(`Wczytano ${imported.length} ${soundsWord(imported.length)}: ${imported.join(", ")}.`);
    }
    if (skipped.length > 0) {
      parts.push(
        `Pominięto ${skipped.length}: nazwa pliku musi odpowiadać głosce (np. sh.wav, ch.wav).`,
      );
    }
    setAudioImportMessage(parts.join(" ") || "Nic nie wczytano.");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="mb-3 text-lg font-bold">Co dalej</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-bold tracking-wide text-paper/50 uppercase">
              Tor 1 — czytanie
            </p>
            <p className="text-paper/80">{recommendation.labelPl}</p>
            <div className="mt-3 inline-block">
              <BigButton href={`/sesja/${recommendation.soundId}`}>Otwórz sesję</BigButton>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold tracking-wide text-paper/50 uppercase">
              Tor 2 — słowa i zwroty
            </p>
            <p className="text-paper/80">{topicRecommendation.labelPl}</p>
            <div className="mt-3 inline-block">
              <BigButton href={`/slownictwo/${topicRecommendation.topicId}`}>
                Otwórz temat
              </BigButton>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Postęp per temat (tor 2)</h2>
        <p className="mb-3 text-sm text-paper/60">
          Słownictwo, zwroty i kolokacje. Tor niezależny od czytania — można je prowadzić
          równolegle, bo ćwiczą inne rzeczy.
        </p>
        {topics.length === 0 ? (
          <p className="text-paper/60">
            Brak sesji w tym torze. Pierwszy temat („Ratunek!”) warto zrobić przed pierwszym
            dniem w szkole.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-paper/60">
                <tr>
                  <th className="py-2">Temat</th>
                  <th>Status</th>
                  <th>Sesje</th>
                  <th>Ostatni</th>
                  <th>Najlepszy</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => (
                  <tr key={topic.topicId} className="border-t border-white/10">
                    <td className="py-2 font-bold">
                      {getTopic(topic.topicId)?.titlePl ?? topic.topicId}
                    </td>
                    <td>{STATUS_LABEL[topic.status]}</td>
                    <td>{topic.sessions}</td>
                    <td>
                      {topic.lastAccuracy === null
                        ? "—"
                        : `${Math.round(topic.lastAccuracy * 100)}%`}
                    </td>
                    <td>
                      {topic.bestAccuracy === null
                        ? "—"
                        : `${Math.round(topic.bestAccuracy * 100)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-paper/50">
          Tematów jest {TOPICS.length}. Kolejność w aplikacji to kolejność pilności, nie
          trudności — pierwsze cztery to przetrwanie w szkole.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Postęp per dźwięk (tor 1)</h2>
        {sounds.length === 0 ? (
          <p className="text-paper/60">Brak sesji — po pierwszej ćwiczeniu pojawią się dane.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-paper/60">
                <tr>
                  <th className="py-2">Dźwięk</th>
                  <th>Status</th>
                  <th>Sesje</th>
                  <th>Ostatni</th>
                  <th>Najlepszy</th>
                </tr>
              </thead>
              <tbody>
                {sounds.map((sound) => (
                  <tr key={sound.soundId} className="border-t border-white/10">
                    <td className="py-2 text-lg font-black">
                      {getSound(sound.soundId)?.grapheme ?? sound.soundId}
                    </td>
                    <td>{STATUS_LABEL[sound.status]}</td>
                    <td>{sound.sessions}</td>
                    <td>
                      {sound.lastAccuracy === null
                        ? "—"
                        : `${Math.round(sound.lastAccuracy * 100)}%`}
                    </td>
                    <td>
                      {sound.bestAccuracy === null
                        ? "—"
                        : `${Math.round(sound.bestAccuracy * 100)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-paper/50">
          Progi: opanowanie = {Math.round(RULES.masteryAccuracy * 100)}% przez{" "}
          {RULES.masterySessions} sesje pod rząd; sygnał trudności = poniżej{" "}
          {Math.round(RULES.strugglingAccuracy * 100)}% przez {RULES.strugglingSessions} sesje.
          Zmiana progów: lib/progress/rules.ts.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Ostatnie sesje</h2>
        {recentSessions.length === 0 ? (
          <p className="text-paper/60">Jeszcze żadnej sesji.</p>
        ) : (
          <ul className="space-y-1 text-sm text-paper/80">
            {recentSessions.map((session) => (
              <li key={session.id} className="flex flex-wrap gap-x-3">
                <span className="font-bold">
                  {trackOf(session) === "vocab"
                    ? (getTopic(session.soundId)?.titlePl ?? session.soundId)
                    : (getSound(session.soundId)?.grapheme ?? session.soundId)}
                </span>
                <span className="text-paper/50">
                  {trackOf(session) === "vocab" ? "słownictwo" : "czytanie"}
                </span>
                <span>{new Date(session.endedTs).toLocaleString("pl-PL")}</span>
                <span>{session.mode === "parent" ? "z rodzicem" : "sam"}</span>
                <span>{session.device}</span>
                <span>
                  {session.scored > 0
                    ? `${session.correct}/${session.scored} (${Math.round((accuracyOf(session) ?? 0) * 100)}%)`
                    : "bez punktacji"}
                </span>
                <span>{Math.round((session.endedTs - session.startedTs) / 60000)} min</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">
          Ściąga: pierwszy tydzień w brytyjskiej szkole
        </h2>
        <p className="mb-3 text-sm text-paper/70">
          Rzeczy, które zaskakują polskich rodziców — warto je znać, zanim zaskoczą.
          To wiedza dla Ciebie, nie ćwiczenia dla dziecka.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-paper/80">
          <li>
            <strong>Reading record</strong> — zeszycik, w którym szkoła oczekuje wpisu po
            KAŻDYM domowym czytaniu (wystarczy data i podpis). Chodzi w book bagu razem z
            książeczką do czytania; brak wpisów szkoła naprawdę zauważa.
          </li>
          <li>
            <strong>Book bag</strong> — płócienna torba szkolna, chodzi do szkoły codziennie.
            Plecak zwykle nie jest potrzebny.
          </li>
          <li>
            <strong>PE kit zostaje w szkole</strong> — worek ze strojem na WF wisi na haczyku
            cały semestr i wraca do domu do prania na przerwy świąteczne. Wszystko podpisz
            imieniem i nazwiskiem (naprasowanki albo pisak do tkanin).
          </li>
          <li>
            <strong>Bidon (water bottle)</strong> — każde dziecko ma swój w klasie, podpisany.
            Tylko woda — sok bywa niemile widziany.
          </li>
          <li>
            <strong>„Miss” i „Sir”</strong> — tak dzieci zwracają się do nauczycieli i to jest
            grzeczne. Wołanie „Teacher!” brzmi dziwnie.
          </li>
          <li>
            <strong>Naklejki i house points</strong> — system nagród: naklejka na bluzie po
            szkole to powód do dumy, nie śmieć. Zapytaj wieczorem, za co była.
          </li>
          <li>
            <strong>Assembly</strong> — codzienny apel całej szkoły na sali: siedzi się,
            śpiewa, słucha. Nikt nie odpytuje.
          </li>
          <li>
            <strong>Wet play</strong> — gdy pada, przerwa jest w klasie. Dziecko wróci i powie,
            że „nie było przerwy” — była, tylko w środku.
          </li>
          <li>
            <strong>School dinner albo packed lunch</strong> — obiad ze stołówki (w wielu
            szkołach do Year 2 bezpłatny, od Year 3 płatny) albo jedzenie z domu w pudełku.
            Wybór zgłasza się szkole; można zmieniać.
          </li>
          <li>
            <strong>Lost property</strong> — pudło rzeczy znalezionych. Sweter zniknął? Zanim
            kupisz nowy, każ dziecku sprawdzić lost property (dlatego wszystko podpisane).
          </li>
          <li>
            <strong>Parents&apos; evening</strong> — dwa razy w roku 10-minutowa rozmowa
            z nauczycielką po zapisach. Krótko i konkretnie; o EAL można pytać śmiało —
            szkoły mają na to procedury.
          </li>
          <li>
            <strong>Podręczników nie ma</strong> — dziecko nie nosi książek do domu; praca
            zostaje w szkole. Do domu wraca tylko book bag z książeczką do czytania i czasem
            homework raz w tygodniu.
          </li>
        </ul>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Audio</h2>
        <p className="mb-3 text-sm text-paper/70">
          {voice === null
            ? "Sprawdzam dostępne głosy…"
            : !voice.supported
              ? "Przeglądarka nie udostępnia syntezy mowy — potrzebne będą nagrania."
              : voice.voiceName === null
                ? "Brak zainstalowanych głosów — słowa nie zostaną odczytane. Potrzebne nagrania."
                : `Głos zapasowy: ${voice.voiceName} (${voice.lang ?? "?"})${
                    voice.isBritish ? "" : " — UWAGA: to nie jest głos brytyjski"
                  }`}
        </p>
        <div className="mb-4 rounded-2xl border border-hero-gold/40 bg-hero-gold/10 p-4 text-sm">
          <p className="font-bold text-hero-gold">Przesłuchaj przed pierwszą sesją</p>
          <p className="mt-1 text-paper/80">
            Nagrania słów pochodzą z syntezy mowy (głos brytyjski en-GB), nie od native
            speakera — i nikt ich jeszcze nie odsłuchał. Kliknij ▶ przy każdym. Jeśli coś
            brzmi źle, skasuj plik z <code>public/audio/words/</code> — aplikacja sama wróci
            wtedy do głosu z urządzenia.
          </p>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <BigButton tone="quiet" onClick={() => void runAudit()}>
            {auditing ? "Sprawdzam…" : "Odśwież stan plików"}
          </BigButton>
          {missingWords !== null && (
            <span className="text-sm text-paper/70">
              {missingWords === 0
                ? "Wszystkie słowa toru 1 nagrane ✓"
                : `Brakuje ${missingWords} z ${words.length} nagrań słów (tor 1)`}
            </span>
          )}
          {missingPhrases !== null && (missingPhrases > 0 || (missingVocab ?? 0) > 0) && (
            <span className="text-sm text-hero-gold">
              Tor 2: brakuje {missingVocab} słów i {missingPhrases} zwrotów
            </span>
          )}
        </div>

        <WordClipList words={words} resolved={resolved} title="Słowa (tor 1: czytanie)" />

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="mb-3 text-sm text-paper/70">
            Materiał toru 2. Te nagrania <strong>nie są warunkiem</strong> działania ćwiczeń —
            bez pliku czyta je syntezator urządzenia, a całe zdania wychodzą mu sensownie.
            Nagranie brytyjskiego głosu jest lepsze i wygrywa automatycznie, gdy się pojawi.
          </p>
          <WordClipList
            words={vocabOnlyWords}
            resolved={resolved}
            title="Słowa (tor 2: słownictwo)"
          />
          <PhraseClipList phrases={phrases} resolved={resolved} />

          <div className="mb-4">
            <p className="mb-2 text-sm font-bold text-paper/80">Rymowanki</p>
            <div className="flex flex-wrap gap-2">
              {RHYMES.map((rhyme) => (
                <button
                  key={rhyme.id}
                  type="button"
                  onClick={() => void playRhyme(rhyme.id)}
                  className="rounded-xl bg-white/15 px-3 py-2 text-sm text-paper hover:bg-white/25"
                >
                  <span aria-hidden>▶ </span>
                  <span className="font-reading font-bold">{rhyme.titleEn}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-paper/50">
          Generowanie nagrań: <code>npm run audio</code> (tylko brakujące) lub{" "}
          <code>npm run audio -- --force</code>. Jeden przebieg obsługuje oba tory — słowa
          lądują w <code>public/audio/words/</code>, zwroty w <code>public/audio/phrases/</code>.
        </p>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Studio głosek</h2>
        <p className="mb-3 text-sm text-paper/70">
          Tu nagrywasz czyste głoski własnym głosem. Kolejność ma znaczenie:{" "}
          <strong>najpierw wzorzec</strong> (przykładowe słowo brytyjskim głosem), potem
          nagranie. Nagrane głoski od razu trafiają do sesji dziecka — także do kawałków
          słów przy sklejaniu, które bez nagrania milczą.
        </p>

        <div className="mb-4 rounded-2xl border border-hero-gold/40 bg-hero-gold/10 p-4 text-sm">
          <p className="font-bold text-hero-gold">Głoski są już wstępnie przygotowane</p>
          <p className="mt-1 text-paper/80">
            Każda głoska została automatycznie <strong>wycięta z brytyjskiego nagrania
            słowa</strong> (np. „sh” z początku słowa <em>ship</em>) — to prawdziwy głos i
            prawdziwa wymowa, nie synteza. Nikt ich jednak nie odsłuchał: kliknij ▶ przy
            każdej. Jeśli któraś brzmi źle, nagraj ją swoim głosem — nagranie własne ma
            pierwszeństwo przed plikiem.
          </p>
        </div>

        <div className="mb-4 rounded-2xl border border-hero-cyan/40 bg-hero-cyan/10 p-4 text-sm">
          <p className="font-bold text-hero-cyan">Zanim nagrasz</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-paper/80">
            <li>
              Nagrywasz Ty, nie dziecko — decyzja o nienagrywaniu dziecka i o braku
              automatycznej oceny wymowy zostaje w mocy.
            </li>
            <li>
              Przy włączonej synchronizacji nagranie samo trafia na pozostałe urządzenia —
              nie musisz nic przenosić. (⤓ pobiera je jako plik, gdyby przydało się poza
              aplikacją.)
            </li>
            <li>
              Nagrywanie można przerwać: <strong>„zapisz teraz”</strong> kończy i zachowuje to,
              co już powiedziane, a <strong>„odrzuć”</strong> wychodzi bez zapisu i zostawia
              poprzednie nagranie nietknięte. Po zapisie przez chwilę jest jeszcze{" "}
              <strong>„cofnij”</strong>.
            </li>
            <li>
              Mów samą głoskę, bez doklejonej samogłoski: „sh", nie „szy"; „p", nie „py".
            </li>
          </ul>
        </div>

        <div className="mb-4 rounded-2xl border border-white/15 bg-black/20 p-4 text-sm">
          <p className="font-bold text-paper">Wczytaj głoski z plików (np. z Dysku Google)</p>
          <p className="mt-1 mb-3 text-paper/70">
            Najkrótsza droga, żeby dźwięki znalazły się na tym urządzeniu bez czekania na
            internet: wskaż pliki <code>sh.wav</code>, <code>ch.wav</code>… z folderu{" "}
            <code>angielski/public/audio/phonemes/</code>. Można zaznaczyć wszystkie naraz.
            Wczytane pliki zostają w pamięci urządzenia i działają też offline.
          </p>
          <BigButton tone="quiet" onClick={() => audioImportRef.current?.click()}>
            Wczytaj pliki głosek
          </BigButton>
          {/* Bez filtra `accept` — Dysk Google potrafi podawać puste typy MIME
              i filtr wyszarzałby poprawne pliki. Nazwy i tak są sprawdzane. */}
          <input
            ref={audioImportRef}
            type="file"
            multiple
            onChange={(event) => void onImportAudio(event)}
            className="hidden"
          />
          {audioImportMessage && (
            <p className="mt-3 rounded-xl bg-black/30 p-3 text-paper/85">{audioImportMessage}</p>
          )}
        </div>

        <p className="mb-2 text-sm text-paper/60">
          Własne nagranie lub wczytany plik: {recordedIds.length} z {graphemes.length}
        </p>

        <div className="flex flex-col gap-2">
          {graphemes.map((grapheme) => (
            <PhonemeRecorder
              key={grapheme}
              grapheme={grapheme}
              ipa={IPA_BY_GRAPHEME[grapheme]}
              exampleWord={getSound(grapheme)?.example ?? grapheme}
              hasFile={Boolean(resolved?.[phonemeClipBase(grapheme)])}
              tricky={trickyHint(grapheme)}
              onChange={() => void refreshRecordings()}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Ustawienia działu Dźwięki</h2>
        <label className="flex flex-col gap-2 text-sm">
          Imię dziecka
          <input
            value={state.childName}
            onChange={(event) => setChildName(event.target.value)}
            className="max-w-xs rounded-xl bg-white/10 px-4 py-3 text-lg"
          />
        </label>
        <div className="mt-6">
          <BigButton
            tone="no"
            onClick={() => {
              // Dwa osobne potwierdzenia celowo: to działanie nieodwracalne,
              // a jedno okno łatwo zamknąć odruchowo. Drugie pokazuje, ile
              // konkretnie zostanie utracone, żeby nie było to tylko formalnością.
              if (
                !window.confirm(
                  "Skasować cały postęp dziecka w dziale Dźwięki? Cofnąć to można tylko, " +
                    "wczytując zapisaną wcześniej kopię — jeśli jej nie masz, anuluj i najpierw " +
                    "użyj „Zapisz kopię Dźwięków” w zakładce „Synchronizacja i kopie”.",
                )
              ) {
                return;
              }
              const sessionCount = state.sessions.length;
              const masteredCount = Object.values(state.sounds).filter(
                (sound) => sound.status === "mastered",
              ).length;
              const masteredTopics = Object.values(state.topics).filter(
                (topic) => topic.status === "mastered",
              ).length;
              const potwierdzenie =
                `Na pewno? Skasujesz ${sessionCount} ` +
                plural(sessionCount, "zapisaną sesję", "zapisane sesje", "zapisanych sesji") +
                (masteredTopics > 0 ? ", " : " i ") +
                `${masteredCount} ` +
                plural(masteredCount, "opanowany dźwięk", "opanowane dźwięki", "opanowanych dźwięków") +
                (masteredTopics > 0
                  ? ` i ${masteredTopics} ` +
                    plural(masteredTopics, "opanowany temat", "opanowane tematy", "opanowanych tematów")
                  : "") +
                "." +
                // Reset rozchodzi się synchronizacją (resetTs) — rodzic musi to
                // wiedzieć, zanim kliknie, a nie odkryć na tablecie.
                (sync?.enabled
                  ? " Synchronizacja jest włączona, więc postęp zniknie też na pozostałych " +
                    "urządzeniach rodziny, gdy tylko się zsynchronizują."
                  : "") +
                " Bez zapisanej kopii tej operacji nie da się cofnąć. Postęp Akademii zostaje nietknięty.";
              if (window.confirm(potwierdzenie)) {
                resetAll();
              }
            }}
          >
            Wyczyść postęp Dźwięków
          </BigButton>
          <p className="mt-2 text-xs text-paper/50">
            Dane siedzą w tej przeglądarce. Przenoszenie między urządzeniami: zakładka
            „Synchronizacja i kopie”.
          </p>
        </div>
      </Card>
    </div>
  );
}
