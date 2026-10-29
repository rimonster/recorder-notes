/**
 * A tune in standard notation, as static SVG: treble clef, key and time signatures, notes with stems, beams,
 * flags, dots and ties, ledger lines, accidentals, bar lines, and the note's name under each note.
 * The caller passes the meter and pickup. The key is chosen from the notes.
 */
import type { NoteId } from "./notes.ts";
import { barBeats, type Meter } from "./meter.ts";

/**
 * A tune the staff can draw.
 * - `id`: names the drawing (its SVG ids), any string.
 * - `tune`: each note and its length in beats (a quarter note is 1; triplets as 0.3333).
 * - `rests`: silence after a note, in beats, by the note's index.
 * - `marks`: "slur" into the next note, or "stacc" (staccato), by the note's index.
 * - `key`: the key signature to write, as its name starts ("1 sharp", "2 flats"…), when the notes alone don't show it
 *   (a tune with no F and no C fits both C and G major). Without it, the key the notes fit best.
 */
export interface StaffTune {
  id: string;
  tune: [NoteId, number][];
  rests?: number[];
  marks?: ("" | "slur" | "stacc")[];
  key?: string;
}

// Staff geometry: 10 units between lines, the bottom line (E4) is step 0, each step a line or a space.
const SP = 10, TOP = 34, BOTTOM = TOP + 4 * SP;
const yOf = (step: number) => BOTTOM - step * (SP / 2);

const STEP: Record<NoteId, number> = { C: -2, Cs: -2, D: -1, Eb: 0, E: 0, F: 1, Fs: 1, G: 2, Gs: 2, A: 3, Bb: 4, B: 4, C2: 5, Cs2: 5, D2: 6, E2: 7, F2: 8, Fs2: 8, G2: 9, A2: 10, Eb2: 7, Gs2: 9, Bb2: 11, B2: 11, C3: 12, D3: 13 };
const LETTER: Record<NoteId, string> = { C: "C", Cs: "C", D: "D", Eb: "E", E: "E", F: "F", Fs: "F", G: "G", Gs: "G", A: "A", Bb: "B", B: "B", C2: "C", Cs2: "C", D2: "D", E2: "E", F2: "F", Fs2: "F", G2: "G", A2: "A", Eb2: "E", Gs2: "G", Bb2: "B", B2: "B", C3: "C", D3: "D" };
const ALTER: Partial<Record<NoteId, number>> = { Cs: 1, Eb: -1, Fs: 1, Gs: 1, Bb: -1, Cs2: 1, Fs2: 1, Eb2: -1, Gs2: 1, Bb2: -1 };

/** The keys a recorder song might be in: their altered letters, and where their signs sit on the staff. */
const KEYS = [
  // Each key's home notes: the major one and its relative minor's (C major / A minor…).
  { acc: {} as Record<string, number>, signs: [] as [number, number][], home: ["C", "A"], name: "no sharps or flats: C major / A minor" },
  { acc: { F: 1 }, signs: [[8, 1]] as [number, number][], home: ["G", "E"], name: "1 sharp (F#): G major / E minor" },
  { acc: { B: -1 }, signs: [[4, -1]] as [number, number][], home: ["F", "D"], name: "1 flat (B♭): F major / D minor" },
  { acc: { F: 1, C: 1 }, signs: [[8, 1], [5, 1]] as [number, number][], home: ["D", "B"], name: "2 sharps (F#, C#): D major / B minor" },
  { acc: { B: -1, E: -1 }, signs: [[4, -1], [7, -1]] as [number, number][], home: ["B♭", "G"], name: "2 flats (B♭, E♭): B♭ major / G minor" },
  { acc: { F: 1, C: 1, G: 1 }, signs: [[8, 1], [5, 1], [9, 1]] as [number, number][], home: ["A", "F#"], name: "3 sharps (F#, C#, G#): A major / F# minor" },
  { acc: { F: 1, C: 1, G: 1, D: 1 }, signs: [[8, 1], [5, 1], [9, 1], [6, 1]] as [number, number][], home: ["E", "C#"], name: "4 sharps (F#, C#, G#, D#): E major / C# minor" },
  { acc: { B: -1, E: -1, A: -1 }, signs: [[4, -1], [7, -1], [3, -1]] as [number, number][], home: ["E♭", "C"], name: "3 flats (B♭, E♭, A♭): E♭ major / C minor" },
];
/**
 * The key needing the fewest accidentals in the song. On a tie (a song that never uses the note that tells two keys
 * apart, like London Bridge without any C), the key whose home note the song ends on (D major for a song ending on
 * D, not G major); then the simplest one.
 */
