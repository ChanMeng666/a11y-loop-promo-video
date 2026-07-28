#!/usr/bin/env node
/**
 * Generate narration and sound effects from src/captions/script.json.
 *
 * Two things this does that a straight TTS loop does not:
 *
 * 1. **Measures what came back.** Estimated line timings are always wrong by a
 *    second or two. Every generated file is probed with ffprobe and the real
 *    duration written to public/audio-manifest.json, which the caption layer
 *    uses to scale its cues so text and voice cannot drift apart.
 *
 * 2. **Refuses to overwrite silently.** Regenerating costs credits, so an
 *    existing file is skipped unless --force is passed. `--only <id>`
 *    regenerates a single cue after a copy change.
 *
 * Usage:
 *   node --env-file=.env scripts/generate-audio.mjs
 *   node --env-file=.env scripts/generate-audio.mjs --only vo-03-thesis --force
 *   node --env-file=.env scripts/generate-audio.mjs --dry     (no API calls)
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');
const SCRIPT = join(ROOT, 'src', 'captions', 'script.json');

const API_KEY = process.env.ELEVENLABS_API_KEY || '';
const BASE = 'https://api.elevenlabs.io/v1';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY = args.includes('--dry');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

if (!API_KEY && !DRY) {
  console.error(
    'ELEVENLABS_API_KEY is not set.\n' +
      'Copy .env.example to .env and add your key, then run with --env-file=.env.\n' +
      'Use --dry to preview what would be generated without calling the API.'
  );
  process.exit(2);
}

/** ffprobe the real duration of a generated file, in seconds. */
function probeDuration(path) {
  return new Promise((resolve) => {
    const ff = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      path,
    ]);
    let out = '';
    ff.stdout.on('data', (d) => (out += d));
    ff.on('error', () => resolve(null));
    ff.on('close', () => {
      const n = Number(out.trim());
      resolve(Number.isFinite(n) ? n : null);
    });
  });
}

