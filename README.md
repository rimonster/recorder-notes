# Recorder notes

A small toolkit for a soprano recorder: the notes and fingerings (baroque and German), a pitch detector, and a staff drawn as SVG.

By [Head Arcade](https://recorderhero.com). MIT.

This is the part of [Recorder Hero](https://recorderhero.com) that is safe to share. The game, accounts, payments, song packs, and the site's words stay in the private project. The song list (which tune is in which meter) stays there too: pass a meter in when you draw a staff.

## Use

```ts
import { NOTES, holesOf, noteOf, pitchOf, staffSvg } from "@headarcade/recorder-notes";

holesOf("F", "german");
noteOf(pitchOf(samples, sampleRate).hz);
staffSvg({ id: "tune", tune: [["G", 1], ["G", 1], ["G", 1], ["G", 1]] }, ["4/4", 0], (id) => NOTES[id].name);
```

`samples` is one mono frame. Recorder Hero passes 2048 samples from an AnalyserNode. Shorter than about 1024 samples plus the longest lag returns no pitch.

Not on npm yet. Recorder Hero imports this folder directly, so the game and the package cannot drift apart.
