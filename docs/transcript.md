# a11y-loop — narration script, shot list, and transcript

**Runtime** 2:59 (5370 frames @ 30fps, 1920×1080)
**Narration** ElevenLabs TTS, calm narration voice, ~140 wpm — deliberately slower than promo
standard, because pace is a cognitive-accessibility issue.
**Total spoken** ~285 words / ~139s. The remaining 40s is deliberate silence: room tone under the
cold open, and beats where the picture is doing the work.

This file is the single source of truth for three things — the ElevenLabs input, the open captions
burned into the picture, and the sidecar `.srt` / `.vtt`. Change the words here, not downstream.

## Two rules the script is written under

**1. Audio-description-first.** The narration describes what is happening on screen rather than
commenting on it. Nothing meaningful is conveyed by picture alone, so no separate audio-description
track is needed. Where you see a line like *"They press Tab. Nothing moves."* — that is the AD doing
its job, not colour commentary.

**2. TTS pronunciation.** `a11y` is spoken **"ally"** (the numeronym reads as *a-11-y*, and "ally"
is both the common pronunciation and the better word for this project). The ElevenLabs input uses
the phonetic spelling `Ally-loop`; the caption and every on-screen instance read `a11y-loop`.

---

## Scene 1 · The barrier — 0:00–0:14

**Picture.** Real capture of `demo/before/index.html`, the fictional "Aotearoa Web Summit 2026"
page. Held still for a beat. A key-press chip appears bottom-left — drawn by Remotion, not injected
into the page. `Tab`: the view jerks to the *bottom* of the page, into the registration form,
because that field carries `tabindex="1"`. `Tab` again, `Tab` again — and on the third the view
snaps back up to the hero. Nothing anywhere on screen shows where focus is: measured across all
eight stops in the walk, **0 of 8** have any visible focus indicator (`outline: none`, no
replacement). `Enter` on the eighth stop does nothing useful.

A dashed editorial marker tracks where focus actually is, labelled *focus is here — the page shows
you nothing*. It is clearly an annotation, drawn from the recorded `activeElement` rectangle. The
page itself is untouched.

**Measured, on screen in small type:** 22 tab stops on this page · "Register now — $340" is not one
of them.

**Sound.** Room tone. A soft mechanical keystroke per Tab. On the failed Enter, a low muted thud —
the sound of a dead end. No music yet.

| Cue | In | Out | Caption |
|---|---|---|---|
| — | 0:00 | 0:05 | *(no speech — keystrokes only)* |
| VO01a | 0:05 | 0:09 | Someone is booking a ticket, using only a keyboard. |
| VO01b | 0:09 | 0:11.2 | They press Tab. Nothing moves. |
| VO01c | 0:11.2 | 0:14 | They press Enter. Nothing happens. |

> **ElevenLabs input (vo-01-barrier.mp3):**
> Someone is booking a ticket, using only a keyboard. They press Tab. Nothing moves. They press
> Enter. Nothing happens.

---

## Scene 2 · Why this keeps happening — 0:13.5–0:31.5

**Picture.** Cut to paper. Three facts, one at a time, each with its source set beneath it in
`muted`. The numbers count up. The third fact lands as a stacked list of the six failure classes
(low contrast · missing alt text · empty links · missing form labels · empty buttons · missing
document language) with a small "2016 → 2026" rail beside it showing they have not moved.

**Sound.** Music enters — soft felt piano, sparse.

| Cue | In | Out | Caption |
|---|---|---|---|
| VO02a | 0:16 | 0:19 | It isn't that developers don't care. |
| VO02b | 0:19 | 0:24 | 84% of AI-generated pages ship with accessibility failures. |
| VO02c | 0:24 | 0:30 | And telling the model to be accessible measures slightly worse than not mentioning it at all. |

**On screen (exact):**
- `84%` — of AI-generated web pages carry accessibility issues · *W4A '24*
- `17.32%` vs `15.93%` — violation rate with accessibility-oriented prompts vs
  accessibility-agnostic ones · *W4A '25*
- The same six failures have topped the WebAIM Million every year for a decade · *WebAIM Million*

> **ElevenLabs input (vo-02-why.mp3):**
> It isn't that developers don't care. Eighty-four percent of A.I. generated pages ship with
> accessibility failures. And telling the model to be accessible measures slightly worse than not
> mentioning it at all.

---