async function post(endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${(await res.text()).slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/** Pick a narration voice, preferring the names listed in script.json. */
async function pickVoice(preferred) {
  if (process.env.ELEVENLABS_VOICE_ID) {
    console.log(`  voice: ${process.env.ELEVENLABS_VOICE_ID} (pinned via ELEVENLABS_VOICE_ID)`);
    return process.env.ELEVENLABS_VOICE_ID;
  }

  const res = await fetch(`${BASE}/voices`, { headers: { 'xi-api-key': API_KEY } });
  const { voices = [] } = await res.json();

  for (const name of preferred) {
    // ElevenLabs appends a tagline, e.g. "Alice - confident British lady".
    const hit = voices.find((v) => v.name === name || v.name.startsWith(`${name} `) || v.name.startsWith(`${name}-`));
    if (hit) {
      console.log(`  voice: ${hit.name} (${hit.voice_id})`);
      return hit.voice_id;
    }
  }

  const fallback = voices.find((v) => v.labels?.use_case === 'narration') ?? voices[0];
  if (!fallback) throw new Error('No voices available on this account.');
  console.log(`  voice: ${fallback.name} (${fallback.voice_id}) — none of the preferred names were available`);
  return fallback.voice_id;
}

async function main() {
  const script = JSON.parse(await readFile(SCRIPT, 'utf8'));
  await mkdir(OUT, { recursive: true });

  const wanted = (id) => !ONLY || ONLY === id;
  const manifest = { generatedFrom: 'src/captions/script.json', vo: {}, sfx: {} };

    // Written into src/, not public/: the caption layer imports it at build
  // time, and Remotion cannot compile against a path that may not exist. The
  // mp3s stay in public/ and stay untracked.
  const existingManifestPath = join(ROOT, 'src', 'captions', 'audio-durations.json');
  if (existsSync(existingManifestPath)) {
    Object.assign(manifest, JSON.parse(await readFile(existingManifestPath, 'utf8')));
    manifest.vo ??= {};
    manifest.sfx ??= {};
  }

  console.log('\nElevenLabs generation');
  if (DRY) console.log('  --dry: no API calls will be made\n');

  // Resolve a voice only if something actually needs speaking. Every file
  // already existing is the common case on a re-run — and a transient failure
  // on /voices should not stop the script from, say, registering the bgm.
  const needsSpeech = script.vo.some(
    (cue) => wanted(cue.id) && (FORCE || !existsSync(join(OUT, `${cue.id}.mp3`)))
  );
  const voiceId = DRY || !needsSpeech ? 'DRY' : await pickVoice(script.voice.preferred);

  // ── narration ───────────────────────────────────────────────────────────
  console.log('\n  narration');
  for (const cue of script.vo) {
    if (!wanted(cue.id)) continue;
    const file = `${cue.id}.mp3`;
    const path = join(OUT, file);
    const words = cue.tts.split(/\s+/).length;

    if (existsSync(path) && !FORCE) {
      const duration = await probeDuration(path);
      manifest.vo[cue.id] = { file, startSec: cue.startSec, duration, words };
      console.log(`    ${cue.id.padEnd(20)} exists, skipped (${duration?.toFixed(1)}s)`);
      continue;
    }
    if (DRY) {
      console.log(`    ${cue.id.padEnd(20)} would generate · ${words} words · ~${(words / 2.33).toFixed(1)}s`);
      continue;
    }

    const buf = await post(`/text-to-speech/${voiceId}`, {
      text: cue.tts,
      model_id: script.voice.modelId,
      voice_settings: script.voice.settings,
    });
    await writeFile(path, buf);
    const duration = await probeDuration(path);
    manifest.vo[cue.id] = { file, startSec: cue.startSec, duration, words };

    // The cue timings in script.json are estimates. Flag any that the real
    // audio overruns, so the edit gets fixed rather than the caption drifting.
    const planned = cue.cues[cue.cues.length - 1].end - cue.startSec;
    const over = duration && duration > planned + 0.35;
    console.log(
      `    ${cue.id.padEnd(20)} ${duration?.toFixed(1)}s (planned ${planned.toFixed(1)}s)` +
        (over ? `  ← OVERRUNS by ${(duration - planned).toFixed(1)}s` : '')
    );
  }

  // ── sound effects ───────────────────────────────────────────────────────
  console.log('\n  sound effects');
  for (const sfx of script.sfx) {
    if (!wanted(sfx.id)) continue;
    const file = `${sfx.id}.mp3`;
    const path = join(OUT, file);

    if (existsSync(path) && !FORCE) {
      manifest.sfx[sfx.id] = { file, duration: await probeDuration(path) };
      console.log(`    ${sfx.id.padEnd(20)} exists, skipped`);
      continue;
    }
    if (DRY) {
      console.log(`    ${sfx.id.padEnd(20)} would generate · ${sfx.duration}s · "${sfx.prompt.slice(0, 44)}…"`);
      continue;
    }

    const buf = await post('/sound-generation', {
      text: sfx.prompt,
      duration_seconds: sfx.duration,
      prompt_influence: 0.45,
    });
    await writeFile(path, buf);
    manifest.sfx[sfx.id] = { file, duration: await probeDuration(path) };
    console.log(`    ${sfx.id.padEnd(20)} ${manifest.sfx[sfx.id].duration?.toFixed(1)}s`);
  }

  // The background music is not generated here — it comes from Suno — but it
  // still has to be registered, because the render guards every audio element
  // on this manifest. A bgm.mp3 dropped into public/ with no entry here is
  // never played, and nothing says so: the first cut with music shipped with a
  // full narration track and no bed at all underneath it.
  const bgmPath = join(OUT, 'bgm.mp3');
  if (existsSync(bgmPath)) {
    const duration = await probeDuration(bgmPath);
    manifest.bgm = { file: 'bgm.mp3', duration };
    console.log(`\n  bgm.mp3 registered · ${duration?.toFixed(1)}s`);
  } else {
    delete manifest.bgm;
    console.log('\n  public/bgm.mp3 is missing — generate it in Suno (see docs/suno-prompt.md)');
  }

  if (!DRY) {
    await writeFile(existingManifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(
      '\n  src/captions/audio-durations.json written — captions and sidecars scale to these measured durations'
    );
  }
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
