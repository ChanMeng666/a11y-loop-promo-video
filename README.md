# a11y-loop — promotional / feature video

A 2:59 film about [a11y-loop](https://github.com/ChanMeng666/a11y-loop), built with
[Remotion](https://remotion.dev), narrated with [ElevenLabs](https://elevenlabs.io), scored with
[Suno](https://suno.com), and assembled with Claude Code.



https://github.com/user-attachments/assets/f0511bbc-938b-4797-9930-eb5c278fede9



| | |
|---|---|
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Duration | 2:59 (5370 frames) |
| Masters | standard · reduced-motion · SRT + VTT sidecars |
| Type | Archivo (display) · Inter (body) · JetBrains Mono (code) |
| Palette | two grounds, warm paper and ink — 17 pairs verified with `a11y-loop contrast` |

## Two rules this project runs on

### 1. One idea per beat

The narration and the open captions already carry every word. Anything else on
screen that repeats them is pure cognitive load — so a beat gets **one headline
of six words or fewer, and one supporting element**. Nothing more.

The first cut ignored this and it showed. Scene 5 put a five-pane image strip,
twenty-odd fragments of label text, a headline, an eyebrow and a two-line
callout on screen at once — and then faded a *second* complete layout in over
the top without ever removing the first, so two designs rendered stacked. That
was a structural bug, not a styling problem, and it is now impossible to write:
`<Beats>` owns scene switching and only one beat exists at a time.

`<Stage>` enforces the other half. Content is clipped to a safe box; the bottom
230px belongs to the caption plate and no scene can render into it.

**The signature is a focus ring.** Not a logo — the project's drawn mark was
dropped. A focus indicator is the thing `demo/before` is missing, the thing the
tool restores, and the reason the keyboard user in scene 1 has no idea where
they are. So it is the film's only emphasis device: the important element in a
beat is the element with focus.

### 2. Nothing on screen is mocked up

Every page, every terminal, every number comes from running the real tool against the real demo
pages, captured by the scripts in `capture/`. If a claim can't be captured, it doesn't go in the
film.

That rule has teeth. Three things changed during production because measuring them contradicted
the estimate:

- The accent colour was going to be `#0B57D0`. Measured: **6.10:1** — AA, but not AAA, and scene 3
  puts that check on screen. It is now `#1D3FBF`, **7.66:1**.
- The paper hairline measured **1.61:1** against SC 1.4.11's 3:1. Decorative rules are arguably
  exempt; a film arguing for accessible defaults shouldn't lean on an exemption. Now `#8A8378`,
  3.44:1.
- The `contrast --fix` demo was going to use `#767676` on white, the grey everyone reaches for as a
  failing example. It **passes**, at 4.54:1. Replaced with a genuinely failing pair from the demo
  page — `#6d7a82` on white, 4.41:1, a miss by 0.09.
- The ink-ground hairline measured **1.67:1** against SC 1.4.11's 3:1. The gate only caught it once
  its pair list was updated to the rebuilt palette — before that it had been verifying colours the
  film no longer used and reporting all-clear, so it now fails if its list and `src/constants.ts`
  disagree on how many pairs exist.

`npm run verify` re-checks every on-screen number against its capture and exits non-zero if one has
drifted.

## Structure

| # | Scene | Time | What carries it |
|---|---|---|---|
| 1 | The barrier | 0:00–0:14 | Keyboard walk of `demo/before`. One filename, one key, four words. |
| 2 | Why this keeps happening | 0:13.5–0:31.5 | **ink** · `84%`, then `17.32%` vs `15.93%` |
| 3 | Thesis | 0:31–0:42 | Wordmark, and the film checking its own accent colour |
| 4 | The loop | 0:41.5–1:04.5 | Two cards, then `write → audit → fix` and the return arrow |
| 5 | Five passes | 1:04–1:31 | Five panes · three checks · `163 → 179` |
| 6 | Before → after | 1:30.5–1:54.5 | `163 → 0`, the real `diff` verdict, the same keystrokes |
| 7 | The benchmark | 1:54–2:10 | `35` vs `1`, then the caveat on its own |
| 8 | What it will not tell you | 2:09.5–2:31.5 | **ink** · `57%`, `31%`, and three questions |
| 9 | Portable · CTA | 2:31–2:59 | Four clients, then **ink** · the command and the closing line |

Scene 8 is twenty-two seconds spent on what the tool *cannot* do — and it is the quietest scene in
the film, where a promo would peak. For the audience this project is for, a tool that oversells its
coverage is worse than no tool.

The ink scenes are not decoration either. A film about a tool that audits dark mode should work in
both polarities, and the alternation gives the eye somewhere to rest across three minutes.

## The video's own accessibility

- **Open captions**, always on, burned in, and they never fade. A cross-fading plate looked smoother
  on the paper scenes and became a grey translucent box over the ink ones, dropping the caption
  below AA for the length of every transition.
- **`.srt` and `.vtt` sidecars** plus [`docs/transcript.md`](docs/transcript.md), so the content is
  reachable without playback.
- **Audio-description-first narration** — the script describes what is happening rather than
  commenting on it, so nothing is picture-only and no separate AD track is needed.
- **A reduced-motion master.** Same timeline, wipes become cross-fades, parallax off, counters jump
  rather than roll.
- **A flash gate.** `npm run verify:flash` walks the rendered file with ffmpeg and fails if any
  second contains more than three luminance flashes (SC 2.3.1). It is a screening test on
  whole-frame average luminance, not PEAT — stated plainly in the script's own output.
- **Sound is never load-bearing.** Every cue has a visual equivalent.

## Getting started

```bash
npm install

# 1. Capture everything from the real tool (needs the a11y-loop repo as a sibling
#    directory, or set A11Y_LOOP_REPO). Takes about a minute.
npm run capture

# 2. Preview
npm run dev
```

Audio is optional for preview — the mix is guarded, so the film renders silent until the files
exist.

```bash
# 3. Narration + SFX (costs ElevenLabs credits; --dry previews for free)
cp .env.example .env          # add ELEVENLABS_API_KEY
npm run generate-audio -- --dry
npm run generate-audio

# 4. Background music — paste docs/suno-prompt.md into Suno, save as public/bgm.mp3

# 5. Render
npm run render                # out/a11y-loop-promo.mp4
npm run render:reduced        # out/a11y-loop-promo-reduced-motion.mp4
npm run captions              # out/a11y-loop-promo.srt + .vtt

# 6. Gates
npm run verify                # assets present, on-screen numbers match captures
npm run verify:palette        # every colour pair, checked by a11y-loop itself
npm run verify:flash          # SC 2.3.1 screening on the rendered file
```

## Layout

```
capture/            every frame of real software in the film
  record-keyboard   the keyboard walks + tab ring + dialog focus-trap measurement
  shoot-passes      the five-render matrix, with contrast measured per pass
  run-cli           real audit / diff / contrast runs, captured verbatim
  sync-data         manifests → src/data/, so the bundle compiles against them
  verify-*          the gates
scripts/            ElevenLabs generation, caption sidecars
src/
  captions/script.json   ← single source of truth for all narration
  data/                  ← captured manifests: every number the film claims
  sections/              ← the nine scenes
  components/            ← Stage (the layout law), Terminal, KeyboardWalk, Captions
docs/
  transcript.md     full script, shot list, and the provenance of every number
  suno-prompt.md    background-music prompts
```

`src/captions/script.json` feeds three consumers — the ElevenLabs input, the burned-in captions,
and the SRT/VTT. Edit it there and nowhere else.

## Notes

- Remotion requires a company licence for some organisations. This is a personal open-source
  project, so the free licence applies — [read the terms](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
- The conference site in the demo footage, "Aotearoa Web Summit 2026", is fictional and invented for
  a11y-loop's demo. It is not modelled on any real event or organisation.
- ElevenLabs music generation needs a paid plan, which is why the score comes from Suno.

## License

UNLICENSED — this is a promotional asset, not a reusable template. The tool it documents is MIT.
