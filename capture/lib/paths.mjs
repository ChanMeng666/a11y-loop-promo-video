import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const VIDEO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PUBLIC_DIR = join(VIDEO_ROOT, 'public');
export const TMP_DIR = join(VIDEO_ROOT, 'capture', '.tmp');

/**
 * Locate the a11y-loop checkout this video documents.
 *
 * Everything on screen is captured from the real thing, so if this resolves to
 * the wrong place the film would be showing something other than the product.
 * Fail loudly rather than fall back to a stub.
 */
export function a11yLoopRepo() {
  const candidates = [
    process.env.A11Y_LOOP_REPO,
    resolve(VIDEO_ROOT, '..', 'a11y-loop'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'src', 'cli.js')) && existsSync(join(candidate, 'demo', 'before', 'index.html'))) {
      return resolve(candidate);
    }
  }

  throw new Error(
    'Could not find the a11y-loop repo. Set A11Y_LOOP_REPO to the checkout path.\n' +
      `Looked in: ${candidates.join(', ')}`
  );
}

export const REPO = a11yLoopRepo();
export const CLI = join(REPO, 'src', 'cli.js');
export const DEMO_BEFORE = join(REPO, 'demo', 'before');
export const DEMO_AFTER = join(REPO, 'demo', 'after');

/** a11y-loop's own static server — the same code path `a11y-loop audit --file` uses. */
export async function serveDirectory(root, entry = 'index.html') {
  const { serveDirectory: serve } = await import(
    new URL(`file:///${join(REPO, 'src', 'lib', 'serve.js').replace(/\\/g, '/')}`).href
  );
  return serve(root, entry);
}