## Scene 3 · Thesis — 0:31–0:42

**Picture.** The loop mark draws itself — an arc that closes into a circle — then the wordmark
`a11y-loop` sets beneath it. The three-clause thesis types in one clause at a time. Underneath, the
real terminal capture of `a11y-loop contrast "#0B4AA8" "#FAFAF7"` →
`7.84:1 · PASS AA (4.5:1) · PASS AAA (7:1)`. Small line beneath, in `muted`: *"the colours in this
video, checked with the tool in this video."*

> The first accent picked for this film measured 6.10:1 — AA, but not AAA. It was darkened until the
> number on screen was unambiguous. Noted here because the film is about not overstating results.

**Sound.** A single soft affirmative chime on `PASS`.

| Cue | In | Out | Caption |
|---|---|---|---|
| VO03a | 0:33 | 0:35 | a11y-loop. |
| VO03b | 0:35 | 0:38 | Write accessible UI by default. |
| VO03c | 0:38 | 0:41.5 | Verify it in a real browser. Then say exactly what you couldn't check. |

> **ElevenLabs input (vo-03-thesis.mp3):**
> Ally-loop. Write accessible U.I. by default. Verify it in a real browser. Then say exactly what
> you couldn't check.

---

## Scene 4 · The loop — 0:41.5–1:04.5

**Picture.** The loop diagram assembles: **skill** → *agent writes UI* → **`a11y-loop audit`** →
*findings* → back to the agent → **`diff`** confirms. Then the diagram recedes and a Claude Code
transcript replays in its place — the real record from `evals/outputs/skilled/loop-log.md`,
including the `header-nav` Playwright timeout and the self-inflicted SVG-quoting bug. A small
persistent label reads *recorded session*.

**Sound.** A soft tick as each arrow completes. Keystroke texture under the transcript.

| Cue | In | Out | Caption |
|---|---|---|---|
| VO04a | 0:43 | 0:47.7 | It's two things. A skill that sets the rules while the agent writes the code. |
| VO04b | 0:47.7 | 0:53.5 | And a tool that opens a real browser and checks what actually rendered. |
| VO04c | 0:53.5 | 0:57.2 | Findings go back to the agent — |
| VO04d | 0:57.2 | 1:02.5 | it fixes them and audits again, until nothing's left. |

> **ElevenLabs input (vo-04-loop.mp3):**
> It's two things. A skill that sets the rules while the agent writes the code. And a tool that
> opens a real browser and checks what actually rendered. Findings go back to the agent — it fixes
> them and audits again, until nothing's left.

---

## Scene 5 · Five passes · what axe-core can't see — 1:04–1:31

**Picture.** The same page renders five times in a 5-up strip: default 1280×720, dark, forced
colours, reduced motion, 320×256 reflow. Four are clean; the **dark** pane pulses and a callout
pulls out of it — a contrast failure that exists only there. Then a second panel lists the checks
with no axe-core rule behind them, each ticking in: focus visibility · dialog focus trap, Escape,
focus return · target size 24×24 · tab order · div-as-button.

Closing beat, and the strongest number in the scene: the same page audited on load reports **163**
failures. Audited with `--interact` driving the registration dialog and the mobile nav — states
that do not exist until someone acts — it reports **179**. Sixteen failures that a page-load scan
cannot see, because on load there is nothing there to scan.

**Sound.** A small tick per pass. A single low pulse on the dark-mode failure.

| Cue | In | Out | Caption |
|---|---|---|---|
| VO05a | 1:06 | 1:13.2 | Every audit renders the page five ways — default, dark, forced colours, reduced motion, and a 320-pixel viewport. |
| VO05b | 1:13.2 | 1:17.4 | Most failures only show up in one of them. |
| VO05c | 1:17.4 | 1:24.1 | It also checks what axe-core can't: focus visibility, focus traps, target size. |
| VO05d | 1:24.1 | 1:29.5 | And it audits the states your agent just built. |

> **ElevenLabs input (vo-05-passes.mp3):**
> Every audit renders the page five ways — default, dark, forced colours, reduced motion, and a
> three hundred and twenty pixel viewport. Most failures only show up in one of them. It also
> checks what axe core can't: focus visibility, focus traps, target size. And it audits the states
> your agent just built.

---

## Scene 6 · Before → after — 1:30.5–1:54.5

