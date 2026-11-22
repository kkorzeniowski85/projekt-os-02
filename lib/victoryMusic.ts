/**
 * Hymn na trzy gwiazdki — grany syntezą (WebAudio), gdy nie ma nagrania
 * public/audio/victory/three-stars.mp3 (scripts/generate-music.mjs, ElevenLabs).
 *
 * Melodia jest ORYGINALNA, napisana dla tej aplikacji (2026-11-22). Stylistyka
 * kina bohaterskiego — fanfara blachy nad pędzącymi smyczkami, kotły, werbel,
 * talerze, wielki akord na koniec — ale bez ani jednej frazy z istniejących
 * ścieżek filmowych (te chroni prawo autorskie; prosiliśmy o „coś jak
 * superbohaterowie”, nie o kopię).
 *
 * Układ (tempo 138, 4/4): sześć taktów tematu w c-moll
 * (Cm – B♭ – E♭ – A♭ – B♭ – G), potem finał w jasnym C-dur.
 * Brzmienie: „blacha” (trzy lekko rozstrojone piły + oktawa niżej), smyczki
 * (akordy i ostinato ósemkami), bas, kotły, werbel z tremolem przed finałem,
 * talerze i pogłos dużej sali (splot z wygenerowanym szumem).
 *
 * Kontekst może być zwykły albo „offline” (pomiar głośności w testach).
 */

const BPM = 138;
const BEAT = 60 / BPM;
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

type Tone = { midi: number; beat: number; beats: number; vol?: number };

/** Temat: skok o kwintę w górę i zejście — potem to samo wyżej, aż do szczytu. */
const MELODY: Tone[] = [
  // t. 1 (Cm)
  { midi: 60, beat: 0, beats: 1 },
  { midi: 67, beat: 1, beats: 1.5, vol: 1.1 },
  { midi: 65, beat: 2.5, beats: 0.5 },
  { midi: 63, beat: 3, beats: 1 },
  // t. 2 (B♭)
  { midi: 65, beat: 4, beats: 1 },
  { midi: 70, beat: 5, beats: 2.6, vol: 1.1 },
  // t. 3 (E♭) — temat tercję wyżej
  { midi: 63, beat: 8, beats: 1 },
  { midi: 70, beat: 9, beats: 1.5, vol: 1.1 },
  { midi: 68, beat: 10.5, beats: 0.5 },
  { midi: 67, beat: 11, beats: 1 },
  // t. 4 (A♭) — wspinaczka
  { midi: 68, beat: 12, beats: 1 },
  { midi: 72, beat: 13, beats: 1.5, vol: 1.1 },
  { midi: 74, beat: 14.5, beats: 0.5 },
  { midi: 75, beat: 15, beats: 1, vol: 1.1 },
  // t. 5 (B♭) — szczyt
  { midi: 77, beat: 16, beats: 1.5, vol: 1.2 },
  { midi: 75, beat: 17.5, beats: 0.5 },
  { midi: 74, beat: 18, beats: 1 },
  { midi: 70, beat: 19, beats: 1 },
  // t. 6 (G) — sygnał i rozbieg do finału
  { midi: 67, beat: 20, beats: 0.5 },
  { midi: 71, beat: 20.5, beats: 0.5 },
  { midi: 74, beat: 21, beats: 0.5 },
  { midi: 79, beat: 21.5, beats: 1.4, vol: 1.15 },
  { midi: 74, beat: 23, beats: 0.34 },
  { midi: 77, beat: 23.33, beats: 0.34 },
  { midi: 79, beat: 23.67, beats: 0.33 },
  // finał (C-dur)
  { midi: 84, beat: 24, beats: 1.5, vol: 1.25 },
  { midi: 79, beat: 25.5, beats: 0.5, vol: 1.1 },
  { midi: 84, beat: 26, beats: 5, vol: 1.3 },
];

type Chord = { beat: number; beats: number; root: number; notes: number[] };

