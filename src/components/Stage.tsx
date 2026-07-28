import React, { createContext, useContext } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import {
  COLORS,
  CONTENT_HEIGHT,
  CONTENT_WIDTH,
  SAFE,
  TYPE,
  displayFamily,
  fontFamily,
  monoFamily,
} from "../constants";
import { useReducedMotion } from "../motion";

/**
 * The layout law for the whole film.
 *
 * Two rules, both enforced here rather than left to each scene's discipline:
 *
 * 1. **Content is clipped to the safe box.** The bottom 230px belongs to the
 *    caption plate and nothing else can render into it. The first cut had
 *    scene annotations sliding under the captions because every scene did its
 *    own padding arithmetic.
 *
 * 2. **Exactly one beat is visible at a time.** `<Beats>` cross-fades between
 *    them and unmounts the rest. The first cut of scene 5 faded a second
 *    layout *in* over a first layout that was never faded out, so two complete
 *    designs rendered stacked — headline over headline, panel over image. That
 *    class of bug is now impossible to write.
 */

type Ground = "paper" | "ink";

const GroundContext = createContext<Ground>("paper");
export const useGround = () => useContext(GroundContext);

/** Resolve a colour role against whichever ground the scene is on. */
export function useInk() {
  const ground = useGround();
  return ground === "ink"
    ? {
        fg: COLORS.onInk,
        muted: COLORS.onInkMuted,
        rule: COLORS.ruleOnInk,
        accent: COLORS.accentOnInk,
        fail: COLORS.failOnInk,
        pass: COLORS.passOnInk,
        bg: COLORS.ink,
      }
    : {
        fg: COLORS.ink,
        muted: COLORS.inkMuted,
        rule: COLORS.rule,
        accent: COLORS.accent,
        fail: COLORS.fail,
        pass: COLORS.pass,
        bg: COLORS.paper,
      };
}

export const Stage: React.FC<{
  children: React.ReactNode;
  ground?: Ground;
  /** Vertical alignment of content inside the safe box. */
  align?: "center" | "top";
}> = ({ children, ground = "paper", align = "center" }) => (
  <GroundContext.Provider value={ground}>
    <AbsoluteFill
      style={{ backgroundColor: ground === "ink" ? COLORS.ink : COLORS.paper, fontFamily }}
    >
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          top: SAFE.top,
          width: CONTENT_WIDTH,
          height: CONTENT_HEIGHT,
          // The law, in one line.
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: align === "center" ? "center" : "flex-start",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  </GroundContext.Provider>
);

/**
 * Cross-fade between beats, showing exactly one.
 *
 * `at` is the sequence-relative frame the beat takes over. Beats are stacked
 * absolutely and only the active one (plus the outgoing one, mid-fade) is
 * rendered, so nothing can pile up.
 */
export const Beats: React.FC<{
  beats: { at: number; node: React.ReactNode }[];
  fade?: number;
}> = ({ beats, fade = 12 }) => {
  const frame = useCurrentFrame();

  const active = beats.reduce((acc, b, i) => (frame >= b.at ? i : acc), 0);
  const previous = active > 0 ? active - 1 : null;
  const since = frame - beats[active].at;
  const mix = interpolate(since, [0, fade], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {previous !== null && mix < 1 ? (
        <div key={`out-${previous}`} style={{ ...fill, opacity: 1 - mix }}>
          {beats[previous].node}
        </div>
      ) : null}
      <div key={`in-${active}`} style={{ ...fill, opacity: mix }}>
        {beats[active].node}
      </div>
    </>
  );
};

const fill: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

/**
 * The film's signature: a real focus ring.
 *
 * Not decoration. A focus indicator is the thing `demo/before` is missing, the
 * thing the tool restores, and the reason a keyboard user in scene 1 has no
 * idea where they are. So the film uses one as its only emphasis device — the
 * important element in each beat is the element with focus.
 *
 * It also replaces a logo. The mark this project had was a drawn loop that
 * carried no meaning; a focus ring carries the whole argument.
 */
export const Focused: React.FC<{
  children: React.ReactNode;
  /** Frame at which the ring arrives. */
  at?: number;
  offset?: number;
  radius?: number;
  style?: React.CSSProperties;
}> = ({ children, at = 0, offset = 18, radius = 10, style }) => {
  const frame = useCurrentFrame();
  const reduced = useReducedMotion();
  const { accent } = useInk();

  const on = interpolate(frame - at, [0, reduced ? 12 : 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", display: "inline-flex", ...style }}>
      {children}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -offset,
          border: `4px solid ${accent}`,
          borderRadius: radius + offset / 2,
          opacity: on,
          // A real focus ring snaps on. It does not scale or glow.
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

/* ── the only text components the film has ──────────────────────────────── */

/** Uppercase eyebrow. One per beat, at most. */
export const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { muted } = useInk();
  return (
    <div
      style={{
        fontFamily: monoFamily,
        fontSize: TYPE.label,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: muted,
        marginBottom: 26,
      }}
    >
      {children}
    </div>
  );
};

/** The one headline in a beat. Six words is the budget. */
export const Headline: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
}> = ({ children, size = TYPE.headline, color }) => {
  const { fg } = useInk();
  return (
    <h1
      style={{
        fontFamily: displayFamily,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: "-0.025em",
        lineHeight: 1.06,
        color: color ?? fg,
        margin: 0,
        maxWidth: CONTENT_WIDTH,
      }}
    >
      {children}
    </h1>
  );
};

/** The one big number in a beat. */
export const Figure: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
}> = ({ children, size = TYPE.figure, color }) => {
  const { fg } = useInk();
  return (
    <span
      style={{
        fontFamily: displayFamily,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: "-0.045em",
        lineHeight: 0.92,
        color: color ?? fg,
        fontVariantNumeric: "tabular-nums",
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
};

/** A single supporting line under a figure or headline. */
export const Lead: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color,
}) => {
  const { fg } = useInk();
  return (
    <p
      style={{
        fontSize: TYPE.lead,
        lineHeight: 1.35,
        color: color ?? fg,
        margin: 0,
        maxWidth: 1180,
        fontWeight: 400,
      }}
    >
      {children}
    </p>
  );
};

/**
 * A source or a caveat.
 *
 * Only ever appears in a beat that has room for it, never crammed under a
 * headline that is already competing with a figure. Set at `label` size — a
 * caveat too small to read is a caveat that was not made.
 */
export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { muted } = useInk();
  return (
    <p
      style={{
        fontSize: TYPE.label,
        lineHeight: 1.5,
        color: muted,
        margin: 0,
        maxWidth: 1100,
      }}
    >
      {children}
    </p>
  );
};

/** Vertical rhythm. The film has three gaps, not fifteen. */
export const Gap: React.FC<{ size?: "s" | "m" | "l" }> = ({ size = "m" }) => (
  <div style={{ height: { s: 20, m: 40, l: 72 }[size] }} />
);