**Picture.** A vertical seam wipes across the frame: `demo/before` on the left, `demo/after` on the
right. A counter runs `163 → 0`. Real terminal replay of `a11y-loop diff --before … --after …`,
ending on `Converged: all 163 violations fixed, none introduced`.

**Do not crop the line above it.** The real output also reads *"40 new needs-review finding(s) — not
blocking, but new."* It stays in frame. Cutting it to make the verdict look cleaner would be the
exact failure mode scene 8 is about.

Then scene 1 replays beat for beat on the fixed page — identical keystrokes, identical timing — but
now a focus ring is plainly visible at every stop, the eighth Tab lands on a real `<button>`, Enter
opens the dialog and moves focus into it, and Escape closes it and returns focus to the trigger.

**Measured, on screen in small type, both pages side by side:**

| | before | after |
|---|---|---|
| tab stops | 22 | 34 |
| "Register now" keyboard-reachable | no | yes |
| stops with a visible focus indicator | 0 of 8 | 8 of 8 |
| with the dialog open, focus stops landing on the page behind it | 15 of 16 | 0 of 16 |

*(Chromium hands focus to browser chrome for one step when a modal `<dialog>` wraps; that stop is
counted as neither an escape nor an in-dialog stop. The measurement script records the difference
rather than glossing it.)*

**Sound.** A single wipe. Keystrokes matching scene 1 exactly. Affirmative chime on `Converged`.

| Cue | In | Out | Caption |
|---|---|---|---|
| VO06a | 1:32.5 | 1:36.5 | This is the same page after the loop. |
| VO06b | 1:36.5 | 1:42 | 163 failures, down to zero — and diff proves none were introduced. |
| VO06c | 1:42 | 1:45 | Same keystrokes as before. |
| VO06d | 1:45 | 1:51 | This time you can see where you are. And the button is a button. |

> **ElevenLabs input (vo-06-before-after.mp3):**
> This is the same page after the loop. A hundred and sixty-three failures, down to zero — and
> diff proves none were introduced. Same keystrokes as before. This time you can see where you
> are. And the button is a button.

---

## Scene 7 · Does it change what the agent writes? — 1:54–2:10

**Picture.** Two columns, six components each. Left, *no guidance*: violation dots accumulate to
**35**. Right, *with the skill*: a single dot — **1** — and a label, *before any audit ran*. Then
both resolve to **0** with `1.67 average iterations`. The caveats sit directly under the numbers in
`muted`, same size as the body text, not shrunk away: *N = 6 components · one run per condition ·
one model family · audits produced by a11y-loop's own engine.*

| Cue | In | Out | Caption |
|---|---|---|---|
| VO07a | 1:55.5 | 1:59 | Six components, built twice by the same model. |
| VO07b | 1:59 | 2:04 | 35 failures without the skill. One with it — before any audit ran. |
| VO07c | 2:04 | 2:09 | Six components, a single run: an illustration, not a study. |

> **ElevenLabs input (vo-07-benchmark.mp3):**
> Six components, built twice by the same model. Thirty-five failures without the skill. One with
> it — before any audit ran. Six components, a single run: an illustration, not a study.

---

## Scene 8 · What it will not tell you — 2:09.5–2:31.5

**Picture.** The most restrained scene in the film — near-static, one idea at a time. A bar shows
**~57%** of issues by volume automatable; beneath it, a much shorter bar shows only **~31%** of
WCAG 2.2 AA criteria have any automated rule, and **~13%** are reliably automatable. Then a single
line of ink on paper, held: *"A clean report means no automatically detectable failures. It is not a
compliance claim."* Then the generated manual-review checklist scrolls slowly past — screen-reader
behaviour, descriptive quality of alt text, logical reading order, cognitive accessibility.

**Sound.** Music thins to almost nothing. No SFX.

| Cue | In | Out | Caption |
|---|---|---|---|
| VO08a | 2:11 | 2:15.9 | Automated testing catches about half of accessibility issues by volume. |
| VO08b | 2:15.9 | 2:20.8 | Only about a third of WCAG criteria have any automated rule. |
| VO08c | 2:20.8 | 2:26.2 | So a clean report means no detectable failures — never that it's accessible. |
| VO08d | 2:26.2 | 2:30.5 | Every run says so, and lists what needs a person. |

> **ElevenLabs input (vo-08-honesty.mp3):**
> Automated testing catches about half of accessibility issues by volume. Only about a third of
> W.CAG criteria have any automated rule. So a clean report means no detectable failures — never
> that it's accessible. Every run says so, and lists what needs a person.