const CHORDS: Chord[] = [
  { beat: 0, beats: 4, root: 48, notes: [55, 60, 63] }, // Cm
  { beat: 4, beats: 4, root: 46, notes: [53, 58, 62] }, // B♭
  { beat: 8, beats: 4, root: 51, notes: [58, 63, 67] }, // E♭
  { beat: 12, beats: 4, root: 44, notes: [51, 56, 60] }, // A♭
  { beat: 16, beats: 4, root: 46, notes: [53, 58, 62] }, // B♭
  { beat: 20, beats: 4, root: 43, notes: [50, 55, 59] }, // G
  { beat: 24, beats: 7, root: 48, notes: [55, 60, 64, 67, 72] }, // C-dur
];

/** Ostinato smyczków: ósemki „pryma-pryma-kwinta” — to ono daje pęd. */
const OSTINATO = [0, 0, 7, 0, 0, 7, 0, 7];
const THEME_BEATS = 24;
const TOTAL_BEATS = 31;

/** Długość muzyki bez wybrzmienia pogłosu, w sekundach. */
export const HERO_ANTHEM_SECONDS = TOTAL_BEATS * BEAT;

function noiseBuffer(context: BaseAudioContext, seconds: number, shape: (t: number) => number, channels = 1) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(channels, length, context.sampleRate);
  for (let channel = 0; channel < channels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * shape(i / length);
  }
  return buffer;
}

/**
 * Planuje cały hymn od `startAt` i zwraca funkcję, która go ucisza
 * (krótkie wyciszenie zamiast twardego cięcia — bez trzasku).
 */
