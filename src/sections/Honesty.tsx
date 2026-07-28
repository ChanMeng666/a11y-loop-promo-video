import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { TYPE, displayFamily } from "../constants";
import { Beats, Eyebrow, Gap, Lead, Note, Stage, useInk } from "../components/Stage";
import { Counter } from "../components/Counter";

/**
 * Scene 8 — what it will not tell you. 2:09.5–2:31.5.
 *
 * On ink, quiet, and slower than anything around it. A promo peaks here; this
 * one gets smaller. For a disability organisation judging this, a tool that
 * oversells its coverage is worse than no tool, so the film spends twenty-two
 * seconds saying what the tool cannot do.
 *
 * The twelve-item manual-review checklist that used to scroll past here is
 * gone. Twelve questions in eight seconds is not a checklist, it is texture —
 * and reducing the one genuinely humbling moment in the film to texture was
 * the wrong call. Three, held still, can actually be read.
 */

const Coverage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fg, muted, accent } = useInk();

  const bar = (value: number, at: number, colour: string) => {
    const grow = interpolate(frame - at, [0, 30], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <div
        style={{
          height: 16,
          width: 980,
          backgroundColor: "rgba(247,245,240,0.14)",
          borderRadius: 999,
          overflow: "hidden",
          marginTop: 18,
        }}
      >
        <div
          style={{ height: "100%", width: `${value * grow}%`, backgroundColor: colour, borderRadius: 999 }}
        />
      </div>
    );
  };

  return (
    <>
      <Eyebrow>What automated testing can reach</Eyebrow>

      <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
        <Counter from={0} to={57} startFrame={16} durationInFrames={30} size={112} color={accent} suffix="%" />
        <span style={{ fontSize: TYPE.lead, color: fg }}>of issues, by volume</span>
      </div>
      {bar(57, 16, accent)}

      <Gap />

      <div
        style={{
          opacity: interpolate(frame - 130, [0, 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
          <Counter from={0} to={31} startFrame={140} durationInFrames={30} size={112} color={muted} suffix="%" />
          <span style={{ fontSize: TYPE.lead, color: muted }}>of WCAG criteria, at all</span>
        </div>
        {bar(31, 140, muted)}
      </div>

      <Gap size="s" />
      <Note>Deque, across 13,000+ pages</Note>
    </>
  );
};

const NotACompliance: React.FC = () => {
  const { fg, muted, accent } = useInk();
  return (
    <>
      <div
        style={{
          fontFamily: displayFamily,
          fontSize: 66,
          fontWeight: 700,
          letterSpacing: "-0.025em",
          lineHeight: 1.16,
          color: fg,
          maxWidth: 1500,
        }}
      >
        A clean report means no detectable failures.
        <br />
        <span style={{ color: accent }}>Never that it’s accessible.</span>
      </div>
      <Gap size="l" />
      <Lead color={muted}>So every run lists what still needs a person:</Lead>
      <Gap size="s" />
      <div style={{ fontSize: TYPE.lead, color: fg, lineHeight: 1.9 }}>
        Does a screen reader announce this?
        <br />
        Is the alt text useful, or just present?
        <br />
        Has anyone who uses assistive tech tried it?
      </div>
    </>
  );
};

export const Honesty: React.FC = () => (
  <Stage ground="ink">
    <Beats
      beats={[
        { at: 0, node: <Coverage /> },
        { at: 320, node: <NotACompliance /> },
      ]}
    />
  </Stage>
);
