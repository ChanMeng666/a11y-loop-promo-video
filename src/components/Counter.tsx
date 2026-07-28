import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { COLORS } from "../constants";
import { useReducedMotion } from "../motion";

/**
 * A number that counts from one value to another.
 *
 * Eases out, so it decelerates into the final figure rather than stopping
 * dead — and when motion is reduced it simply shows the destination, because a
 * rapidly changing numeral is exactly the kind of thing
 * `prefers-reduced-motion` is asking you not to do.
 */
export const Counter: React.FC<{
  from: number;
  to: number;
  startFrame?: number;
  durationInFrames?: number;
  size?: number;
  color?: string;
  suffix?: string;
}> = ({
  from,
  to,
  startFrame = 0,
  durationInFrames = 45,
  size = 200,
  color = COLORS.ink,
  suffix = "",
}) => {
  const frame = useCurrentFrame();
  const reduced = useReducedMotion();

  const raw = interpolate(frame - startFrame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - raw, 3);
  const value = reduced
    ? frame >= startFrame + durationInFrames
      ? to
      : from
    : Math.round(from + (to - from) * eased);

  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 700,
        letterSpacing: "-0.04em",
        color,
        lineHeight: 1,
        // Tabular figures stop the number jittering horizontally as digits change.
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
      {suffix}
    </span>
  );
};
