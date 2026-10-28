/**
 * Soprano recorder notes, baroque fingering, from low C to top D.
 * German fingering differs only for F and F#, low and high.
 */

export type NoteId = "C" | "Cs" | "D" | "Eb" | "E" | "F" | "Fs" | "G" | "Gs" | "A" | "Bb" | "B" | "C2" | "Cs2" | "D2" | "E2" | "F2" | "Fs2" | "G2" | "A2"
  | "Eb2" | "Gs2" | "Bb2" | "B2" | "C3" | "D3";
/** Holes: thumb (behind), then 1–3 (left hand, top) and 4–7 (right hand); 1 = covered, 0.5 = half (the thumb "pinched"). */
export type Holes = [number, number, number, number, number, number, number, number];
export const NOTES: Record<NoteId, { name: string; hz: number; holes: Holes; color: string }> = {
  C: { name: "C", hz: 523.25, holes: [1, 1, 1, 1, 1, 1, 1, 1], color: "#2f6bff" },
  Cs: { name: "C#", hz: 554.37, holes: [1, 1, 1, 1, 1, 1, 1, 0.5], color: "#6f8cff" },
  D: { name: "D", hz: 587.33, holes: [1, 1, 1, 1, 1, 1, 1, 0], color: "#ff6bd6" },
  Eb: { name: "E♭", hz: 622.25, holes: [1, 1, 1, 1, 1, 1, 0.5, 0], color: "#ffb0e8" },
  E: { name: "E", hz: 659.26, holes: [1, 1, 1, 1, 1, 1, 0, 0], color: "#ffe14d" },
  F: { name: "F", hz: 698.46, holes: [1, 1, 1, 1, 1, 0, 1, 1], color: "#d946ef" },
  Fs: { name: "F#", hz: 739.99, holes: [1, 1, 1, 1, 0, 1, 1, 0], color: "#2ee6b8" },
  G: { name: "G", hz: 783.99, holes: [1, 1, 1, 1, 0, 0, 0, 0], color: "#7dff6b" },
  Gs: { name: "G#", hz: 830.61, holes: [1, 1, 1, 0, 1, 1, 0.5, 0], color: "#b8ffad" },
  A: { name: "A", hz: 880.0, holes: [1, 1, 1, 0, 0, 0, 0, 0], color: "#4dd2ff" },
  Bb: { name: "B♭", hz: 932.33, holes: [1, 1, 0, 1, 1, 0, 0, 0], color: "#cddc39" },
  B: { name: "B", hz: 987.77, holes: [1, 1, 0, 0, 0, 0, 0, 0], color: "#b388ff" },
  C2: { name: "C", hz: 1046.5, holes: [1, 0, 1, 0, 0, 0, 0, 0], color: "#ff4d6d" },
  Cs2: { name: "C#", hz: 1108.73, holes: [0, 1, 1, 0, 0, 0, 0, 0], color: "#ffb4a2" },
  D2: { name: "D", hz: 1174.66, holes: [0, 0, 1, 0, 0, 0, 0, 0], color: "#ff9f43" },
  Eb2: { name: "E♭", hz: 1244.51, holes: [0, 0, 1, 1, 1, 1, 1, 0], color: "#ffc6f0" },
  E2: { name: "E", hz: 1318.51, holes: [0.5, 1, 1, 1, 1, 1, 0, 0], color: "#9aa7ff" },
  F2: { name: "F", hz: 1396.91, holes: [0.5, 1, 1, 1, 1, 0, 1, 0], color: "#f0abfc" },
  Fs2: { name: "F#", hz: 1479.98, holes: [0.5, 1, 1, 1, 0, 1, 0, 0], color: "#99f6e4" },
  G2: { name: "G", hz: 1567.98, holes: [0.5, 1, 1, 1, 0, 0, 0, 0], color: "#c4ffb8" },
  Gs2: { name: "G#", hz: 1661.22, holes: [0.5, 1, 1, 0, 1, 0, 0, 0], color: "#d9ffcf" },
  A2: { name: "A", hz: 1760.0, holes: [0.5, 1, 1, 0, 0, 0, 0, 0], color: "#b3ecff" },
  Bb2: { name: "B♭", hz: 1864.66, holes: [0.5, 1, 1, 0, 0, 1, 1, 0], color: "#e6ee9c" },
  B2: { name: "B", hz: 1975.53, holes: [0.5, 1, 1, 0, 1, 1, 0, 0], color: "#d1c4ff" },
  C3: { name: "C", hz: 2093.0, holes: [0.5, 1, 0, 0, 1, 1, 0, 0], color: "#ff8fa3" },
  D3: { name: "D", hz: 2349.32, holes: [0.5, 1, 0, 1, 1, 0, 1, 0], color: "#ffc48a" },
};
export const IDS = Object.keys(NOTES) as NoteId[];

/** Baroque (the NOTES above) or German. */
export type Fingering = "baroque" | "german";
export const GERMAN_HOLES: Partial<Record<NoteId, Holes>> = {
  F: [1, 1, 1, 1, 1, 0, 0, 0], Fs: [1, 1, 1, 1, 0, 1, 1, 1],
  F2: [0.5, 1, 1, 1, 1, 0, 0, 0], Fs2: [0.5, 1, 1, 1, 0, 1, 0, 1],
};
export const holesOf = (id: NoteId, f: Fingering): Holes => (f === "german" && GERMAN_HOLES[id]) || NOTES[id].holes;