function keyOf(ids: NoteId[]) {
  const last = ids[ids.length - 1], end = last ? `${LETTER[last]}${(ALTER[last] ?? 0) < 0 ? "♭" : (ALTER[last] ?? 0) > 0 ? "#" : ""}` : "";
  let best = KEYS[0]!, cost = Infinity;
  for (const k of KEYS) {
    const c = ids.filter((id) => (k.acc[LETTER[id]] ?? 0) !== (ALTER[id] ?? 0)).length * 2 + (k.home.includes(end) ? 0 : 1);
    if (c < cost) [best, cost] = [k, c];
  }
  return best;
}

/** The key signature a song is written with, in words (for checking the sheets: scripts/qa-notation.mjs). */
/**
 * Songs whose key the notes alone get wrong: The Entertainer (moved to B♭ major) has one E natural and no E♭, which
 * would pick F major. By the key's name.
 */
/** The tune's own key when it gives one (see StaffTune.key), else the key its notes fit best. */
const keyFor = (song: StaffTune) => (song.key && KEYS.find((k) => k.name.startsWith(song.key!))) || keyOf(song.tune.map(([id]) => id));

export const keySignature = (song: StaffTune) => keyFor(song).name;

/** Note values that can be written as one note (in quarter beats), longest first. */
const VALUES = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25];
/** A triplet's note: a third of a half beat, beat or two (tunes write them 0.1667, 0.3333, 0.6667). */
const isTriplet = (d: number) => Math.abs(d * 6 - Math.round(d * 6)) < 0.01 && Math.abs(d * 4 - Math.round(d * 4)) > 0.01;
const snap = (d: number) => (Math.abs(d * 12 - Math.round(d * 12)) < 0.02 ? Math.round(d * 12) / 12 : d);
const split = (d: number) => {
  if (isTriplet(d)) return [d];
  const out: number[] = [];
  let left = d;
  while (left > 0.001) {
    const v = VALUES.find((x) => x <= left + 0.001) ?? 0.25;
    out.push(v);
    left -= v;
  }
  return out;
};

/** A writable piece: `v` its written value, `d` its length (they differ for a triplet's notes, written 3:2). */
/** A writable piece (`id` null: a rest). */
interface Piece { id: NoteId | null; v: number; d: number; trip: boolean; tieNext: boolean; first: boolean; at: number; n: number }
interface Bar { pieces: Piece[]; len: number }

/** The tune cut into bars, each note into writable pieces (tied across bar lines and inside them). */
function bars(tune: [NoteId, number][], meter: Meter, pickup: number, rests: number[] = []): Bar[] {
  const L = barBeats(meter), out: Bar[] = [];
  let bar: Bar = { pieces: [], len: pickup > 0 ? pickup : L }, pos = 0;
  // Each note, then its rest (a rest is never tied: split at bar lines and into writable values, each its own).
  const items: [NoteId | null, number, number][] = [];
  tune.forEach(([id, d], n) => {
    items.push([id, d, n]);
    if (rests[n]) items.push([null, rests[n]!, n]);
  });
  items.forEach(([id, d0, n]) => {
    const d = snap(d0);
    let left = d, first = true;
    while (left > 0.001) {
      const room = bar.len - pos, take = Math.min(left, room);
      const vals = split(take);
      vals.forEach((len, k) => {
        const trip = isTriplet(len);
        bar.pieces.push({ id, v: trip ? len * 1.5 : len, d: len, trip, first: first && k === 0, tieNext: !!id && (k < vals.length - 1 || left - take > 0.001), at: pos, n });
        pos += len;
      });
      first = false;
      left -= take;
      if (pos >= bar.len - 0.001) {
        out.push(bar);
        bar = { pieces: [], len: L };
        pos = 0;
      }
    }
  });
  if (bar.pieces.length) out.push({ ...bar, len: pos });
  return out;
}

