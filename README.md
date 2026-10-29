# recorder-notes

A small toolkit for the **soprano (descant) recorder**:

- **Notes and fingerings**: 26 notes from low C to top D, baroque fingering, with German fingering where it differs.
- **A pitch detector** tuned to the recorder's range: give it a microphone frame, get the note.
- **Sheet music as SVG**: a tune (notes and lengths) drawn on a staff, with bars, rests, ties, slurs, staccato,
  triplets and the key signature.

No dependencies, no build step needed in the browser, works in any framework. MIT licensed.

It's the part of [Recorder Hero](https://recorderhero.com), a free game that teaches children the recorder, that is
useful on its own. Made by [Head Arcade](https://headarcade.com).

## Install

```sh
npm install github:rimonster/recorder-notes
```

(Not on the npm registry yet.)

## Notes and fingerings

```ts
import { NOTES, IDS, holesOf } from "@headarcade/recorder-notes";

NOTES.A;               // { name: "A", hz: 880, holes: [1, 1, 1, 0, 0, 0, 0, 0], color: "#4dd2ff" }
holesOf("F", "german"); // [1, 1, 1, 1, 1, 0, 0, 0]
IDS;                   // ["C", "Cs", "D", "Eb", "E", "F", "Fs", "G", … "C3", "D3"]
```

- **Note ids**: the letter, `s` for sharp, `b` for flat, and `2` or `3` for the higher octaves. `C` is the
  recorder's lowest note (C5, 523 Hz); `C2` is the C above it.
- **`holes`**: eight numbers, the thumb hole at the back first, then holes 1–3 (left hand) and 4–7 (right hand).
  `1` is covered, `0` open, `0.5` half (a pinched thumb, or half of a double hole).
- **`holesOf(id, "baroque" | "german")`**: the fingering in either system. They differ only for F and F#, low and
  high.
- **`color`**: one colour per note, if you want your notes colour-coded like Recorder Hero's.

## Hearing a note

```ts
import { pitchOf, noteOf } from "@headarcade/recorder-notes";

const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const ctx = new AudioContext();
const analyser = ctx.createAnalyser();
analyser.fftSize = 2048;
ctx.createMediaStreamSource(stream).connect(analyser);

const frame = new Float32Array(analyser.fftSize);
function listen() {
  analyser.getFloatTimeDomainData(frame);
  const { hz, level } = pitchOf(frame, ctx.sampleRate);
  const { id } = noteOf(hz);
  if (id) console.log(id, Math.round(hz), "Hz");
  requestAnimationFrame(listen);
}
listen();
```

- **`pitchOf(samples, sampleRate)`** returns `{ hz, level }`: the pitch (0 when there is none) and the loudness.
  It uses the YIN method, between 450 and 2600 Hz.
  - **Too short:** a frame under about 1100 samples at 48 kHz gives no pitch. 2048 is a good size.
  - **Too quiet:** below a level of 0.01 it doesn't try.
- **`noteOf(hz)`** returns `{ id, octaveUp }`.
  - **`id`:** the recorder note within a quarter tone, or `null` between notes.
  - **`octaveUp`:** the note an octave lower, when there is one. Over-blowing a recorder jumps an octave, so this
    tells you what the player probably meant.

Tested on every note, 35 cents sharp and flat, with background noise, at 44.1 and 48 kHz (`npm test`).

## Sheet music

```ts
import { staffSvg, STAFF_CSS, NOTES } from "@headarcade/recorder-notes";

const twinkle = {
  id: "twinkle",
  tune: [["C", 1], ["C", 1], ["G", 1], ["G", 1], ["A", 1], ["A", 1], ["G", 2]],
};
document.head.insertAdjacentHTML("beforeend", `<style>${STAFF_CSS}</style>`);
el.innerHTML = staffSvg(twinkle, ["4/4", 0], (id) => NOTES[id].name);
```

- **`staffSvg(tune, [meter, pickup], name, ariaLabel?)`** returns an SVG string.
  - **Lines:** they wrap to the width they're shown at.
  - **`meter`:** `"4/4"`, `"3/4"`, `"2/4"`, `"6/8"`, or `"none"` for no staff.
  - **`pickup`:** the beats before the first bar line (0 for none).
  - **`name(id)`:** the note's name under each note, so you can write Do Re Mi, or another language.
- **`staffBook(...)`** is the same, laid out for an A4 page.
- **`keySignature(tune)`** gives the key it writes, for example `"1 sharp (F#): G major / E minor"`.
- **A tune:**
  - **Note lengths:** in beats; a quarter note is 1, and a triplet note is 0.3333.
  - **`rests`:** the silence after each note, by the note's index.
  - **`marks`:** `"slur"` into the next note, or `"stacc"` for staccato.
  - **`key`:** for a tune whose notes don't show its key (`"1 sharp"`, `"2 flats"`).

## Licence

MIT, © 2026 Head Arcade. If you build something with it, a link to [recorderhero.com](https://recorderhero.com) is
appreciated, not required.
