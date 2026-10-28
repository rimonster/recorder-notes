/**
 * Which note a microphone buffer is. `samples` is a mono time-domain frame (the game uses 2048
 * samples from an AnalyserNode). Loud enough and clearly one note, or hz 0.
 */
import { IDS, NOTES, type NoteId } from "./notes.ts";

export function pitchOf(samples: Float32Array, sampleRate: number): { hz: number; level: number } {
  let rms = 0;
  for (let i = 0; i < samples.length; i++) rms += samples[i]! * samples[i]!;
  rms = Math.sqrt(rms / (samples.length || 1));
  if (rms < 0.01) return { hz: 0, level: rms };
  // Lags for 450–2600 Hz (a soprano recorder's range, with room for overblowing).
  const W = 1024, lo = Math.floor(sampleRate / 2600), hi = Math.ceil(sampleRate / 450);
  if (samples.length < W + hi + 2) return { hz: 0, level: rms };
  const d = new Float32Array(hi + 2);
  for (let t = lo; t <= hi + 1; t++) {
    let s = 0;
    for (let i = 0; i < W; i++) {
      const v = samples[i]! - samples[i + t]!;
      s += v * v;
    }
    d[t] = s;
  }
  // Cumulative mean normalized difference; the first dip under the threshold is the period.
  let sum = 0;
  let best = -1;
  const cm = new Float32Array(hi + 2);
  for (let t = 1; t <= hi + 1; t++) {
    if (t < lo) {
      let s = 0;
      for (let i = 0; i < W; i++) {
        const v = samples[i]! - samples[i + t]!;
        s += v * v;
      }
      d[t] = s;
    }
    sum += d[t]!;
    cm[t] = (d[t]! * t) / (sum || 1);
  }
  for (let t = lo + 1; t <= hi; t++)
    if (cm[t]! < 0.15 && cm[t]! <= cm[t - 1]! && cm[t]! <= cm[t + 1]!) {
      best = t;
      break;
    }
  // A breathy note (the low ones, played gently) never dips that far: its deepest dip, if it's clear enough.
  if (best < 0) {
    let min = 0.3;
    for (let t = lo + 1; t <= hi; t++) if (cm[t]! < min && cm[t]! <= cm[t - 1]! && cm[t]! <= cm[t + 1]!) [min, best] = [cm[t]!, t];
  }
  if (best < 0) return { hz: 0, level: rms };
  const a = cm[best - 1]!, b = cm[best]!, c = cm[best + 1]!;
  const shift = (a - c) / (2 * (a - 2 * b + c) || 1);
  let hz = sampleRate / (best + shift);
  // The low notes have a strong overtone an octave up, which can be taken for the note: if there's real sound
  // an octave below too, that's the note being played.
  if (hz / 2 >= 450 && power(samples, W, hz / 2, sampleRate) > power(samples, W, hz, sampleRate) * 0.12) hz /= 2;
  return { hz, level: rms };
}

/** How much of one pitch is in the sound (Goertzel). */
function power(x: Float32Array, n: number, hz: number, sampleRate: number) {
  const k = 2 * Math.cos((2 * Math.PI * hz) / sampleRate);
  let s1 = 0, s2 = 0;
  for (let i = 0; i < n; i++) {
    const s0 = x[i]! * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))) + k * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return s1 * s1 + s2 * s2 - k * s1 * s2;
}

/** Which note a pitch is (within half a semitone either way), if any. `octaveUp` is the same check an octave down. */
export function noteOf(hz: number): { id: NoteId | null; octaveUp: NoteId | null } {
  if (!hz) return { id: null, octaveUp: null };
  const near = (f: number) => IDS.find((id) => Math.abs(12 * Math.log2(f / NOTES[id].hz)) < 0.5) ?? null;
  return { id: near(hz), octaveUp: near(hz / 2) };
}
