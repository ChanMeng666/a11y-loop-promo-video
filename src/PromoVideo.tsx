import React from "react";
// eslint-disable-next-line @typescript-eslint/no-deprecated -- see note below
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";

import { COLORS, DURATIONS, FPS, TRANSITION } from "./constants";
import { ReducedMotionContext } from "./motion";
import { Captions } from "./components/Captions";
import { Barrier } from "./sections/Barrier";
import { Why } from "./sections/Why";
import { Thesis } from "./sections/Thesis";
import { Loop } from "./sections/Loop";
import { Passes } from "./sections/Passes";
import { BeforeAfter } from "./sections/BeforeAfter";
import { Benchmark } from "./sections/Benchmark";
import { Honesty } from "./sections/Honesty";
import { Cta } from "./sections/Cta";
import script from "./captions/script.json";
import audioDurations from "./captions/audio-durations.json";

/**
 * Audio uses the core `remotion` <Audio>, not the newer @remotion/media one.
 *
 * @remotion/media's Audio previewed fine but rendered a completely silent
 * track (-91 dB across the whole file) on this version, so the deprecation
 * warning is accepted in exchange for audio that actually exists in the
 * output. Worth retrying on a future Remotion release.
 */

const durations = audioDurations as {
  vo?: Record<string, { file: string; duration?: number | null }>;
  sfx?: Record<string, { file: string; duration?: number | null }>;
  bgm?: { file: string; duration?: number | null };
};

/**
 * Every audio element is guarded on the manifest so the film still renders
 * before any audio exists. That guard once quietly swallowed the background
 * music: `bgm.mp3` was copied into public/ by hand, nothing registered it, and
 * the render came out with a full narration track and no bed at all.
 * `scripts/generate-audio.mjs` now records it whether or not it generated it.
 */
const has = (file: string) =>
  file === "bgm"
    ? Boolean(durations.bgm)
    : Boolean(durations.vo?.[file] ?? durations.sfx?.[file]);

/**
 * Background music with ducking.
 *
 * Three things shape the gain: the cold open is silent (the barrier scene runs
 * on room tone and keystrokes only), the honesty scene thins almost to nothing
 * where a conventional promo would peak, and every narration cue ducks the bed
 * to 18% so the voice never has to compete.
 */
