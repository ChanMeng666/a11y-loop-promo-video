/**
 * Flash-safety gate for the rendered film.
 *
 * WCAG SC 2.3.1 (Three Flashes or Below Threshold) forbids more than three
 * flashes in any one-second period. A "flash" is a pair of opposing changes in
 * relative luminance where both states are ≥ 10% of full-scale luminance and
 * the change is ≥ 10% — the general flash threshold.
 *
 * This is a screening test, not a certified analyser: it samples whole-frame
 * average luminance rather than the 341×256-pixel "large area" region the
 * guideline defines, and it does not evaluate the red flash threshold at all.
 * A whole-frame average is the *conservative* direction for a cuts-and-fades
 * film like this one — a localised flash smaller than 25% of the viewport is
 * exempt anyway — but it is not a substitute for PEAT on content with real
 * strobing. This film has none, and the gate exists to keep it that way.
 *
 * Usage: node capture/check-flash.mjs out/a11y-loop-promo.mp4
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const FPS = 30;
/** Relative-luminance change that counts as a transition. */
const DELTA = 0.1;
/** Both sides of a flash pair must sit above this to count (general threshold). */
const FLOOR = 0.1;
/** SC 2.3.1's limit. */
const MAX_PER_SECOND = 3;

const target = resolve(process.argv[2] ?? 'out/a11y-loop-promo.mp4');

if (!existsSync(target)) {
  console.error(`No such file: ${target}\nRender first: npm run render`);
  process.exit(2);
}

/**
 * Pull per-frame average luminance out of ffmpeg's signalstats filter.
 * YAVG is the mean luma (0–255) of each frame.
 */
function luminance(path) {
  return new Promise((res, rej) => {
    const ff = spawn('ffmpeg', [
      '-hide_banner',
      '-nostats',
      '-i', path,
      '-vf', `fps=${FPS},signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-`,
      '-f', 'null',
      '-',
    ]);

    let out = '';
    let err = '';
    ff.stdout.on('data', (d) => (out += d));
    ff.stderr.on('data', (d) => (err += d));
    ff.on('error', () => rej(new Error('ffmpeg not found on PATH')));
    ff.on('close', (code) => {
      if (code !== 0 && !out) return rej(new Error(`ffmpeg exited ${code}\n${err.slice(-800)}`));
      const values = [...out.matchAll(/lavfi\.signalstats\.YAVG=([\d.]+)/g)].map((m) =>
        // Normalise to 0–1. signalstats reports full-range luma.
        Number(m[1]) / 255
      );
      res(values);
    });
  });
}

const frames = await luminance(target);

if (frames.length < FPS) {
  console.error(`Only ${frames.length} frames sampled — is the file complete?`);
  process.exit(2);
}

/**
 * A transition is a frame-to-frame luminance change of at least DELTA where
 * the brighter side clears the floor. Direction is tracked so an opposing pair
 * (up then down) can be counted as one flash rather than two transitions.
 */
const transitions = [];
for (let i = 1; i < frames.length; i += 1) {
  const change = frames[i] - frames[i - 1];
  if (Math.abs(change) >= DELTA && Math.max(frames[i], frames[i - 1]) >= FLOOR) {
    transitions.push({ frame: i, direction: Math.sign(change), change });
  }
}

/** Count opposing pairs within each rolling one-second window. */
let worst = { second: -1, flashes: 0 };
const offenders = [];
for (let start = 0; start + FPS <= frames.length; start += 1) {
  const window = transitions.filter((t) => t.frame >= start && t.frame < start + FPS);
  let flashes = 0;
  for (let i = 1; i < window.length; i += 1) {
    if (window[i].direction !== window[i - 1].direction) flashes += 1;
  }
  if (flashes > worst.flashes) worst = { second: start / FPS, flashes };
  if (flashes > MAX_PER_SECOND) {
    offenders.push({ at: (start / FPS).toFixed(2), flashes });
  }
}

const duration = (frames.length / FPS).toFixed(1);
console.log(`\nflash check — ${target}`);
console.log(`  ${frames.length} frames · ${duration}s · ${transitions.length} luminance transitions ≥ ${DELTA * 100}%`);
console.log(`  busiest second: ${worst.flashes} flash pair(s) at ${worst.second.toFixed(2)}s (limit ${MAX_PER_SECOND})`);
console.log('  screening test: whole-frame average luminance; no red-flash analysis. Not PEAT.');

if (offenders.length) {
  // Collapse the rolling windows into distinct regions so one busy moment
  // does not print thirty near-identical lines.
  const regions = [];
  for (const o of offenders) {
    const last = regions[regions.length - 1];
    if (last && Number(o.at) - Number(last.end) < 1) {
      last.end = o.at;
      last.peak = Math.max(last.peak, o.flashes);
    } else {
      regions.push({ start: o.at, end: o.at, peak: o.flashes });
    }
  }
  console.log(`\n  ${regions.length} region(s) over the limit:`);
  regions.forEach((r) => console.log(`    - ${r.start}s–${r.end}s · up to ${r.peak} flashes`));
  process.exit(1);
}

console.log('\n  no second exceeds three flashes');
