import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

import { COLORS, TYPE, monoFamily } from "../constants";

export type CliCapture = {
  name: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
};

/**
 * Replays a captured CLI run.
 *
 * Everything shown is verbatim stdout from `capture/run-cli.mjs`. The only
 * editorial control here is speed and which line range is on screen — the text
 * itself is never authored. If a line looks awkward, the fix is in the tool,
 * not in this component.
 */

/** Colour a plain-text line by what the CLI is actually saying. */
function tint(line: string): { color: string; weight: number } {
  if (/^VIOLATIONS \(/.test(line)) return { color: COLORS.fail, weight: 700 };
  if (/^NEEDS REVIEW|^BEST PRACTICE|^MANUAL/.test(line)) return { color: COLORS.onInkMuted, weight: 700 };
  if (/^Converged:/.test(line)) return { color: COLORS.passOnInk, weight: 700 };
  if (/^\s*FIXED\b/.test(line)) return { color: COLORS.passOnInk, weight: 500 };
  if (/^\s*NEW\b/.test(line)) return { color: COLORS.failOnInk, weight: 600 };
  if (/^\s*REMAINING\b/.test(line)) return { color: COLORS.onInkMuted, weight: 500 };
  if (/\bPASS\b/.test(line) && !/FAIL/.test(line)) return { color: COLORS.passOnInk, weight: 600 };
  if (/\bFAIL\b/.test(line)) return { color: COLORS.failOnInk, weight: 600 };
  if (/^\s*·/.test(line)) return { color: COLORS.termMuted, weight: 400 };
  if (/^(Provenance:|Automated checks cover|Contrast is measured|Target standard:)/.test(line)) {
    return { color: COLORS.termMuted, weight: 400 };
  }
  if (/^\s*SC \d/.test(line)) return { color: COLORS.accentOnInk, weight: 500 };
  return { color: COLORS.termFg, weight: 400 };
}

export const Terminal: React.FC<{
  capture: CliCapture;
  /** Frame (relative to this sequence) at which typing of the command begins. */
  startFrame?: number;
  /** Characters per second while the command is typed. */
  typeCps?: number;
  /** Output lines revealed per second once the command has run. */
  linesPerSecond?: number;
  /** Show only this slice of stdout. Use to skip 400 near-identical findings. */
  lineRange?: [number, number];
  /** Pin the last N lines on screen instead of scrolling from the top. */
  tail?: number;
  height?: number | string;
  fontSize?: number;
  /** Extra lines appended after stdout, e.g. the exit-code line. */
  showExit?: boolean;
}> = ({
  capture,
  startFrame = 0,
  typeCps = 34,
  linesPerSecond = 9,
  lineRange,
  tail,
  height = "100%",
  fontSize = TYPE.mono,
  showExit = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.max(0, (frame - startFrame) / fps);

  const lines = useMemo(() => {
    const all = capture.stdout.replace(/\s+$/, "").split("\n");
    return lineRange ? all.slice(lineRange[0], lineRange[1]) : all;
  }, [capture.stdout, lineRange]);

  const typed = Math.min(capture.command.length, Math.floor(t * typeCps));
  const commandDone = typed >= capture.command.length;

  // A beat between pressing Enter and the first output, so the run reads as a
  // run rather than as a paste.
  const RUN_PAUSE = 0.45;
  const outputT = commandDone ? t - capture.command.length / typeCps - RUN_PAUSE : 0;
  const revealed = outputT > 0 ? Math.min(lines.length, Math.floor(outputT * linesPerSecond)) : 0;

  const visible = tail ? lines.slice(0, revealed).slice(-tail) : lines.slice(0, revealed);
  const outputComplete = revealed >= lines.length;

  return (
    <div
      style={{
        backgroundColor: COLORS.termBg,
        borderRadius: 16,
        padding: "28px 34px",
        height,
        overflow: "hidden",
        fontFamily: monoFamily,
        fontSize,
        lineHeight: 1.5,
        color: COLORS.termFg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        <span style={{ color: COLORS.accentOnInk }}>$ </span>
        {capture.command.slice(0, typed)}
        {!commandDone ? (
          // Steady, not blinking: a 2Hz blink across a whole scene is visual
          // noise, and the film has no reason to add motion it doesn't need.
          <span style={{ color: COLORS.termFg, opacity: 0.85 }}>▋</span>
        ) : null}
      </div>

      <div style={{ marginTop: 14, flex: 1, minHeight: 0 }}>
        {visible.map((line, i) => {
          const { color, weight } = tint(line);
          return (
            <div
              key={`${i}-${line.slice(0, 24)}`}
              style={{
                color,
                fontWeight: weight,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {line || " "}
            </div>
          );
        })}
      </div>

      {showExit && outputComplete ? (
        <div style={{ marginTop: 12, color: COLORS.termMuted }}>
          exit{" "}
          <span style={{ color: capture.exitCode === 0 ? COLORS.passOnInk : COLORS.failOnInk, fontWeight: 700 }}>
            {capture.exitCode}
          </span>
          {"  ·  "}
          {(capture.durationMs / 1000).toFixed(1)}s
        </div>
      ) : null}
    </div>
  );
};
