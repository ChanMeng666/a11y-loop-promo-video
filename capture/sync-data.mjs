/**
 * Copy the capture manifests out of public/ and into src/data/.
 *
 * Two reasons, both structural:
 *
 * 1. **Remotion has to compile against them.** public/ is untracked, so a
 *    fresh clone that hasn't run the captures yet would fail to build if the
 *    sections imported from there. src/data/ always exists.
 *
 * 2. **They are the film's factual record.** The PNGs and MP3s are just
 *    pixels and samples, regenerable and uninteresting in a diff. These JSON
 *    files are every number the film puts on screen — a change in them is a
 *    change in what the film claims, and that belongs in version control where
 *    it can be reviewed.
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PUBLIC_DIR, VIDEO_ROOT } from './lib/paths.mjs';

const DATA_DIR = join(VIDEO_ROOT, 'src', 'data');

/** stdout for a full audit is ~60 KB of findings; the film shows a slice. */
const TRIM_STDOUT_TO_LINES = 260;

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  const files = (await readdir(PUBLIC_DIR)).filter((f) => f.endsWith('.json'));

  let copied = 0;
  for (const file of files) {
    if (file === 'audio-manifest.json') continue;
    const raw = JSON.parse(await readFile(join(PUBLIC_DIR, file), 'utf8'));

    // Keep the record honest about any trimming rather than silently shortening.
    if (typeof raw.stdout === 'string') {
      const lines = raw.stdout.split('\n');
      if (lines.length > TRIM_STDOUT_TO_LINES) {
        raw.stdoutTotalLines = lines.length;
        raw.stdoutTrimmedTo = TRIM_STDOUT_TO_LINES;
        raw.stdout = lines.slice(0, TRIM_STDOUT_TO_LINES).join('\n');
        raw.trimNote =
          `stdout trimmed from ${lines.length} lines for the bundle; the film shows a ` +
          `contiguous slice of the head. Full output is in public/${file}.`;
      }
    }

    await writeFile(join(DATA_DIR, file), JSON.stringify(raw, null, 2) + '\n');
    copied += 1;
  }

  console.log(`\n  ${copied} manifest(s) synced to src/data/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