export function scheduleHeroAnthem(
  context: BaseAudioContext,
  destination: AudioNode,
  startAt = context.currentTime + 0.06,
): () => void {
  const sources: AudioScheduledSourceNode[] = [];
  const at = (beat: number) => startAt + beat * BEAT;

  // Tor wyjściowy: suma → (sucho + pogłos) → głośność → limiter.
  const master = context.createGain();
  master.gain.value = 0.62;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  master.connect(limiter);
  limiter.connect(destination);

  const mix = context.createGain();
  mix.connect(master);
  const hall = context.createConvolver();
  hall.buffer = noiseBuffer(context, 2.4, (t) => (1 - t) ** 2.6, 2);
  const wet = context.createGain();
  wet.gain.value = 0.32;
  mix.connect(hall);
  hall.connect(wet);
  wet.connect(master);

  // Filtry „instrumentów”: blacha jaśniejsza, smyczki ciemniejsze.
  const brass = context.createBiquadFilter();
  brass.type = "lowpass";
  brass.frequency.value = 2500;
  brass.Q.value = 0.8;
  brass.connect(mix);
  const strings = context.createBiquadFilter();
  strings.type = "lowpass";
  strings.frequency.value = 1500;
  strings.connect(mix);

  function tone(
    freq: number,
    start: number,
    dur: number,
    vol: number,
    bus: AudioNode,
    options: { type?: OscillatorType; detune?: number; attack?: number; release?: number } = {},
  ) {
    const { type = "sawtooth", detune = 0, attack = 0.03, release = 0.09 } = options;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    oscillator.detune.value = detune;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + attack);
    gain.gain.setValueAtTime(vol, Math.max(start + attack, start + dur - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.02);
    oscillator.connect(gain).connect(bus);
    oscillator.start(start);
    oscillator.stop(start + dur + 0.08);
    sources.push(oscillator);
  }

  // Blacha: melodia unisono w trzech lekko rozstrojonych głosach + rogi oktawę niżej.
  for (const note of MELODY) {
    const start = at(note.beat);
    const dur = note.beats * BEAT * 0.94;
    const vol = 0.085 * (note.vol ?? 1);
    for (const detune of [-9, 0, 9]) tone(hz(note.midi), start, dur, vol, brass, { detune });
    tone(hz(note.midi - 12), start, dur, vol * 0.9, brass, { attack: 0.045 });
  }

  for (const chord of CHORDS) {
    const start = at(chord.beat);
    const dur = chord.beats * BEAT;
    const final = chord.beat >= THEME_BEATS;
    // Smyczki: akord, miękkie wejście.
    for (const midi of chord.notes) {
      for (const detune of [-7, 7]) {
        tone(hz(midi), start, dur, final ? 0.04 : 0.03, strings, { detune, attack: 0.14, release: 0.3 });
      }
    }
    // Bas: piła z sinusem oktawę niżej.
    tone(hz(chord.root - 12), start, dur, 0.1, strings, { attack: 0.02, release: 0.2 });
    tone(hz(chord.root - 12), start, dur, 0.12, mix, { type: "sine", attack: 0.02, release: 0.2 });
    if (final) {
      // W finale blacha gra też akord pod długą nutą melodii.
      for (const midi of [60, 64, 67, 72]) {
        tone(hz(midi), at(26), 5 * BEAT * 0.94, 0.05, brass, { detune: midi % 2 ? 6 : -6, attack: 0.05 });
      }
    } else {
      // Ostinato ósemkami.
      OSTINATO.forEach((interval, i) => {
        tone(hz(chord.root + 12 + interval), at(chord.beat + i * 0.5), 0.12, 0.06, strings, {
          attack: 0.008,
          release: 0.06,
        });
      });
    }
  }

  // Kotły: sinus z szybkim opadnięciem wysokości.
  function timpani(beat: number, midi: number, vol: number) {
    const start = at(beat);
    const freq = hz(midi);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq * 1.6, start);
    oscillator.frequency.exponentialRampToValueAtTime(freq, start + 0.08);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
    oscillator.connect(gain).connect(mix);
    oscillator.start(start);
    oscillator.stop(start + 0.65);
    sources.push(oscillator);
  }
  for (const chord of CHORDS) timpani(chord.beat, chord.root - 12, chord.beat >= THEME_BEATS ? 0.42 : 0.3);
  timpani(3.5, 36, 0.2);
  timpani(22, 31, 0.3);
  timpani(23, 31, 0.36);
  timpani(23.5, 31, 0.4);
  timpani(26, 36, 0.45);

  // Werbel i talerze — z jednego bufora szumu.
  const noise = noiseBuffer(context, 4, () => 1);
  function hit(beat: number, vol: number, decay: number, filter: "bandpass" | "highpass", freq: number) {
    const start = at(beat);
    const source = context.createBufferSource();
    source.buffer = noise;
    const band = context.createBiquadFilter();
    band.type = filter;
    band.frequency.value = freq;
    band.Q.value = 0.7;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    source.connect(band).connect(gain).connect(mix);
    source.start(start, Math.random() * 0.5);
    source.stop(start + decay + 0.05);
    sources.push(source);
  }
  // Werbel na „dwa” i „cztery”, lekki przedtakt przed każdym taktem.
  for (let bar = 0; bar < 5; bar++) {
    hit(bar * 4 + 1, 0.11, 0.12, "bandpass", 1900);
    hit(bar * 4 + 3, 0.11, 0.12, "bandpass", 1900);
    hit(bar * 4 + 3.5, 0.06, 0.08, "bandpass", 1900);
  }
  hit(21, 0.11, 0.12, "bandpass", 1900);
  // Tremolo werbla narastające do finału.
  for (let i = 0; i < 8; i++) hit(22 + i * 0.25, 0.05 + i * 0.022, 0.09, "bandpass", 1900);
  // Talerze: początek, szczyt, finał.
  hit(0, 0.07, 1.4, "highpass", 6000);
  hit(16, 0.09, 1.6, "highpass", 6000);
  hit(24, 0.2, 2.8, "highpass", 5500);

  return () => {
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.0001, now + 0.12);
    for (const source of sources) {
      try {
        source.stop(now + 0.15);
      } catch {
        // już zatrzymane
      }
    }
  };
}