const BackgroundMusic: React.FC = () => {
  if (!has("bgm")) return null;

  const windows = script.vo.map((group) => {
    const measured = durations.vo?.[group.id]?.duration;
    const end = measured ? group.startSec + measured : group.cues[group.cues.length - 1].end;
    return [group.startSec, end] as const;
  });

  return (
    <Audio
      src={staticFile("bgm.mp3")}
      volume={(frame: number) => {
        const t = frame / FPS;

        // Scene 1 has no music at all. It should be uncomfortable.
        const coldOpen = interpolate(t, [12, 15.5], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Scene 8 — pull back rather than build.
        const honesty = interpolate(
          t,
          [128, 133, 150, 154],
          [1, 0.42, 0.42, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        // Duck under each narration cue, with a short lead-in and tail.
        let duck = 1;
        for (const [start, end] of windows) {
          duck = Math.min(
            duck,
            interpolate(
              t,
              [start - 0.5, start, end, end + 0.7],
              [1, 0.18, 0.18, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )
          );
        }

        // The Suno track is 192s against a 179s film, so it would otherwise
        // be cut mid-phrase on the last frame. Fade the tail out under the
        // end card instead.
        const tail = interpolate(t, [174, 178.6], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return 0.5 * coldOpen * honesty * duck * tail;
      }}
    />
  );
};

/** Narration, each cue placed at its scripted start frame. */
const Narration: React.FC = () => (
  <>
    {script.vo.map((group) =>
      has(group.id) ? (
        <Sequence key={group.id} from={Math.round(group.startSec * FPS)}>
          <Audio src={staticFile(`${group.id}.mp3`)} />
        </Sequence>
      ) : null
    )}
  </>
);

/**
 * Scene start times, in seconds, derived from DURATIONS with the transition
 * overlap applied. SFX cues are expressed relative to these rather than as
 * absolute magic numbers, so retiming a scene doesn't silently desync the
 * sound — which is exactly what happened when the film went from 2:51 to 2:59.
 */
const SCENE_AT = (() => {
  const keys = Object.keys(DURATIONS) as (keyof typeof DURATIONS)[];
  const out = {} as Record<keyof typeof DURATIONS, number>;
  let cursor = 0;
  keys.forEach((k, i) => {
    out[k] = cursor / FPS;
    cursor += DURATIONS[k] - (i < keys.length - 1 ? TRANSITION : 0);
  });
  return out;
})();

/** Scene 1's walk is stretched to fill 14s; these are the resulting keystroke times. */
const WALK_FIRST_KEY = 1.4 * (14 / 8.96);
const WALK_STEP = 0.52 * (14 / 8.96);

const SFX_CUES: { id: string; at: number; volume?: number }[] = [
  // Scene 1 — the eight tabs, landing on each recorded hold boundary.
  ...Array.from({ length: 8 }, (_, i) => ({
    id: "sfx-key",
    at: WALK_FIRST_KEY + i * WALK_STEP,
    volume: 0.5,
  })),
  // The Enter that does nothing: the ninth step of the walk.
  { id: "sfx-deadend", at: WALK_FIRST_KEY + 8 * WALK_STEP, volume: 0.7 },
  { id: "sfx-page", at: SCENE_AT.why + 0.1, volume: 0.35 },

  // Scene 3 — the PASS line landing in the contrast terminal. Typing starts at
  // scene-frame 34; the command is ~38 chars at 30 cps, then a 0.45s beat, then
  // the verdict is the third output line at 7 lines/second.
  { id: "sfx-pass", at: SCENE_AT.thesis + 34 / FPS + 38 / 30 + 0.45 + 3 / 7, volume: 0.4 },

  // Scene 5 — one tick per render pane, matching PassStrip's 10-frame stagger.
  ...Array.from({ length: 5 }, (_, i) => ({
    id: "sfx-tick",
    at: SCENE_AT.passes + 40 / FPS + (i * 10) / FPS,
    volume: 0.4,
  })),

  // Scene 6 — the seam lands on the transition itself, and the affirmative
  // chime on `Converged:` at the end of the diff replay.
  { id: "sfx-wipe", at: SCENE_AT.beforeAfter, volume: 0.5 },
  { id: "sfx-pass", at: SCENE_AT.beforeAfter + 200 / FPS + 6 / FPS + 62 / 40 + 0.45 + 170 / 34, volume: 0.45 },

  // Scene 8 — the room getting quieter.
  { id: "sfx-settle", at: SCENE_AT.honesty, volume: 0.4 },
];

/**
 * Sound effects.
 *
 * Every cue here has a visual equivalent on screen — sound is never the only
 * carrier of information in this film. If the audio track were removed
 * entirely, nothing would be lost but atmosphere.
 */
const SoundEffects: React.FC = () => (
  <>
    {SFX_CUES.map((cue, i) =>
      has(cue.id) ? (
        <Sequence key={`${cue.id}-${i}`} from={Math.round(cue.at * FPS)}>
          <Audio src={staticFile(`${cue.id}.mp3`)} volume={cue.volume ?? 0.5} />
        </Sequence>
      ) : null
    )}
  </>
);

export const PromoVideo: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion = false }) => {
  const timing = linearTiming({ durationInFrames: TRANSITION });

  // In the reduced-motion cut the one wipe in the film becomes a cross-fade.
  // The timeline, the audio and the captions are identical — only this
  // transition changes. Built as a whole element rather than a presentation
  // value because fade and wipe have unrelated prop types.
  const seamTransition = reducedMotion ? (
    <TransitionSeries.Transition presentation={fade()} timing={timing} />
  ) : (
    <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={timing} />
  );

  return (
    <ReducedMotionContext.Provider value={reducedMotion}>
      <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
        <TransitionSeries>
          <TransitionSeries.Sequence layout="none" durationInFrames={DURATIONS.barrier}>
            <Barrier />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />

          <TransitionSeries.Sequence layout="none" durationInFrames={DURATIONS.why}>
            <Why />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />

          <TransitionSeries.Sequence layout="none" durationInFrames={DURATIONS.thesis}>
            <Thesis />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />

          <TransitionSeries.Sequence layout="none" durationInFrames={DURATIONS.loop}>
            <Loop />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />

          <TransitionSeries.Sequence layout="none" durationInFrames={DURATIONS.passes}>
            <Passes />
          </TransitionSeries.Sequence>
          {/* The one wipe in the film, and it means something: before → after. */}
          {seamTransition}

          <TransitionSeries.Sequence layout="none" durationInFrames={DURATIONS.beforeAfter}>
            <BeforeAfter />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />

          <TransitionSeries.Sequence layout="none" durationInFrames={DURATIONS.benchmark}>
            <Benchmark />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />

          <TransitionSeries.Sequence layout="none" durationInFrames={DURATIONS.honesty}>
            <Honesty />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />

          <TransitionSeries.Sequence layout="none" durationInFrames={DURATIONS.cta}>
            <Cta />
          </TransitionSeries.Sequence>
        </TransitionSeries>

        {/* Captions sit above everything, including transitions, so a cue is
            never half-wiped off the screen mid-sentence. */}
        <Captions />

        <BackgroundMusic />
        <Narration />
        <SoundEffects />
      </AbsoluteFill>
    </ReducedMotionContext.Provider>
  );
};