/**
 * A rest's sign at x: whole (hanging from the 4th line), half (sitting on the 3rd), quarter (the zigzag), eighth and
 * sixteenth (a dot and a slanted stem, one flag each); a dot after a dotted one.
 */
function restSign(x: number, v: number) {
  const mid = TOP + 2 * SP, dotted = v === 3 || v === 1.5 || v === 0.75, base = dotted ? v / 1.5 : v;
  const dot = dotted ? `<circle cx="${x + 11}" cy="${mid - 3}" r="1.8" class="sb"/>` : "";
  if (base >= 4) return `<rect x="${x - 7}" y="${TOP + SP}" width="14" height="5" class="sb"/>`;
  if (base >= 2) return `<rect x="${x - 7}" y="${mid - 5}" width="14" height="5" class="sb"/>${dot}`;
  if (base >= 1) return `<path d="M${x - 2} ${mid - 15} l6 7 l-5 6 l5 7 c-5 -2 -8 1 -4 5 c-7 -3 -6 -9 0 -8 l-6 -7 l5 -6 z" class="sb"/>${dot}`;
  const flags = base >= 0.5 ? 1 : 2;
  let out = "";
  for (let f = 0; f < flags; f++) {
    const y = mid - 6 + f * 7;
    out += `<circle cx="${x - 3}" cy="${y}" r="2.6" class="sb"/><path d="M${x - 3} ${y + 1} q4 2 7 -2" class="st" fill="none"/>`;
  }
  return `${out}<line x1="${x + 4}" x2="${x - 1}" y1="${mid - 8}" y2="${mid + 10}" class="st"/>${dot}`;
}

const CLEF = `<path transform="translate(2,${TOP - 15}) scale(1.72)" d="m12.049 3.5296c0.305 3.1263-2.019 5.6563-4.0772 7.7014-0.9349 0.897-0.155 0.148-0.6437 0.594-0.1022-0.479-0.2986-1.731-0.2802-2.11 0.1304-2.6939 2.3198-6.5875 4.2381-8.0236 0.309 0.5767 0.563 0.6231 0.763 1.8382zm0.651 16.142c-1.232-0.906-2.85-1.144-4.3336-0.885-0.1913-1.255-0.3827-2.51-0.574-3.764 2.3506-2.329 4.9066-5.0322 5.0406-8.5394 0.059-2.232-0.276-4.6714-1.678-6.4836-1.7004 0.12823-2.8995 2.156-3.8019 3.4165-1.4889 2.6705-1.1414 5.9169-0.57 8.7965-0.8094 0.952-1.9296 1.743-2.7274 2.734-2.3561 2.308-4.4085 5.43-4.0046 8.878 0.18332 3.334 2.5894 6.434 5.8702 7.227 1.2457 0.315 2.5639 0.346 3.8241 0.099 0.2199 2.25 1.0266 4.629 0.0925 6.813-0.7007 1.598-2.7875 3.004-4.3325 2.192-0.5994-0.316-0.1137-0.051-0.478-0.252 1.0698-0.257 1.9996-1.036 2.26-1.565 0.8378-1.464-0.3998-3.639-2.1554-3.358-2.262 0.046-3.1904 3.14-1.7356 4.685 1.3468 1.52 3.833 1.312 5.4301 0.318 1.8125-1.18 2.0395-3.544 1.8325-5.562-0.07-0.678-0.403-2.67-0.444-3.387 0.697-0.249 0.209-0.059 1.193-0.449 2.66-1.053 4.357-4.259 3.594-7.122-0.318-1.469-1.044-2.914-2.302-3.792zm0.561 5.757c0.214 1.991-1.053 4.321-3.079 4.96-0.136-0.795-0.172-1.011-0.2626-1.475-0.4822-2.46-0.744-4.987-1.116-7.481 1.6246-0.168 3.4576 0.5 4.4576 1.996zm-4.2376-0.5c0.3518 2.452 0.6976 4.906 1.0424 7.36-1.9566 0.396-4.127 0.042-5.4974-1.474-1.7183-1.692-2.1097-4.598-0.6847-6.587 0.9796-1.395 2.3082-2.495 3.5292-3.666 0.296 1.666 0.5612 3.336 0.8072 5.012-2.2246 0.383-3.5376 2.874-2.6676 4.932 0.4562 1.084 1.6852 1.765 2.8146 1.586 0.2338-0.058-1.0408-0.592-1.4008-0.987-1.5582-1.379-0.4062-3.832 1.4428-4.18z"/>`;

