import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { monoFamily } from "../constants";
import { KeyboardWalk, WalkManifest, walkDuration } from "../components/KeyboardWalk";
import { Stage } from "../components/Stage";
import kbBefore from "../data/kb-before.json";

/**
 * Scene 1 — the barrier. 0:00–0:14.
 *
 * Someone tries to buy a ticket with a keyboard and the page gives them
 * nothing back. No headline, no product, no statistics. Five seconds with no
 * narration at all.
 *
 * The only text is a filename above the frame and, once the failed Enter
 * lands, four words below it. Everything the previous cut put here — a tab
 * count, a focus-style readout, a note explaining the annotation — competed
 * with the one thing worth watching.
 */
const manifest = kbBefore as unknown as WalkManifest;
const RATE = 14 / walkDuration(manifest, 1);

export const Barrier: React.FC = () => {
  const frame = useCurrentFrame();

  // The verdict waits until the viewer has watched Enter do nothing.
  const verdict = interpolate(frame, [292, 312], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Stage>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* 1040 wide → 650 tall, plus the 56px rail: 706 of the 740 available.
            The verdict swaps into the rail rather than adding a row, so the
            page can stay as large as the frame allows. */}
        <KeyboardWalk
          manifest={manifest}
          label="demo/before — booking a ticket, keyboard only"
          rate={RATE}
          width={1040}
          verdict={{
            text: (
              <>
                The button is a <span style={{ fontFamily: monoFamily }}>&lt;div&gt;</span>.
              </>
            ),
            opacity: verdict,
          }}
        />


      </div>
    </Stage>
  );
};
