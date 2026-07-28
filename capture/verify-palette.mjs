/**
 * Check every colour pair the film puts on screen, using the tool the film is
 * about.
 *
 * This is a build gate, not decoration. If a palette change drops a pair below
 * its WCAG threshold the exit code is non-zero and the render should not
 * happen — a video arguing for accessible defaults does not get to ship
 * failing contrast.
 *
 * Run with `--report` to print measured ratios without failing, which is how
 * the palette was chosen in the first place.
 */

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { CLI, VIDEO_ROOT } from './lib/paths.mjs';

const REPORT_ONLY = process.argv.includes('--report');

/**
 * Mirrors CONTRAST_PAIRS in src/constants.ts. Kept as plain data because this
 * script runs in Node without the TypeScript toolchain — and guarded below by
 * a count check, because a hand-maintained copy of a list is exactly the thing
 * that goes stale silently. It did: after the palette was rebuilt around two
 * grounds, this file spent a while cheerfully verifying colours the film no
 * longer used, and reporting all-clear.
 */
const PAIRS = [
  // paper ground
  ['ink on paper', '#14181C', '#F7F5F0', 'text'],
  ['inkMuted on paper', '#565049', '#F7F5F0', 'text'],
  ['accent on paper', '#1D3FBF', '#F7F5F0', 'text'],
  ['fail on paper', '#A8202A', '#F7F5F0', 'text'],
  ['pass on paper', '#0C6B42', '#F7F5F0', 'text'],
  ['ink on paperSunk', '#14181C', '#EDEAE3', 'text'],
  ['ink on accentWash', '#14181C', '#E4E8FA', 'text'],
  ['accent on accentWash', '#1D3FBF', '#E4E8FA', 'text'],
  ['rule on paper', '#8A8378', '#F7F5F0', 'ui'],
  // ink ground
  ['onInk on ink', '#F7F5F0', '#14181C', 'text'],
  ['onInkMuted on ink', '#A8A49C', '#14181C', 'text'],
  ['accentOnInk on ink', '#8FB0FF', '#14181C', 'text'],
  ['failOnInk on ink', '#FF9A90', '#14181C', 'text'],
  ['passOnInk on ink', '#6FD79B', '#14181C', 'text'],
  ['ruleOnInk on ink', '#63696F', '#14181C', 'ui'],
  // terminal inset
  ['termFg on termBg', '#F7F5F0', '#14181C', 'text'],
  ['termMuted on termBg', '#A8A49C', '#14181C', 'text'],
];

/** Fail loudly if src/constants.ts has gained or lost a pair since this list. */
async function assertInSyncWithConstants() {
  const src = await readFile(join(VIDEO_ROOT, 'src', 'constants.ts'), 'utf8');
  const start = src.indexOf('CONTRAST_PAIRS');
  if (start === -1) return;
  const end = src.indexOf('] as const;', start);
  const declared = (src.slice(start, end).match(/\[COLORS\./g) ?? []).length;

  if (declared !== PAIRS.length) {
    console.error(
      `\n  src/constants.ts declares ${declared} contrast pairs; this script checks ${PAIRS.length}.` +
        '\n  Update PAIRS in capture/verify-palette.mjs to match, then re-run.'
    );
    process.exit(1);
  }
}

function contrast(fg, bg, kind) {
  return new Promise((resolve) => {
    const args = ['contrast', fg, bg, '--json'];
    if (kind === 'ui') args.push('--ui');
    if (kind === 'large') args.push('--large');
    const child = spawn(process.execPath, [CLI, ...args]);
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.on('close', () => {
      try {
        resolve({ parsed: JSON.parse(out), raw: out });
      } catch {
        resolve({ parsed: null, raw: out });
      }
    });
  });
}

async function main() {
  await assertInSyncWithConstants();
  console.log(`\npalette check — ${PAIRS.length} pairs, measured by a11y-loop contrast\n`);
  const failures = [];

  for (const [name, fg, bg, kind] of PAIRS) {
    const { parsed, raw } = await contrast(fg, bg, kind);
    if (!parsed) {
      console.log(`  ${name.padEnd(24)} could not parse output:\n${raw}`);
      failures.push(name);
      continue;
    }

    // Shape: { ratio, ratioDisplay, wcag: { sc, level, required }, passes: { AA, AAA } }.
    // `passes` is an object, so it must be read by key — truthiness alone would
    // wave everything through, including a 1.61:1 hairline.
    const ratio = parsed.ratioDisplay ?? String(parsed.ratio);
    const threshold = parsed.wcag?.required ?? (kind === 'ui' ? 3 : 4.5);
    const passesAA = parsed.passes?.AA === true;
    const passesAAA = parsed.passes?.AAA ?? null;

    const aaaNote = kind === 'ui' ? '' : passesAAA ? ' · AAA too' : ' · AA only';
    console.log(
      `  ${name.padEnd(24)} ${ratio.padStart(6)}:1  ${passesAA ? 'PASS' : 'FAIL'} ` +
        `${parsed.wcag?.sc ?? ''} (needs ${threshold}:1)${aaaNote}`
    );
    if (!passesAA) failures.push(`${name} — ${ratio}:1, needs ${threshold}:1`);
  }

  if (failures.length) {
    console.log(`\n  ${failures.length} pair(s) below threshold:`);
    failures.forEach((f) => console.log(`    - ${f}`));
    if (!REPORT_ONLY) process.exit(1);
  } else {
    console.log('\n  all pairs meet their WCAG 2.2 threshold');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
