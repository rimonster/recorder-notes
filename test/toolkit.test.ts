import assert from "node:assert/strict";
import { test } from "node:test";
import { GERMAN_HOLES, IDS, NOTES, holesOf } from "../src/notes.ts";
import { noteOf, pitchOf } from "../src/pitch.ts";
import { staffSvg } from "../src/staff.ts";

test("German fingering differs only for F and F#", () => {
  assert.deepEqual(Object.keys(GERMAN_HOLES).sort(), ["F", "F2", "Fs", "Fs2"]);
  assert.notDeepEqual(holesOf("F", "german"), holesOf("F", "baroque"));
  assert.deepEqual(holesOf("G", "german"), NOTES.G.holes);
  for (const id of IDS) assert.equal(holesOf(id, "baroque").length, 8);
});

/** A steady tone, plus a little noise, one AnalyserNode frame long. */
function tone(hz: number, rate: number) {
  const x = new Float32Array(2048);
  let s = 1;
  for (let i = 0; i < x.length; i++) {
    s = (s * 16807) % 2147483647;
    x[i] = 0.2 * Math.sin((2 * Math.PI * hz * i) / rate) + ((s / 2147483647) - 0.5) * 0.02;
  }
  return x;
}

test("every note is heard within 35 cents, with noise, at 44.1 and 48 kHz", () => {
  for (const rate of [44100, 48000]) {
    for (const id of IDS) {
      for (const cents of [-35, 0, 35]) {
        const hz = NOTES[id].hz * 2 ** (cents / 1200);
        const heard = noteOf(pitchOf(tone(hz, rate), rate).hz);
        assert.equal(heard.id, id, `${id} at ${cents} cents, ${rate} Hz`);
      }
    }
  }
});

test("silence and a pitch between notes are not a note", () => {
  assert.equal(pitchOf(new Float32Array(2048), 48000).hz, 0);
  assert.equal(noteOf(0).id, null);
  assert.equal(noteOf(NOTES.G.hz * 2 ** (0.5 / 12)).id, null);
});

test("a staff draws a bar of G", () => {
  const svg = staffSvg({ id: "demo", tune: [["G", 1], ["G", 1], ["G", 1], ["G", 1]] }, ["4/4", 0], (id) => NOTES[id].name);
  assert.match(svg, /staff-sys/);
  assert.match(svg, /aria-label="Sheet music"/);
  assert.equal(staffSvg({ id: "free", tune: [["G", 1]] }, ["none", 0], (id) => id), "");
});
