import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

import { COLORS, TYPE, fontFamily } from "../constants";
import script from "../captions/script.json";
import audioDurations from "../captions/audio-durations.json";

type Cue = { start: number; end: number; text: string };

/**
 * Open captions, always on.
 *
 * Burned in rather than offered as a toggle, because a caption you have to
 * find is a caption most people never see — and this film in particular has no
 * business making that someone else's problem. The sidecar .srt/.vtt exist
 * alongside for anyone who wants to restyle, resize, or read without playing.
 *
 * Cue times come from src/captions/script.json. Where a narration file has
 * been generated and measured, the group's cues are scaled to its real
 * duration so the text tracks the voice rather than the estimate the script
 * was written against.
 */

const manifest = audioDurations as {
  vo?: Record<string, { duration?: number | null }>;
};

/** Scale a group's interior to the measured length of its audio. */
function fitted(group: (typeof script.vo)[number]): Cue[] {
  const measured = manifest.vo?.[group.id]?.duration;
  const start = group.startSec;
  const planned = group.cues[group.cues.length - 1].end - start;
  if (!measured || planned <= 0) return group.cues;
  const k = measured / planned;
  return group.cues.map((c) => ({
    text: c.text,
    start: start + (c.start - start) * k,
    end: start + (c.end - start) * k,
  }));
}

const ALL_CUES: Cue[] = script.vo.flatMap(fitted).sort((a, b) => a.start - b.start);

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cue = ALL_CUES.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;

  // No fade. A cross-fading plate looked smoother on the paper scenes and
  // turned into a grey translucent box over the ink ones, dropping the caption
  // well below AA for the duration of every transition. Real caption tracks
  // snap, and a caption is not the place to spend motion.

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 52,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          // Opaque enough that whatever is behind it cannot reduce the
          // measured contrast of the text. 17.20:1 ink on paper, kept.
          backgroundColor: COLORS.paper,
          border: `2px solid ${COLORS.ink}`,
          borderRadius: 14,
          padding: "20px 36px",
          maxWidth: 1500,
          textAlign: "center",
          fontFamily,
          fontSize: TYPE.caption,
          lineHeight: 1.36,
          color: COLORS.ink,
          fontWeight: 500,
          // Never let a caption collide with the frame edge on a phone.
          // Opaque paper with an ink border, so the plate reads identically
          // whether the scene behind it is on paper or on ink.
          boxShadow: "none",
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};
