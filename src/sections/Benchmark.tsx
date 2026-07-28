import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { TYPE, monoFamily } from "../constants";
import { Beats, Eyebrow, Figure, Focused, Gap, Lead, Note, Stage, useInk } from "../components/Stage";

/**
 * Scene 7 — does the skill change what the agent writes? 1:54–2:10.
 *
 * Source: evals/benchmark-results.md.
 *
 * Two numbers and a row of dots each. The previous cut listed all six
 * component names twice, in mono, beside two dot columns and a third panel of
 * running totals — thirty-odd labels for a claim that is two numbers wide.
 *
 * The caveat gets its own beat rather than being crushed under the numbers.
 * "One run, six components" is not fine print here; it is the finding.
 */

const Result: React.FC = () => {
  const frame = useCurrentFrame();
  const { fg, muted, fail, accent } = useInk();

  const dots = (n: number, colour: string, from: number) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 22, maxWidth: 700 }}>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            backgroundColor: colour,
            opacity: interpolate(frame - from - i * 3, [0, 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      ))}
    </div>
  );

  return (
    <>
      <Eyebrow>Six components, built twice by the same model</Eyebrow>
      <div style={{ display: "flex", gap: 96, alignItems: "flex-start" }}>
        <div>
          <Figure color={fail} size={150}>
            35
          </Figure>
          <div style={{ fontSize: TYPE.lead, color: muted, marginTop: 10 }}>without the skill</div>
          {dots(35, fail, 30)}
        </div>
        <div>
          <Focused at={110}>
            <Figure color={accent} size={150}>
              1
            </Figure>
          </Focused>
          <div style={{ fontSize: TYPE.lead, color: muted, marginTop: 10 }}>with it</div>
          {dots(1, accent, 118)}
        </div>
      </div>
      <Gap />
      <Lead color={fg}>Before any audit ran.</Lead>
    </>
  );
};

const Caveat: React.FC = () => {
  const { fg, muted } = useInk();
  return (
    <>
      <Eyebrow>Read it with its limits</Eyebrow>
      <Lead color={fg}>An illustration, not a study.</Lead>
      <Gap />
      <Note>
        Six components · one run per condition · one model family · audits produced by a11y-loop’s
        own engine. Every finding is grounded in axe-core, which mitigates that last point without
        removing it. The full record is in{" "}
        <span style={{ fontFamily: monoFamily, color: muted }}>evals/benchmark-results.md</span>.
      </Note>
    </>
  );
};

export const Benchmark: React.FC = () => (
  <Stage>
    <Beats
      beats={[
        { at: 0, node: <Result /> },
        { at: 300, node: <Caveat /> },
      ]}
    />
  </Stage>
);
