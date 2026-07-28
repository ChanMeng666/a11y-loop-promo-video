import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { TYPE, displayFamily, monoFamily } from "../constants";
import { Eyebrow, Focused, Gap, Lead, Stage, useInk } from "../components/Stage";

/**
 * Scene 9 — portable, and the call to action. 2:31–2:59.
 *
 * Four client names, then the command, then the closing line on ink.
 *
 * Gone from the previous cut: eight bordered client pills plus an "and 30-odd
 * more", a three-column exit-code table, a second full command line, and a
 * closing note about the film's own accessibility. The last one was true but
 * it was the film congratulating itself in its final frame.
 */

const Portable: React.FC = () => {
  const frame = useCurrentFrame();
  const { fg, muted } = useInk();
  const clients = ["Claude Code", "Cursor", "Copilot", "Codex"];

  return (
    <>
      <Eyebrow>One SKILL.md, not one vendor’s agent</Eyebrow>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 56px", maxWidth: 1500 }}>
        {clients.map((client, i) => (
          <span
            key={client}
            style={{
              fontFamily: displayFamily,
              fontSize: 68,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: fg,
              opacity: interpolate(frame - 24 - i * 16, [0, 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {client}
          </span>
        ))}
      </div>
      <Gap />
      <Lead color={muted}>…and anything else reading the open Agent Skills standard.</Lead>
    </>
  );
};

const Install: React.FC = () => {
  const { fg, muted, accent } = useInk();
  return (
    <div style={{ alignItems: "center", display: "flex", flexDirection: "column", textAlign: "center" }}>
      <Focused at={22} offset={26} radius={14}>
        <div
          style={{
            fontFamily: monoFamily,
            fontSize: 52,
            fontWeight: 500,
            color: accent,
            padding: "6px 4px",
          }}
        >
          npx a11y-loop audit
        </div>
      </Focused>

      <Gap size="l" />

      <div
        style={{
          fontFamily: displayFamily,
          fontSize: 62,
          fontWeight: 700,
          letterSpacing: "-0.025em",
          lineHeight: 1.18,
          color: fg,
        }}
      >
        Accessibility stops being the audit at the end.
        <br />
        <span style={{ color: accent }}>It becomes the default at the start.</span>
      </div>

      <Gap size="l" />
      <div style={{ fontFamily: monoFamily, fontSize: TYPE.body, color: muted }}>
        github.com/ChanMeng666/a11y-loop
      </div>
    </div>
  );
};

/**
 * The end card lands on ink. A `<Stage>` carries one ground, so the scene
 * swaps the whole stage rather than trying to recolour inside one.
 */
export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const SWAP = 340;
  const mix = interpolate(frame - SWAP, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {mix < 1 ? (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - mix }}>
          <Stage>
            <Portable />
          </Stage>
        </div>
      ) : null}
      <div style={{ position: "absolute", inset: 0, opacity: mix }}>
        <Stage ground="ink">
          <Install />
        </Stage>
      </div>
    </>
  );
};