---

## Scene 9 · Portable · call to action — 2:31–2:59

**Picture.** One `SKILL.md` file fans out to client marks — Claude Code, Cursor, Copilot, Codex,
Gemini CLI — over the line *open Agent Skills standard*. Then a CI panel: `a11y-loop audit …` with
`exit 0` / `exit 1` as a gate. Then the install line, large and centred:
`npx a11y-loop audit http://localhost:3000`. Final card: the loop mark, `npmjs.com/package/a11y-loop`,
`github.com/ChanMeng666/a11y-loop`, MIT. Last frame holds the closing line.

**Sound.** Music opens up and resolves. Nothing else.

| Cue | In | Out | Caption |
|---|---|---|---|
| VO09a | 2:33.5 | 2:39.6 | It's one skill file — so it works in Claude Code, Cursor, Copilot, Codex, anything reading the open Agent Skills standard. |
| VO09b | 2:39.6 | 2:43 | And one command in your pipeline. |
| VO09c | 2:43 | 2:47.5 | Accessibility stops being the audit at the end. |
| VO09d | 2:47.5 | 2:52.5 | It becomes the default at the start. |

> **ElevenLabs input (vo-09-cta.mp3):**
> It's one skill file — so it works in Claude Code, Cursor, Copilot, Codex, anything reading the
> open Agent Skills standard. And one command in your pipeline. Accessibility stops being the
> audit at the end. It becomes the default at the start.

---

## Every number on screen, and where it comes from

| Number | Claim | Source in the repo |
|---|---|---|
| 84% | of AI-generated web pages carry accessibility issues | README Introduction · W4A '24 |
| 17.32% / 15.93% | violation rate, accessibility-oriented vs agnostic prompts | README Introduction · W4A '25 · `skill/a11y-loop/SKILL.md` |
| 163 | detectable failures on the demo page, page-load audit | live `a11y-loop audit` · `public/cli-audit-before.json` |
| 179 | same page with `--interact` driving built states | live run · `public/cli-audit-interact.json` |
| 0 | violations after the loop | live run · `public/cli-audit-after.json` |
| 22 / 34 | tab stops, before / after | measured · `public/kb-*.json` → `tabRing.stopCount` |
| 0 of 8 / 8 of 8 | walk stops with a visible focus indicator | measured · `public/kb-*.json` → `focusStyle.visibleIndicator` |
| 15 of 16 / 0 of 16 | focus stops behind the open dialog | measured · `public/kb-*.json` → `dialogTrap.escapes` |
| 35 → 1 → 0 | baseline / first skilled generation / after loop | `evals/benchmark-results.md` |
| 1.67 | average completed audit iterations per component | `evals/benchmark-results.md` |
| ~57% / ~31% / ~13% | automatable by volume / criteria with any rule / reliably automatable | README Honest Coverage · Deque |
| 5 | render passes per audit | README Key Features `1` |
| 24×24 | minimum target size, SC 2.5.8 | README Key Features `2` |
| 7.84:1 | accent on paper, this video's own palette | `npm run verify:palette`, at build time |
| 4.41 → 4.52:1 | the `--fix` demo pair, `#6d7a82` on white | live run · `public/cli-contrast-fix.json` |

No number is rounded in a flattering direction, and no caveat travels separately from the number it
qualifies.

**Three numbers changed during production, because measuring them contradicted the estimate:**
the accent contrast (guessed 8.6:1, measured 6.10:1, colour changed until it measured 7.84:1); the
hairline grey (measured 1.61:1 against a 3:1 requirement, darkened); and the `--fix` demo pair —
`#767676` on white is the grey everyone reaches for as a failing example and it actually *passes* at
4.54:1, so a genuinely failing pair from the demo page replaced it.

## Accessibility of this video

- Open captions, always on, from this file — nothing here is optional to read.
- Sidecar `.srt` and `.vtt`, plus this transcript, so the content is reachable without playback.
- Narration is written audio-description-first; no information is picture-only.
- No luminance transition exceeding 3 per second. Enforced by `npm run verify:flash`, not assumed.
- A `prefers-reduced-motion` export ships alongside the master: same timeline, cross-fades instead
  of wipes, no parallax, text held still.
- Every sound cue has a visual equivalent. Sound is never load-bearing.
