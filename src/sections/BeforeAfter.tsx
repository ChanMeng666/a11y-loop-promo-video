import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { TYPE, monoFamily } from "../constants";
import { Counter } from "../components/Counter";
import { KeyboardWalk, WalkManifest, walkDuration } from "../components/KeyboardWalk";
import { Beats, Eyebrow, Gap, Stage, useInk } from "../components/Stage";
import { Terminal, CliCapture } from "../components/Terminal";
import kbAfter from "../data/kb-after.json";
import diffCapture from "../data/cli-diff.json";

/**
 * Scene 6 — before → after. 1:30.5–1:54.5.
 *
 * Three beats: the count, the verdict, the same keystrokes on the fixed page.
 *
 * The four-row measurement table that used to sit beside the counter is gone.
 * It was good evidence and completely unreadable in the two seconds it had —
 * two of its four rows now appear as a single line under the walk, which is
 * where they actually mean something.
 *
 * The `diff` replay is tailed deep enough to keep "40 new needs-review
 * finding(s) — not blocking, but new" in frame. Cropping that to make the
 * verdict look cleaner is the exact failure mode the next scene is about, and
 * `verify-assets.mjs` fails the build if the line ever leaves the capture.
 */
const after = kbAfter as unknown as WalkManifest;
const WALK_RATE = 11.5 / walkDuration(after, 1);

const Count: React.FC = () => {
  const { muted, pass } = useInk();
  return (
    <>
      <Eyebrow>The same page, after the loop</Eyebrow>
      <div style={{ display: "flex", alignItems: "baseline", gap: 40 }}>
        <Counter
          from={163}
          to={0}
          startFrame={24}
          durationInFrames={54}
          size={TYPE.figure}
          color={pass}
        />
        <span style={{ fontSize: 54, color: muted }}>failures</span>
      </div>
      <Gap />
      <div style={{ fontFamily: monoFamily, fontSize: TYPE.body, color: muted }}>
        demo/before → demo/after
      </div>
    </>
  );
};

const Verdict: React.FC = () => (
  <div style={{ width: 1600, height: 340 }}>
    <Terminal
      capture={diffCapture as CliCapture}
      startFrame={6}
      typeCps={40}
      linesPerSecond={34}
      tail={5}
      fontSize={TYPE.mono}
      height="100%"
      showExit={false}
    />
  </div>
);

const Replay: React.FC = () => {
  const frame = useCurrentFrame();
  const { pass } = useInk();

  // Swaps into the rail rather than adding a row beneath the page. As its own
  // line it pushed the block to 768px inside a 740px box and the Stage clipped
  // the walk top and bottom.
  const swap = interpolate(frame - 150, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <KeyboardWalk
        manifest={after}
        label="demo/after — the same eight keystrokes"
        rate={WALK_RATE}
        width={1040}
        showMarker={false}
        verdict={{
          color: pass,
          opacity: swap,
          text: (
            <>
              Every stop visible. The button is a{" "}
              <span style={{ fontFamily: monoFamily }}>&lt;button&gt;</span>.
            </>
          ),
        }}
      />
    </div>
  );
};

export const BeforeAfter: React.FC = () => (
  <Stage>
    <Beats
      beats={[
        { at: 0, node: <Count /> },
        { at: 190, node: <Verdict /> },
        { at: 375, node: <Replay /> },
      ]}
    />
  </Stage>
);
