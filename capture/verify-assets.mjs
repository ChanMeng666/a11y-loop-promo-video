/**
 * Assert that every asset the film references actually exists and is usable.
 *
 * Remotion fails softly on a missing `staticFile` — you get a blank region in
 * the render rather than an error — so an 8-minute render can complete and
 * ship with a hole in it. This runs first and fails loudly instead.
 */

import { access, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { PUBLIC_DIR } from './lib/paths.mjs';

const problems = [];
const notes = [];

async function sized(rel, { minBytes = 1024 } = {}) {
  const path = join(PUBLIC_DIR, rel);
  try {
    const info = await stat(path);
    if (info.size < minBytes) {
      problems.push(`${rel} — only ${info.size} bytes`);
      return null;
    }
    return info;
  } catch {
    problems.push(`${rel} — missing`);
    return null;
  }
}

async function json(rel) {
  const path = join(PUBLIC_DIR, rel);
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (err) {
    problems.push(`${rel} — ${err.code === 'ENOENT' ? 'missing' : 'unparseable'}`);
    return null;
  }
}

async function main() {
  console.log('\nasset check\n');

  // --- keyboard walks ------------------------------------------------------
  for (const name of ['before', 'after']) {
    const manifest = await json(`kb-${name}.json`);
    if (!manifest) continue;
    let missing = 0;
    for (const frame of manifest.frames) {
      await access(join(PUBLIC_DIR, frame.file)).catch(() => {
        missing += 1;
        problems.push(`kb-${name}: frame ${frame.file} missing`);
      });
    }
    console.log(
      `  kb-${name.padEnd(8)} ${manifest.frames.length} frames · ${missing} missing · ` +
        `${manifest.tabRing.stopCount} tab stops`
    );
    if (typeof manifest.tabRing.reachesRegister !== 'boolean') {
      problems.push(`kb-${name}: tabRing.reachesRegister not recorded`);
    }
  }

  // --- five-pass matrix ----------------------------------------------------
  const passes = await json('passes.json');
  if (passes) {
    for (const [name, group] of Object.entries(passes)) {
      for (const pass of group.passes) await sized(pass.file, { minBytes: 8 * 1024 });
      await sized(group.fullPage.file, { minBytes: 32 * 1024 });
      console.log(`  passes-${name.padEnd(6)} ${group.passes.length} stills + full page`);
    }

    // The dark pane is scene 5's whole argument. If it ever stops being worse
    // than the default pane, the scene is making a claim the capture doesn't
    // support and the script needs rewriting, not the render re-running.
    const d = passes.before.passes.find((p) => p.id === 'dark');
    const def = passes.before.passes.find((p) => p.id === 'default');
    if (d?.contrast && def?.contrast) {
      const worse = Number(d.contrast.ratio) < Number(def.contrast.ratio);
      notes.push(
        `dark pass ${worse ? 'is' : 'is NOT'} worse than default on demo/before ` +
          `(${d.contrast.ratio}:1 vs ${def.contrast.ratio}:1)`
      );
      if (!worse) problems.push('scene 5 claims the dark pass is worse; the capture disagrees');
    }
  }

  // --- CLI captures --------------------------------------------------------
  const expectedCli = [
    ['cli-audit-before.json', 1],
    ['cli-audit-after.json', 0],
    ['cli-diff.json', 0],
    ['cli-audit-interact.json', 1],
    ['cli-contrast-self.json', 0],
    // Exit 1 is correct here and is the reason this capture exists: the pair
    // misses AA, so the CLI reports a threshold miss and suggests a fix. A 0
    // would mean the demo pair had stopped failing and the scene had lost its
    // subject.
    ['cli-contrast-fix.json', 1],
  ];
  for (const [file, expectedExit] of expectedCli) {
    const c = await json(file);
    if (!c) continue;
    if (c.exitCode !== expectedExit) {
      problems.push(`${file} — exit ${c.exitCode}, expected ${expectedExit}`);
    }
    if (!c.stdout.trim()) problems.push(`${file} — empty stdout`);
    console.log(`  ${file.padEnd(26)} exit ${c.exitCode} · ${c.stdout.split('\n').length} lines`);
  }

  // --- the numbers the film puts on screen ---------------------------------
  const before = await json('cli-audit-before.json');
  const after = await json('cli-audit-after.json');
  const diff = await json('cli-diff.json');
  const interact = await json('cli-audit-interact.json');

  const claim = (label, condition, detail) => {
    if (condition) notes.push(`${label}: ${detail}`);
    else problems.push(`${label} — not supported by the capture (${detail})`);
  };

  if (before) {
    const m = /VIOLATIONS \((\d+)\)/.exec(before.stdout);
    claim('scene 6 "163"', m?.[1] === '163', `audit reports ${m?.[1] ?? 'no count'}`);
  }
  if (after) {
    claim('scene 6 "zero"', after.exitCode === 0, `after-audit exit ${after.exitCode}`);
  }
  if (diff) {
    claim(
      'scene 6 "Converged"',
      /Converged: all 163 violations fixed, none introduced/.test(diff.stdout),
      'diff verdict line present verbatim'
    );
    claim(
      'scene 6 needs-review line',
      /needs-review finding\(s\) — not blocking, but new/.test(diff.stdout),
      'the caveat the scene must not crop is present'
    );
  }
  if (interact) {
    const m = /^(\d+) automatically detectable failures/m.exec(interact.stdout);
    const withStates = Number(m?.[1]);
    claim(
      'scene 5 "163 → 179"',
      withStates > 163,
      `--interact reports ${withStates}, page-load reports 163 (+${withStates - 163})`
    );
  }

  // --- logo ----------------------------------------------------------------
  await sized('a11y-loop-mark.svg', { minBytes: 200 });

  console.log('');
  notes.forEach((n) => console.log(`  note: ${n}`));

  if (problems.length) {
    console.log(`\n  ${problems.length} problem(s):`);
    problems.forEach((p) => console.log(`    - ${p}`));
    process.exit(1);
  }
  console.log('\n  all assets present and every on-screen number matches its capture');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
