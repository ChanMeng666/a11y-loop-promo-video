# Background music — Suno prompt

The film runs **2:51**. Ask Suno for **3 minutes** and trim the tail; asking for exactly 2:51 tends
to produce a rushed ending.

Save the download as `public/bgm.mp3`. The mix ducks it to **18%** under every voiceover cue and
lifts it back between them, so it does not need to be quiet at source — a full, confident mix
gives the ducking something to work with.

## Primary prompt — warm documentary

Use this one. It matches the ink-on-paper palette and the unhurried narration, and it leaves room
for the cold open, which runs on room tone and keystrokes with no music at all for the first
14 seconds.

```
Warm minimal acoustic-electronic instrumental. Calm, hopeful, unhurried, human.
Opens sparse and quiet: soft felt piano, a single sustained note, gentle room tone.
Around 0:20 a light pulse enters — muted upright bass and brushed percussion.
Builds patiently into a bright, uplifting mid-tempo groove with warm analog synth
pads and soft marimba. Never busy, never aggressive, no big drop.
Final third opens up, confident and resolved, then settles.
Instrumental only. No vocals, no distorted synths, no heavy drums.
Documentary tech feel — a design studio, not a sci-fi trailer.
A major, 92 BPM, 3 minutes.
```

## Alternate — modern minimal

If the primary reads too soft or too sentimental against the terminal scenes.

```
Modern minimal electronic instrumental, clean and precise. Ink-on-paper mood.
Muted plucked synth motif over a steady, understated four-on-the-floor pulse.
Airy pads, subtle vinyl texture, occasional soft bell accents marking structure.
Restrained and confident throughout — a tool that works, not a product launch.
No vocals, no risers, no drops, no aggressive bass.
C major, 100 BPM, 3 minutes.
```

## What to reject

Regenerate if the result has any of these — each one fights the film rather than supporting it:

- **Vocals or vocal chops.** They compete directly with the narration.
- **A riser into a drop.** The film has no drop to land on, and scene 8 deliberately gets quieter
  where a conventional promo would peak.
- **Aggressive sidechain pumping.** The mix already ducks for voice; two ducking systems fighting
  each other sounds broken.
- **Anything that lurches in the first 20 seconds.** The cold open needs to stay uncomfortable.

## Structural landmarks to listen for

The music does not need to hit these exactly, but a take that roughly follows the shape will need
far less manual gain automation:

| Time | Scene | What the music should be doing |
|---|---|---|
| 0:00–0:14 | the barrier | nothing — the mix mutes BGM entirely here |
| 0:14 | why this happens | first entry, sparse |
| 0:32 | thesis | first lift |
| 0:43–1:27 | the loop, five passes | steady bed, no events |
| 1:29 | before → after | the one moment a small lift is welcome |
| 2:09 | what it will not tell you | thin out — nearly silent is right |
| 2:29 | portable · CTA | open up and resolve |
