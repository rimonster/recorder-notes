/** Time signatures the staff can draw. Beats are quarter notes (a 6/8 bar is 3 beats). */
export type Meter = "4/4" | "3/4" | "2/4" | "6/8";

/** Beats in a bar. */
export const barBeats = (m: Meter) => (m === "4/4" ? 4 : m === "2/4" ? 2 : 3);
