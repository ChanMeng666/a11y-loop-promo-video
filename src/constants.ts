import { loadFont as loadDisplay } from "@remotion/google-fonts/Archivo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Only the weights the film sets. Loading full families issued 126 network
// requests per render worker — slow, and a needless failure surface offline.
export const { fontFamily: displayFamily } = loadDisplay("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});
export const { fontFamily } = loadInter("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
export const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/**
 * Two grounds, not one.
 *
 * The first cut of this film was every scene on white, which read as flat and
 * gave the eye no rhythm across three minutes. It now alternates a warm paper
 * ground with an ink ground, and the emphasis beats — the numbers that matter,
 * the honesty scene, the end card — land on ink.
 *
 * That is also a quiet argument: a film about a tool that audits dark mode
 * ought to work in both polarities. Every pair below is measured by
 * `npm run verify:palette`, which shells out to the real `a11y-loop contrast`.
 */
export const COLORS = {
  // — paper ground —
  paper: "#F7F5F0",
  /** Cards and insets on paper. */
  paperSunk: "#EDEAE3",
  /** Body and headings on paper. 16.37:1. */
  ink: "#14181C",
  /** Secondary text on paper. 7.30:1. */
  inkMuted: "#565049",
  /** Hairlines on paper. 3.44:1 — clears SC 1.4.11's 3:1 for non-text. */
  rule: "#8A8378",
  /** The focus ring, links, key figures on paper. 7.66:1 — AAA. */
  accent: "#1D3FBF",
  accentWash: "#E4E8FA",

  // — ink ground —
  /** Body and headings on ink. 16.37:1. */
  onInk: "#F7F5F0",
  /** Secondary text on ink. 7.18:1. */
  onInkMuted: "#A8A49C",
  /** Hairlines on ink. 3.21:1 — the first pick, #3A3F45, measured 1.67:1. */
  ruleOnInk: "#63696F",
  /** The focus ring and key figures on ink. 8.34:1 — AAA. */
  accentOnInk: "#8FB0FF",

  // — signal, used sparingly —
  fail: "#A8202A",
  pass: "#0C6B42",
  failOnInk: "#FF9A90",
  passOnInk: "#6FD79B",

  // — terminal, an ink inset on either ground —
  termBg: "#14181C",
  termFg: "#F7F5F0",
  termMuted: "#A8A49C",
} as const;

/** Pairs asserted by `npm run verify:palette`. [foreground, background, kind] */
export const CONTRAST_PAIRS: ReadonlyArray<
  readonly [string, string, "text" | "large" | "ui"]
> = [
  [COLORS.ink, COLORS.paper, "text"],
  [COLORS.inkMuted, COLORS.paper, "text"],
  [COLORS.accent, COLORS.paper, "text"],
  [COLORS.fail, COLORS.paper, "text"],
  [COLORS.pass, COLORS.paper, "text"],
  [COLORS.ink, COLORS.paperSunk, "text"],
  [COLORS.ink, COLORS.accentWash, "text"],
  [COLORS.accent, COLORS.accentWash, "text"],
  [COLORS.onInk, COLORS.ink, "text"],
  [COLORS.onInkMuted, COLORS.ink, "text"],
  [COLORS.accentOnInk, COLORS.ink, "text"],
  [COLORS.failOnInk, COLORS.ink, "text"],
  [COLORS.passOnInk, COLORS.ink, "text"],
  [COLORS.termFg, COLORS.termBg, "text"],
  [COLORS.termMuted, COLORS.termBg, "text"],
  [COLORS.rule, COLORS.paper, "ui"],
  [COLORS.ruleOnInk, COLORS.ink, "ui"],
] as const;

/**
 * A deliberately short type scale.
 *
 * Five sizes, not nine. The previous scale had eight and every scene used most
 * of them, which is how a frame ends up with four competing levels of
 * emphasis. Anything below `label` does not belong on screen at all.
 */
export const TYPE = {
  /** The one big number in a beat. Archivo, tight. */
  figure: 190,
  /** The one headline in a beat. Six words maximum. */
  headline: 76,
  /** A single supporting line. */
  lead: 40,
  /** Everything else that is prose. */
  body: 32,
  /** Uppercase eyebrows, sources, mono labels. Nothing is smaller. */
  label: 26,
  /** Open captions. Set once and never varied. */
  caption: 34,
  mono: 28,
} as const;

/**
 * Layout law. Enforced by `<Stage>` — content is clipped to this box, so a
 * scene physically cannot render into the caption zone.
 */
export const SAFE = {
  left: 160,
  right: 160,
  top: 110,
  /** Everything below y=850 belongs to the caption plate. Nothing else. */
  bottom: 230,
} as const;

export const CONTENT_HEIGHT = HEIGHT - SAFE.top - SAFE.bottom; // 740
export const CONTENT_WIDTH = WIDTH - SAFE.left - SAFE.right; // 1600

/** Scene durations in frames @ 30fps. Transitions overlap adjacent scenes. */
export const DURATIONS = {
  barrier: 420, // 14.0s   0:00 – 0:14
  why: 540, // 18.0s   0:13.5 – 0:31.5
  thesis: 330, // 11.0s   0:31 – 0:42
  loop: 690, // 23.0s   0:41.5 – 1:04.5
  passes: 810, // 27.0s   1:04 – 1:31
  beforeAfter: 720, // 24.0s   1:30.5 – 1:54.5
  benchmark: 480, // 16.0s   1:54 – 2:10
  honesty: 660, // 22.0s   2:09.5 – 2:31.5
  cta: 840, // 28.0s   2:31 – 2:59
} as const;

export const TRANSITION = 15;
export const TRANSITION_COUNT = 8;

const SCENE_TOTAL = Object.values(DURATIONS).reduce((a, b) => a + b, 0);

/** 5490 scene frames − 120 overlap = 5370 frames = 179s = 2:59. */
export const TOTAL_FRAMES = SCENE_TOTAL - TRANSITION * TRANSITION_COUNT;

/** Global frame at which each scene starts, accounting for transition overlap. */
export const SCENE_START = (() => {
  const keys = Object.keys(DURATIONS) as (keyof typeof DURATIONS)[];
  const out = {} as Record<keyof typeof DURATIONS, number>;
  let cursor = 0;
  keys.forEach((k, i) => {
    out[k] = cursor;
    cursor += DURATIONS[k] - (i < keys.length - 1 ? TRANSITION : 0);
  });
  return out;
})();
