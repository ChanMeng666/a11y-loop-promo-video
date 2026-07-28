/**
 * Regenerate every piece of real footage the film uses, in order.
 *
 * Nothing in public/ is tracked in git (except the logo mark) because all of
 * it comes from here. If a capture drifts, the fix is to re-run this rather
 * than to patch a JSON by hand — the whole point is that what is on screen is
 * what the tool actually did.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

const STEPS = [
  ['verify-palette.mjs', 'checking the film’s own colours with a11y-loop contrast'],
  ['record-keyboard.mjs', 'keyboard walks + tab ring + dialog focus trap'],
  ['shoot-passes.mjs', 'five-pass matrix + full-page stills'],
  ['run-cli.mjs', 'real CLI runs for the terminal replays'],
  ['sync-data.mjs', 'manifests → src/data/ so the bundle can compile against them'],
  ['verify-assets.mjs', 'asset + on-screen-number check'],
];

function step(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(HERE, file)], { stdio: 'inherit' });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${file} exited ${code}`))));
  });
}

for (const [file, description] of STEPS) {
  console.log(`\n${'─'.repeat(72)}\n${file} — ${description}`);
  await step(file);
}

console.log('\nAll captures regenerated.');