const SHARP = "♯", FLAT = "♭", NATURAL = "♮";

/**
 * The staff for a song, or "" when its rhythm doesn't fit bars (see meters.ts).
 * `name(id)` labels each note under the staff (in the page's language).
 */
/** One layout, `W` units wide (680 for pages and paper, 400 for phones: fewer bars to a line, drawn larger). */
function layout(song: StaffTune, timing: [Meter | "none", number], name: (id: NoteId) => string, ariaLabel: string, W: number): string {
  const [meter, pickup] = timing;
  if (meter === "none") return "";
  const key = keyFor(song);
  const all = bars(song.tune, meter, pickup, song.rests);
  const group = meter === "6/8" ? 1.5 : 1;
  // Widths: a note's space grows with its length; accidentals add room.
  const pieceW = (p: Piece) => 15 + 24 * Math.sqrt(p.v);
  const head = (first: boolean) => 38 + key.signs.length * 10 + (first ? 26 : 0);
  // Break into systems.
  const systems: Bar[][] = [];
  let cur: Bar[] = [], used = head(true);
  for (const b of all) {
    const bw = 14 + b.pieces.reduce((n, p) => n + pieceW(p) + 6, 0);
    if (cur.length && used + bw > W - 6) {
      systems.push(cur);
      cur = [];
      used = head(false);
    }
    cur.push(b);
    used += bw;
  }
  if (cur.length) systems.push(cur);

  return systems.map((sys, si) => {
    const parts: string[] = [];
    const x0 = head(si === 0);
    const natural = sys.reduce((n, b) => n + 14 + b.pieces.reduce((m, p) => m + pieceW(p) + 6, 0), 0);
    // Stretch to the full width (the last line too, unless it is short).
    const stretch = si < systems.length - 1 || natural > (W - x0) * 0.6 ? (W - 8 - x0) / natural : 1;
    const H = 118;
    // Staff lines, clef, key, time.
    for (let i = 0; i < 5; i++) parts.push(`<line x1="0" x2="${si < systems.length - 1 || stretch !== 1 ? W - 8 : x0 + natural + 2}" y1="${TOP + i * SP}" y2="${TOP + i * SP}" class="sl"/>`);
    parts.push(CLEF);
    key.signs.forEach(([step, a], i) => parts.push(`<text x="${34 + i * 10}" y="${yOf(step) + 5}" class="acc">${a > 0 ? SHARP : FLAT}</text>`));
    if (si === 0) {
      const [num, den] = meter.split("/");
      parts.push(`<text x="${x0 - 18}" y="${TOP + 17}" class="ts">${num}</text><text x="${x0 - 18}" y="${TOP + 37}" class="ts">${den}</text>`);
    }
    // Notes, bar by bar.
    let x = x0;
    const ties: { x: number; y: number; up: boolean }[] = [];
    const placed: { p: Piece; x: number; y: number; step: number }[] = [];
    sys.forEach((b, bi) => {
      const seen: Record<string, number> = {};
      x += 6 * stretch;
      for (const p of b.pieces) {
        if (!p.id) {
          // A rest: its sign in the middle of the staff.
          parts.push(restSign(x + 9, p.v));
          x += (pieceW(p) + 6) * stretch;
          continue;
        }
        const step = STEP[p.id], y = yOf(step), w = (pieceW(p) + 6) * stretch;
        const nx = x + 9;
        // Accidental: when the note's sign differs from what the key (or this bar, so far) gives it.
        const k = `${LETTER[p.id]}${step}`, want = ALTER[p.id] ?? 0, has = seen[k] ?? key.acc[LETTER[p.id]] ?? 0;
        if (want !== has && p.first) {
          parts.push(`<text x="${nx - 17}" y="${y + 5}" class="acc">${want > 0 ? SHARP : want < 0 ? FLAT : NATURAL}</text>`);
          seen[k] = want;
        } else if (want !== has) seen[k] = want;
        // Ledger lines.
        for (let s = -2; s >= step; s -= 2) parts.push(`<line x1="${nx - 10}" x2="${nx + 10}" y1="${yOf(s)}" y2="${yOf(s)}" class="sl"/>`);
        for (let s = 10; s <= step; s += 2) parts.push(`<line x1="${nx - 10}" x2="${nx + 10}" y1="${yOf(s)}" y2="${yOf(s)}" class="sl"/>`);
        placed.push({ p, x: nx, y, step });
        // A tie from this piece to the next.
        if (p.tieNext) ties.push({ x: nx, y, up: step >= 4 });
        x += w;
      }
      const last = bi === sys.length - 1 && si === systems.length - 1;
      if (last) parts.push(`<line x1="${x}" x2="${x}" y1="${TOP}" y2="${BOTTOM}" class="bl"/><rect x="${x + 3}" y="${TOP}" width="4" height="${4 * SP}" class="sb"/>`);
      else parts.push(`<line x1="${x + 4 * stretch}" x2="${x + 4 * stretch}" y1="${TOP}" y2="${BOTTOM}" class="bl"/>`);
      x += 8 * stretch;
    });
    // Beams: short notes inside the same beat (or dotted-quarter beat in 6/8), two or more together.
    const beamed = new Set<number>();
    for (let i = 0; i < placed.length; ) {
      const a = placed[i]!;
      const g = Math.floor((a.p.at + 0.001) / group);
      let j = i;
      const barOf = (k: number) => sys.findIndex((b) => b.pieces.includes(placed[k]!.p));
      while (j + 1 < placed.length && placed[j + 1]!.p.v < 1 && a.p.v < 1 && Math.floor((placed[j + 1]!.p.at + 0.001) / group) === g && barOf(j + 1) === barOf(i) && placed[j + 1]!.p.at > placed[j]!.p.at) j++;
      if (j > i) {
        const ns = placed.slice(i, j + 1);
        const up = ns.reduce((n, q) => n + q.step, 0) / ns.length < 4;
        const yb = up ? Math.min(...ns.map((q) => q.y)) - 32 : Math.max(...ns.map((q) => q.y)) + 32;
        const sx = (q: (typeof ns)[number]) => (up ? q.x + 5.6 : q.x - 5.6);
        for (const q of ns) parts.push(`<line x1="${sx(q)}" x2="${sx(q)}" y1="${q.y}" y2="${yb}" class="st"/>`);
        parts.push(`<rect x="${sx(ns[0]!)}" y="${up ? yb : yb - 4}" width="${sx(ns[ns.length - 1]!) - sx(ns[0]!)}" height="4" class="sb"/>`);
        // Sixteenths: a second beam (or a stub).
        ns.forEach((q, k) => {
          if (q.p.v !== 0.25) return;
          const y2 = up ? yb + 7 : yb - 11;
          const nb = ns[k + 1]?.p.v === 0.25 ? ns[k + 1] : null;
          if (nb) parts.push(`<rect x="${sx(q)}" y="${y2}" width="${sx(nb) - sx(q)}" height="4" class="sb"/>`);
          else if (!(ns[k - 1]?.p.v === 0.25)) {
            const toward = k > 0 ? -8 : 8;
            parts.push(`<rect x="${Math.min(sx(q), sx(q) + toward)}" y="${y2}" width="8" height="4" class="sb"/>`);
          }
        });
        for (let k = i; k <= j; k++) beamed.add(k);
      }
      i = j + 1;
    }
    // Triplets: a 3 over each three of them (past the stems when they point up, just over the heads when down).
    for (let i = 0; i < placed.length; i++) {
      const trio = placed.slice(i, i + 3);
      if (trio.length < 3 || !trio.every((q) => q.p.trip) || !(Math.abs(trio.reduce((n, q) => n + q.p.d, 0) * 2 - Math.round(trio.reduce((n, q) => n + q.p.d, 0) * 2)) < 0.01)) continue;
      const up = trio.reduce((n, q) => n + q.step, 0) / 3 < 4;
      const ty = Math.max(12, Math.min(...trio.map((q) => q.y)) - (up ? 40 : 12));
      parts.push(`<text x="${(trio[0]!.x + trio[2]!.x) / 2}" y="${ty}" class="tp">3</text>`);
      i += 2;
    }
    // Heads, stems, flags, dots.
    placed.forEach((q, k) => {
      const v = q.p.v, hollow = v >= 2, up = q.step < 4;
      parts.push(`<ellipse cx="${q.x}" cy="${q.y}" rx="6.3" ry="4.6" transform="rotate(-20 ${q.x} ${q.y})" class="${hollow ? "nh" : "nf"}"/>`);
      if (v < 4 && !beamed.has(k)) {
        const sx = up ? q.x + 5.6 : q.x - 5.6, ey = up ? q.y - 34 : q.y + 34;
        parts.push(`<line x1="${sx}" x2="${sx}" y1="${q.y}" y2="${ey}" class="st"/>`);
        const flags = v === 0.5 || v === 0.75 ? 1 : v === 0.25 ? 2 : 0;
        for (let f = 0; f < flags; f++) {
          const fy = up ? ey + f * 7 : ey - f * 7;
          parts.push(up ? `<path d="M${sx} ${fy} c1 6 9 8 8 18 c-1-6-5-9-8-10z" class="sb"/>` : `<path d="M${sx} ${fy} c1-6 9-8 8-18 c-1 6-5 9-8 10z" class="sb"/>`);
        }
      }
      if (v === 3 || v === 1.5 || v === 0.75) parts.push(`<circle cx="${q.x + 10}" cy="${q.step % 2 === 0 ? q.y - 4 : q.y}" r="1.8" class="sb"/>`);
      if (q.p.first) parts.push(`<text x="${q.x}" y="${BOTTOM + 30}" class="nm">${name(q.p.id!)}</text>`);
    });
    // Ties: from a note to the next one.
    for (const t of ties) {
      const nxt = placed.find((q) => q.x > t.x + 0.5);
      const ex = nxt ? nxt.x - 4 : t.x + 26;
      const dy = t.up ? -1 : 1, y = t.y + dy * 7;
      parts.push(`<path d="M${t.x + 4} ${y} Q${(t.x + ex) / 2} ${y + dy * 9} ${ex} ${y}" class="tie"/>`);
    }
    // Slurs (Tonguing & slurs): an arc from a group's first note to its last, over the heads (under them when the
    // stems point down), cut at the line's ends when the group goes on to the next line.
    const marks = song.marks ?? [];
    const lineW = si < systems.length - 1 || stretch !== 1 ? W - 8 : x0 + natural + 2;
    marks.forEach((m, n) => {
      if (m !== "slur" || marks[n - 1] === "slur") return;
      let end = n + 1;
      while (marks[end] === "slur") end++;
      const inGroup = placed.filter((q) => q.p.n >= n && q.p.n <= end);
      if (!inGroup.length) return;
      // Under the heads when every stem points up; otherwise over them, clear of any stem pointing up.
      const a = inGroup[0]!, b = inGroup[inGroup.length - 1]!, above = !inGroup.every((q) => q.step < 4);
      const dy = above ? -1 : 1, y = above ? Math.min(...inGroup.map((q) => (q.step < 4 && q.p.v < 4 ? q.y - 40 : q.y - 9))) : Math.max(...inGroup.map((q) => q.y)) + 9;
      const xa = a.p.n === n ? a.x : x0 - 4, xb = b.p.n === end ? b.x : lineW;
      parts.push(`<path d="M${xa} ${y} Q${(xa + xb) / 2} ${y + dy * Math.min(16, 6 + (xb - xa) * 0.06)} ${xb} ${y}" class="tie"/>`);
    });
    // Staccato: a dot by the head, on the side away from the stem.
    for (const q of placed) if (q.p.first && marks[q.p.n] === "stacc") parts.push(`<circle cx="${q.x}" cy="${q.step < 4 ? q.y + 10 : q.y - 10}" r="1.9" class="sb"/>`);
    return `<svg class="staff-sys" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ariaLabel}" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
  }).join("");
}

/**
 * The staff for a song, or "" when its rhythm doesn't fit bars (see meters.ts): a wide layout, and a narrow one that
 * phones show instead. `name(id)` labels each note under the staff (in the page's language).
 */
export function staffSvg(song: StaffTune, timing: [Meter | "none", number], name: (id: NoteId) => string, ariaLabel = "Sheet music"): string {
  const wide = layout(song, timing, name, ariaLabel, 680);
  return wide ? `<div class="staff-w">${wide}</div><div class="staff-n">${layout(song, timing, name, ariaLabel, 400)}</div>` : "";
}

/** The staff for an A4 songbook page: one wide layout, more bars on each line (so a long song fits its page). */
export function staffBook(song: StaffTune, timing: [Meter | "none", number], name: (id: NoteId) => string, ariaLabel = "Sheet music"): string {
  const svg = layout(song, timing, name, ariaLabel, 1100);
  return svg ? `<div class="staff-b">${svg}</div>` : "";
}

/** Styles for the staff (in the page's own CSS). */
export const STAFF_CSS = `
.staff{direction:ltr;background:#fff;border-radius:14px;padding:6px 4px}
.staff-sys{display:block;width:100%;height:auto;max-width:760px;margin:0 auto}
.staff-n{display:none}@media screen and (max-width:620px){.staff-w{display:none}.staff-n{display:block}}
.staff .sl{stroke:#2B1B3D;stroke-width:1.1}.staff .bl{stroke:#2B1B3D;stroke-width:1.4}.staff .st{stroke:#2B1B3D;stroke-width:1.5}
.staff .sb,.staff .nf,.staff path:not(.tie){fill:#2B1B3D}.staff .nh{fill:#fff;stroke:#2B1B3D;stroke-width:1.7}
.staff .tie{fill:none;stroke:#2B1B3D;stroke-width:1.4}
.staff .acc{font:20px "Times New Roman",serif;fill:#2B1B3D;text-anchor:middle}
.staff .ts{font:bold 22px "Times New Roman",serif;fill:#2B1B3D;text-anchor:middle}
.staff .nm{font:600 11px Nunito,system-ui,sans-serif;fill:#6B5A7E;text-anchor:middle}
.staff .tp{font:italic bold 13px "Times New Roman",serif;fill:#2B1B3D;text-anchor:middle}
`;
