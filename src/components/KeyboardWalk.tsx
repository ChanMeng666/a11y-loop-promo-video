import React, { useMemo } from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { COLORS, TYPE, fontFamily, monoFamily } from "../constants";

type Focus = {
  none: boolean;
  tag?: string;
  label?: string;
  tabindex?: string | null;
  rect?: { x: number; y: number; width: number; height: number };
  focusStyle?: { visibleIndicator: boolean; outlineStyle: string };
};

export type WalkManifest = {
  name: string;
  viewport: { width: number; height: number };
  tabRing: { stopCount: number; reachesRegister: boolean };
  frames: {
    file: string;
    key: string | null;
    hold: number;
    focus: Focus;
  }[];
};

/** Height of the rail beneath the page frame. Included in the component's box. */
export const RAIL = 56;

/**
 * Plays back a recorded keyboard walk.
 *
 * The screenshots are of the unmodified page — nothing was injected before
 * capture. The dashed marker is drawn here from the `activeElement` rectangle
 * the capture recorded, and it is deliberately dashed and accent-coloured so
 * it cannot be mistaken for the page's own focus ring. Painting a real-looking
 * ring onto a page whose defect is that it has none would be staging the
 * result.
 *
 * The rail carries one filename and one key. An earlier version also printed
 * the focused element, its tabindex, its computed outline style and a
 * disclaimer about the marker — four lines of prose fighting the picture for
 * attention, and colliding with the captions underneath.
 */
export const KeyboardWalk: React.FC<{
  manifest: WalkManifest;
  label: string;
  /**
   * Replaces the label once it appears, in the fail colour. Kept inside the
   * rail so the component's height never changes and nothing below it moves.
   */
  verdict?: { text: React.ReactNode; opacity: number; color?: string } | null;
  startFrame?: number;
  rate?: number;
  width: number;
  showMarker?: boolean;
}> = ({ manifest, label, verdict = null, startFrame = 0, rate = 1, width, showMarker = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const timeline = useMemo(() => {
    let cursor = 0;
    return manifest.frames.map((f) => {
      const start = cursor;
      cursor += (f.hold / 1000) * rate;
      return { ...f, start, end: cursor };
    });
  }, [manifest.frames, rate]);

  const t = Math.max(0, (frame - startFrame) / fps);
  const current = timeline.find((f) => t >= f.start && t < f.end) ?? timeline[timeline.length - 1];

  // Hand off, don't cross-fade. Running both at 50% for ten frames put two
  // different sentences on top of each other in the same spot — a smaller
  // version of the exact defect this film is about. The label clears out
  // first, then the verdict arrives.
  const swap = verdict?.opacity ?? 0;
  const labelOpacity = Math.max(0, 1 - swap * 2);
  const verdictOpacity = Math.max(0, swap * 2 - 1);

  const scale = width / manifest.viewport.width;
  const imageHeight = manifest.viewport.height * scale;
  const focus = current.focus;
  const hasRect = !focus.none && focus.rect && focus.rect.width > 0;

  return (
    <div style={{ width, height: imageHeight + RAIL, fontFamily, position: "relative" }}>
      <div
        style={{
          width,
          height: imageHeight,
          borderRadius: 10,
          overflow: "hidden",
          border: `2px solid ${COLORS.rule}`,
          backgroundColor: "#fff",
        }}
      >
        <Img src={staticFile(current.file)} style={{ width, height: imageHeight, display: "block" }} />

        {showMarker && hasRect ? (
          <div
            style={{
              position: "absolute",
              left: focus.rect!.x * scale - 5,
              top: focus.rect!.y * scale - 5,
              width: focus.rect!.width * scale + 10,
              height: focus.rect!.height * scale + 10,
              border: `3px dashed ${COLORS.accent}`,
              borderRadius: 5,
            }}
          />
        ) : null}
      </div>

      <div
        style={{
          height: RAIL,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ position: "relative", display: "inline-block" }}>
          <span
            style={{
              fontFamily: monoFamily,
              fontSize: TYPE.label,
              color: COLORS.inkMuted,
              opacity: labelOpacity,
            }}
          >
            {label}
          </span>
          {verdict ? (
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                whiteSpace: "nowrap",
                fontSize: TYPE.lead,
                fontWeight: 600,
                color: verdict.color ?? COLORS.fail,
                opacity: verdictOpacity,
                lineHeight: 1,
              }}
            >
              {verdict.text}
            </span>
          ) : null}
        </span>
        {current.key ? (
          <span
            style={{
              fontFamily: monoFamily,
              fontSize: TYPE.label,
              fontWeight: 700,
              color: COLORS.ink,
              backgroundColor: COLORS.paperSunk,
              border: `2px solid ${COLORS.rule}`,
              borderBottomWidth: 4,
              borderRadius: 7,
              padding: "5px 16px",
            }}
          >
            {current.key}
          </span>
        ) : null}
      </div>
    </div>
  );
};

/** Total seconds a walk occupies at a given rate — used to budget scene time. */
export function walkDuration(manifest: WalkManifest, rate = 1): number {
  return manifest.frames.reduce((sum, f) => sum + (f.hold / 1000) * rate, 0);
}
