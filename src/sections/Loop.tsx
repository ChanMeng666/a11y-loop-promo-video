import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { TYPE, displayFamily, monoFamily } from "../constants";
import { Beats, Eyebrow, Gap, Headline, Stage, useInk } from "../components/Stage";

/**
 * Scene 4 — the loop. 0:41.5–1:04.5.
 *
 * Two beats. What it is, then what it does.
 *
 * The previous cut spent the second half replaying three cards of per-file
 * audit log — about ninety words of prose, unreadable at speed, and duplicating
 * nothing the narration needed. The log is still the honest record; it lives in
 * the repo, which is where anyone who wants that detail will actually read it.
 */

const WhatItIs: React.FC = () => {
  const { fg, muted, accent, rule } = useInk();
  const parts = [
    ["A skill", "sets the rules while the agent writes"],
    ["A CLI", "opens a real browser and checks"],
  ];
  return (
    <>
      <Eyebrow>Two things</Eyebrow>
      <div style={{ display: "flex", gap: 48 }}>
        {parts.map(([title, sub], i) => (
          <div
            key={title}
            style={{
              flex: 1,
              borderTop: `4px solid ${i === 1 ? accent : rule}`,
              paddingTop: 30,
            }}
          >
            <div
              style={{
                fontFamily: displayFamily,
                fontSize: 62,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: i === 1 ? accent : fg,
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: TYPE.lead, color: muted, marginTop: 16, lineHeight: 1.3 }}>
              {sub}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

/** write → audit → fix, and back. Three words and an arrow. */
const TheCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fg, accent, muted } = useInk();
  const steps = ["write", "audit", "fix"];

  const on = (i: number) =>
    interpolate(frame - 20 - i * 18, [0, 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const close = interpolate(frame - 84, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <Headline size={64}>Until nothing is left.</Headline>
      <Gap size="l" />
      <div style={{ position: "relative", paddingBottom: 96 }}>
        <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
          {steps.map((step, i) => (
            <React.Fragment key={step}>
              {i > 0 ? (
                <span style={{ fontSize: 54, color: muted, opacity: on(i) }}>→</span>
              ) : null}
              <span
                style={{
                  fontFamily: monoFamily,
                  fontSize: 66,
                  fontWeight: 700,
                  color: i === 1 ? accent : fg,
                  opacity: on(i),
                }}
              >
                {step}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* The return edge. The loop is the product; the arrow is the point. */}
        <svg width={760} height={90} style={{ position: "absolute", left: 0, bottom: 0 }}>
          <path
            d="M 700 4 L 700 56 L 42 56 L 42 4"
            fill="none"
            stroke={accent}
            strokeWidth={4}
            strokeDasharray={1500}
            strokeDashoffset={1500 * (1 - close)}
          />
          <polygon points="34,16 50,16 42,0" fill={accent} opacity={close > 0.9 ? 1 : 0} />
        </svg>
      </div>
    </>
  );
};

export const Loop: React.FC = () => (
  <Stage>
    <Beats
      beats={[
        { at: 0, node: <WhatItIs /> },
        { at: 330, node: <TheCycle /> },
      ]}
    />
  </Stage>
);
