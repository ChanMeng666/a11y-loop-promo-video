/**
 * Capture real CLI runs for the terminal replay scenes.
 *
 * Every terminal in the film is this: actual stdout from actually running the
 * published binary against the actual demo pages, recorded verbatim along with
 * the exit code and wall-clock duration. Nothing is retyped or trimmed for
 * effect — the Remotion `Terminal` component types out exactly these strings,
 * and the edit controls only the speed.
 *
 * The CLI emits no ANSI colour, which is convenient: the film applies its own
 * light-on-dark syntax treatment to plain text rather than trying to translate
 * escape codes.
 */

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { CLI, DEMO_AFTER, DEMO_BEFORE, PUBLIC_DIR, TMP_DIR, VIDEO_ROOT } from './lib/paths.mjs';

/** Run the CLI once and record everything about the run. */
function run(name, args, { display } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd: VIDEO_ROOT,
      env: process.env,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));

    child.on('close', (exitCode) => {
      const durationMs = Date.now() - started;
      console.log(
        `  ${name.padEnd(22)} exit ${exitCode} · ${(durationMs / 1000).toFixed(1)}s · ${stdout.split('\n').length} lines`
      );
      resolve({
        name,
        /** What the film shows as the typed command line. */
        command: display ?? `a11y-loop ${args.join(' ')}`,
        argv: ['a11y-loop', ...args],
        stdout,
        stderr,
        exitCode,
        durationMs,
        capturedBy: 'capture/run-cli.mjs — verbatim, untrimmed',
      });
    });
  });
}

/** Shorten absolute paths so the terminal reads like someone's own checkout. */
function tidy(capture) {
  const replace = (s) =>
    String(s)
      .replaceAll(DEMO_BEFORE, 'demo/before')
      .replaceAll(DEMO_AFTER, 'demo/after')
      .replaceAll(TMP_DIR, 'reports')
      .replaceAll(VIDEO_ROOT, '.')
      .replaceAll('\\', '/');
  return {
    ...capture,
    command: replace(capture.command),
    stdout: replace(capture.stdout),
    stderr: replace(capture.stderr),
  };
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  const beforeReport = join(TMP_DIR, 'before.json');
  const afterReport = join(TMP_DIR, 'after.json');
  const states = join(VIDEO_ROOT, 'capture', 'states', 'register-modal.mjs');

  console.log('\nreal CLI runs');

  const captures = {};

  captures.auditBefore = await run(
    'audit-before',
    ['audit', '--file', join(DEMO_BEFORE, 'index.html'), '--out', beforeReport],
    { display: 'a11y-loop audit --file demo/before/index.html' }
  );

  captures.auditAfter = await run(
    'audit-after',
    ['audit', '--file', join(DEMO_AFTER, 'index.html'), '--out', afterReport],
    { display: 'a11y-loop audit --file demo/after/index.html' }
  );

  captures.diff = await run(
    'diff',
    ['diff', '--before', beforeReport, '--after', afterReport],
    { display: 'a11y-loop diff --before before.json --after after.json' }
  );

  // Scene 5: auditing a state that does not exist on page load.
  captures.interact = await run(
    'audit-interact',
    ['audit', '--file', join(DEMO_BEFORE, 'index.html'), '--interact', states, '--quiet'],
    { display: 'a11y-loop audit --file demo/before/index.html --interact states.mjs' }
  );

  // Scene 3: the film's own accent colour, checked with the film's own subject.
  captures.contrastSelf = await run(
    'contrast-self',
    ['contrast', '#0B4AA8', '#FAFAF7'],
    { display: 'a11y-loop contrast "#0B4AA8" "#FAFAF7"' }
  );

  // Scene 5: the OKLCh fix suggestion, on a real pair from demo/before — the
  // form-field text, which misses AA by 0.09. A near miss makes the point that
  // eyeballing a colour cannot settle this; #767676 on white, the grey people
  // reach for as an example, actually passes at 4.54:1.
  captures.contrastFix = await run(
    'contrast-fix',
    ['contrast', '#6d7a82', '#ffffff', '--fix'],
    { display: 'a11y-loop contrast "#6d7a82" "#ffffff" --fix' }
  );

  for (const [key, capture] of Object.entries(captures)) {
    await writeFile(
      join(PUBLIC_DIR, `cli-${capture.name}.json`),
      JSON.stringify(tidy(capture), null, 2)
    );
    captures[key] = tidy(capture);
  }

  // A compact index the film's fact-check step reads back.
  await writeFile(
    join(PUBLIC_DIR, 'cli-index.json'),
    JSON.stringify(
      Object.values(captures).map((c) => ({
        name: c.name,
        command: c.command,
        exitCode: c.exitCode,
        durationMs: c.durationMs,
      })),
      null,
      2
    )
  );

  console.log('\n  reports kept in capture/.tmp for the diff scene');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
