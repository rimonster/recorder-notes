/**
 * A player's steady tuning, learned while they play. Blowing hard (far from the microphone, or just eager) makes a
 * recorder or an ocarina sound sharp, the same amount on every note; past half a semitone each note would be read as
 * the next one up (G as G#). So while a note is wanted and the player sounds close to it, the tuner slowly learns
 * how far off they are, and pitches are read with that taken out, like a tuner set to the player's A.
 *
 * Safe both ways: an in-tune player's offset stays near 0 (nothing changes for them), and a wrong fingering (a whole
 * semitone away) is too far to learn from and the offset too small (at most MAX) to pull it over.
 */
export class Tuner {
  /** The learned offset, in cents (sharp: positive). */
  cents = 0;
  /** At most this far either way: a third of a semitone. */
  static MAX = 35;
  /** Only pitches this close to the wanted note teach it (a wrong fingering is 100 away). */
  static NEAR = 62;
  /** How fast it learns: about this many milliseconds of a held note to move most of the way. */
  static SETTLE_MS = 1500;

  /**
   * A frame of a held note while `wantHz` is wanted, `ms` long: learn from it if it's close. `rawHz` is the pitch
   * as heard (before correction).
   */
  learn(rawHz: number, wantHz: number, ms: number) {
    if (!rawHz || !wantHz) return;
    const off = 1200 * Math.log2(rawHz / wantHz);
    if (Math.abs(off) > Tuner.NEAR) return;
    const k = Math.min(1, ms / Tuner.SETTLE_MS);
    this.cents = Math.max(-Tuner.MAX, Math.min(Tuner.MAX, this.cents + (off - this.cents) * k));
  }

  /** A pitch as heard, with the player's offset taken out. */
  correct(hz: number) {
    return hz ? hz * 2 ** (-this.cents / 1200) : 0;
  }

  /** How far off the wanted note a pitch is now, after correction, in cents (for "a little high / low" hints). */
  offBy(rawHz: number, wantHz: number) {
    return rawHz && wantHz ? 1200 * Math.log2(rawHz / wantHz) : 0;
  }
}
