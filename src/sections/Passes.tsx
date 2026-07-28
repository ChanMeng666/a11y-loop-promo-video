import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";

import { COLORS, TYPE, displayFamily, monoFamily } from "../constants";
import { Beats, Eyebrow, Figure, Focused, Gap, Lead, Stage, useInk } from "../components/Stage";

/**
 * Scene 5 — five passes, and what axe-core has no rule for. 1:04–1:31.
 *
 * This is the scene that was broken. Its second half faded in over a first
 * half that was never faded out, so two complete layouts rendered stacked:
 * headline over headline, a checklist over the pane strip, a terminal over
 * both. `<Beats>` now owns the switching and only one beat exists at a time.
 *
 * The density was the other half of the problem. Each of the five panes
 * carried a name, a media-query string, a contrast ratio, a pass/fail word and
 * sometimes an overflow warning — twenty-odd fragments of text under five
 * small images. Now each pane has one word, and the single number that matters
 * appears on the single pane it belongs to.
 */

type Pass = { id: string; label: string; file: string };

const PANES: Pass[] = [
  { id: "default", label: "default", file: "passfull-before-default.png" },
  { id: "dark", label: "dark", file: "passfull-before-dark.png" },
  { id: "forced-colors", label: "forced colours", file: "passfull-before-forced-colors.png" },
  { id: "reduced-motion", label: "reduced motion", file: "passfull-before-reduced-motion.png" },
  { id: "reflow", label: "320px", file: "passfull-before-reflow.png" },
];

const FiveRenders: React.FC = () => {
  const frame = useCurrentFrame();
  const { fg, muted, fail } = useInk();

  // The four 1280-wide passes render a 1280 x 2333 page — aspect 0.549. The
  // card is cut to exactly that, so the complete page fits with no cropping
  // and no letterboxing. An earlier version used a 16:9 above-the-fold capture
  // squeezed into a portrait card, which sliced every pane off mid-section.
  const H = 500;
  const W = Math.round(H * (1280 / 2333));
  const GAP = (1600 - W * 5) / 4;

  const HIGHLIGHT = 150;

  return (
    <>
      <Eyebrow>Every audit renders the page five ways</Eyebrow>
      <div style={{ display: "flex", gap: GAP }}>
        {PANES.map((pane, i) => {
          const enter = interpolate(frame - 20 - i * 10, [0, 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const isDark = pane.id === "dark";
          const dim = interpolate(frame - HIGHLIGHT, [0, 16], [1, isDark ? 1 : 0.28], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const ring = isDark
            ? interpolate(frame - HIGHLIGHT, [0, 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 0;

          return (
            <div key={pane.id} style={{ width: W, opacity: enter * dim }}>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: W,
                    height: H,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: `2px solid ${COLORS.rule}`,
                    backgroundColor: "#fff",
                  }}
                >
                  <Img
                    src={staticFile(pane.file)}
                    style={{
                      width: "100%",
                      height: "100%",
                      // Contain everywhere. The 320px pass is the same 2333px
                      // page in a 320px window — it does not reflow, it
                      // overflows — so it renders as a tall narrow column
                      // beside four wide ones. That silhouette *is* the
                      // finding, and cropping it to match would hide it.
                      objectFit: "contain",
                      objectPosition: "top",
                    }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: -12,
                    border: `4px solid ${fail}`,
                    borderRadius: 14,
                    opacity: ring,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: monoFamily,
                  fontSize: TYPE.label,
                  color: isDark && ring > 0.5 ? fg : muted,
                  marginTop: 16,
                }}
              >
                {pane.label}
              </div>
            </div>
          );
        })}
      </div>

      <Gap />
      <div
        style={{
          opacity: interpolate(frame - HIGHLIGHT - 14, [0, 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          display: "flex",
          alignItems: "baseline",
          gap: 24,
        }}
      >
        <span
          style={{
            fontFamily: displayFamily,
            fontSize: 76,
            fontWeight: 700,
            color: fail,
            letterSpacing: "-0.03em",
          }}
        >
          2.52:1
        </span>
        <span style={{ fontSize: TYPE.lead, color: fg }}>
          a contrast failure that only exists in dark mode
        </span>
      </div>
    </>
  );
};

/** Three checks, three words each. No descriptions, no criterion numbers. */
const BeyondAxe: React.FC = () => {
  const frame = useCurrentFrame();
  const { fg, accent, muted } = useInk();
  const items = ["focus visibility", "focus traps", "target size"];

  return (
    <>
      <Eyebrow>Checks axe-core has no rule for</Eyebrow>
      {items.map((item, i) => {
        const on = interpolate(frame - 16 - i * 26, [0, 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
              opacity: on,
              padding: "18px 0",
            }}
          >
            <span style={{ fontSize: 50, color: accent, lineHeight: 1 }}>✓</span>
            <span
              style={{
                fontFamily: displayFamily,
                fontSize: 66,
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: fg,
              }}
            >
              {item}
            </span>
          </div>
        );
      })}
      <Gap size="s" />
      <div style={{ fontSize: TYPE.body, color: muted }}>…alongside axe-core, not instead of it.</div>
    </>
  );
};

/** The state-coverage number, alone. */
const States: React.FC = () => {
  const { fg, muted, fail } = useInk();
  return (
    <>
      <Eyebrow>Audited on page load, then again with the dialog open</Eyebrow>
      <div style={{ display: "flex", alignItems: "baseline", gap: 44 }}>
        <Figure color={muted} size={150}>
          163
        </Figure>
        <span style={{ fontSize: 76, color: muted }}>→</span>
        <Focused at={30}>
          <Figure color={fail} size={150}>
            179
          </Figure>
        </Focused>
      </div>
      <Gap />
      <Lead color={fg}>
        Sixteen failures that don’t exist until someone opens something.
      </Lead>
    </>
  );
};

export const Passes: React.FC = () => (
  <Stage>
    <Beats
      beats={[
        { at: 0, node: <FiveRenders /> },
        { at: 400, node: <BeyondAxe /> },
        { at: 610, node: <States /> },
      ]}
    />
  </Stage>
);
