#!/usr/bin/env node
/**
 * Emit sidecar .srt and .vtt from src/captions/script.json.
 *
 * The film burns open captions into the picture, so these sidecars are not the
 * only way to read it — but a burned-in caption cannot be restyled, resized,
 * fed to a braille display, or read by someone who wants the text without the
 * video. Both exist for that reason.
 *
 * If public/audio-manifest.json is present, cue times are scaled to the real
 * measured length of each narration file, so the sidecars match the audio that
 * actually shipped rather than the estimates the script was written against.
 */

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'src', 'captions', 'script.json');
const MANIFEST = join(ROOT, 'src', 'captions', 'audio-durations.json');
const OUT_DIR = join(ROOT, 'out');

const pad = (n, w = 2) => String(Math.floor(n)).padStart(w, '0');

function stamp(seconds, msSep) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}${msSep}${pad(ms, 3)}`;
}

/**
 * Scale a group's cues to the measured duration of its audio file.
 *
 * Only the interior is stretched — the group still starts where the film plays
 * it. A group with no measured audio is passed through unchanged.
 */
function fit(group, measured) {
  if (!measured?.duration) return group.cues;
  const start = group.startSec;
  const plannedEnd = group.cues[group.cues.length - 1].end;
  const planned = plannedEnd - start;
  if (planned <= 0) return group.cues;

  const k = measured.duration / planned;
  return group.cues.map((c) => ({
    ...c,
    start: start + (c.start - start) * k,
    end: start + (c.end - start) * k,
  }));
}

async function main() {
  const script = JSON.parse(await readFile(SCRIPT, 'utf8'));
  const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : null;

  const measured = manifest && Object.keys(manifest.vo ?? {}).length > 0;
  if (!measured) {
    console.log('  no measured audio yet — using the script’s estimated timings');
  }

  const cues = script.vo.flatMap((group) => fit(group, manifest?.vo?.[group.id]));
  cues.sort((a, b) => a.start - b.start);

  // Overlapping cues make a caption track flicker between two lines. Nudge any
  // overlap rather than shipping it.
  let fixed = 0;
  for (let i = 1; i < cues.length; i += 1) {
    if (cues[i].start < cues[i - 1].end) {
      cues[i - 1].end = cues[i].start - 0.001;
      fixed += 1;
    }
  }

  const srt = cues
    .map((c, i) => `${i + 1}\n${stamp(c.start, ',')} --> ${stamp(c.end, ',')}\n${c.text}\n`)
    .join('\n');

  const vtt = [
    'WEBVTT',
    '',
    ...cues.map((c) => `${stamp(c.start, '.')} --> ${stamp(c.end, '.')}\n${c.text}\n`),
  ].join('\n');

  await writeFile(join(OUT_DIR, 'a11y-loop-promo.srt'), srt, 'utf8');
  await writeFile(join(OUT_DIR, 'a11y-loop-promo.vtt'), vtt, 'utf8');

  const last = cues[cues.length - 1].end;
  console.log(
    `\n  ${cues.length} cues · last ends at ${last.toFixed(1)}s of ${script.durationSec}s` +
      (fixed ? ` · ${fixed} overlap(s) trimmed` : '') +
      (measured ? ' · scaled to measured audio' : '')
  );
  if (last > script.durationSec) {
    console.error('  captions run past the end of the film');
    process.exit(1);
  }
  console.log('  out/a11y-loop-promo.srt + .vtt written');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
