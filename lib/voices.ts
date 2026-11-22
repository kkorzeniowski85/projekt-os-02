/**
 * Dwa głosy lektorów (ElevenLabs, od 2026-11): kobieta i mężczyzna, na zmianę.
 * Dziecko uczące się obcego języka szybciej łapie słowo, gdy słyszy je od
 * różnych osób — uczy się słowa, a nie barwy jednego lektora.
 *
 * Nagrania leżą w public/audio/<głos>/words|phrases/<slug>.mp3, obok
 * dawnych (public/audio/words|phrases), które zostają zapasem: aplikacja gra
 * głos, który jest, a gdy nie ma żadnego — stare nagranie (lib/audio.ts).
 * Generator: scripts/generate-eleven.mjs.
 *
 * Co ma oba głosy, a co jeden (żeby zmieścić się w budżecie znaków):
 *  - słowa, zwroty lekcji i zdania z ćwiczeń — oba, aplikacja gra na zmianę;
 *  - kwestie scenek — głos roli (sceneLineVoice w lib/curriculum/scenes.ts);
 *  - zdania przykładowe słów — jeden, na zmianę według kolejności;
 *  - książeczki — cała książeczka jednym głosem, kolejna drugim (bookVoice).
 * Głoski i rymowanki zostają takie, jakie są.
 */

export type Voice = "alice" | "george";

export const VOICES: readonly Voice[] = ["alice", "george"];

/** Identyfikatory głosów ElevenLabs (brytyjskie, gotowe głosy biblioteki). */
export const ELEVEN_VOICE_IDS: Record<Voice, string> = {
  alice: "Xb7hH8MSUJpSbSDYk0k2",
  george: "JBFqnCBsd6RMkjVDRZzb",
};

export function voiceByIndex(index: number): Voice {
  return VOICES[((index % VOICES.length) + VOICES.length) % VOICES.length];
}

export function otherVoice(voice: Voice): Voice {
  return voice === "alice" ? "george" : "alice";
}
