import { createContext, useContext } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Whether this render honours `prefers-reduced-motion`.
 *
 * The film ships two masters from one timeline. In the reduced-motion export
 * every wipe becomes a cross-fade, parallax is switched off, and text arrives
 * by opacity alone rather than translating in. Shipping a video that argues
 * for `prefers-reduced-motion` without offering a reduced-motion cut would be
 * an odd thing to do.
 */
export const ReducedMotionContext = createContext(false);

export const useReducedMotion = () => useContext(ReducedMotionContext);

/**
 * A spring that flattens to a plain fade when motion is reduced.
 *
 * Returns 0→1. Callers use it for opacity always, and for translation only via
 * `useShift` below, so a single switch governs both.
 */
export function useEnter(delayFrames = 0, { damping = 200 } = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reduced = useReducedMotion();

  if (reduced) {
    // A slower, gentler fade. No overshoot, no travel.
    return interpolate(frame - delayFrames, [0, 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return spring({
    frame: frame - delayFrames,
    fps,
    config: { damping, mass: 0.7 },
    durationInFrames: 26,
  });
}

/**
 * Pixels of travel for an entering element — zero when motion is reduced.
 * Multiply by `(1 - enter)` to get the current offset.
 */
export function useShift(distance = 24) {
  return useReducedMotion() ? 0 : distance;
}

/** Fade in and out at the edges of a window, in frames relative to the sequence. */
export function useWindowFade(durationInFrames: number, edge = 12) {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [0, edge, durationInFrames - edge, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}
