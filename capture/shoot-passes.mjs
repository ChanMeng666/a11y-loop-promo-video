/**
 * The five-pass matrix for scene 5.
 *
 * `a11y-loop audit` renders every target under five conditions, because most
 * real failures only exist under one of them. This reproduces those exact five
 * conditions in Playwright and shoots a still of each, so the film shows the
 * passes rather than describing them.
 *
 * The dark pane is the one that matters: demo/before ships a
 * `prefers-color-scheme: dark` block whose contrast is worse than its light
 * counterpart, and a single default-viewport scan never renders it. Rather
 * than assert that, this script measures the rendered text/background pair in
 * both schemes and writes the numbers into the manifest.
 */

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

import { CLI, DEMO_AFTER, DEMO_BEFORE, PUBLIC_DIR, serveDirectory } from './lib/paths.mjs';

/**
 * Hand the composited colours to `a11y-loop contrast` so the ratio in the film
 * comes from the tool the film is about, not from a second implementation of
 * the same formula living in this script.
 *
 * Forced-colors composites the background as transparent (the OS paints it),
 * so there is no meaningful author-specified pair to check under that pass.
 */
function contrast(fg, bg) {
  // Any fully transparent background means the OS is painting it, not the
  // author. Match on the alpha channel rather than a specific rgba string —
  // forced-colors reports `rgba(255, 255, 255, 0)`, which a literal
  // `rgba(0, 0, 0, 0)` check waves through and then "measures" at 21:1.
  const alpha = /rgba?\([^)]*,\s*([\d.]+)\s*\)/.exec(String(bg));
  const transparent = bg === 'transparent' || (alpha && Number(alpha[1]) === 0);
  if (!fg || !bg || transparent) return Promise.resolve(null);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI, 'contrast', fg, bg, '--json']);
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.on('close', () => {
      try {
        const j = JSON.parse(out);
        resolve({ ratio: j.ratioDisplay, passesAA: j.passes?.AA === true, sc: j.wcag?.sc });
      } catch {
        resolve(null);
      }
    });
  });
}

/** The five conditions, matching src/lib/browser-utils.js in the a11y-loop repo. */
const PASSES = [
  {
    id: 'default',
    label: 'default',
    detail: '1280 × 720',
    viewport: { width: 1280, height: 720 },
    context: {},
  },
  {
    id: 'dark',
    label: 'dark mode',
    detail: 'prefers-color-scheme: dark',
    viewport: { width: 1280, height: 720 },
    context: { colorScheme: 'dark' },
  },
  {
    id: 'forced-colors',
    label: 'forced colours',
    detail: 'forced-colors: active',
    viewport: { width: 1280, height: 720 },
    context: { forcedColors: 'active' },
  },
  {
    id: 'reduced-motion',
    label: 'reduced motion',
    detail: 'prefers-reduced-motion: reduce',
    viewport: { width: 1280, height: 720 },
    context: { reducedMotion: 'reduce' },
  },
  {
    id: 'reflow',
    label: 'reflow',
    detail: '320 × 256 — the WCAG equivalent of 400% zoom, SC 1.4.10',
    viewport: { width: 320, height: 256 },
    context: {},
  },
];

/**
 * Measure the rendered colours of the page's body text, as the browser
 * actually composited them under this pass. Used to show that the dark pass is
 * not a cosmetic variation.
 */
const MEASURE = () => {
  const el =
    document.querySelector('.section-lead') ||
    document.querySelector('p') ||
    document.body;
  const cs = getComputedStyle(el);

  // Walk up for the first non-transparent background, the way a contrast
  // checker has to.
  let node = el;
  let bg = 'rgba(0, 0, 0, 0)';
  while (node) {
    const c = getComputedStyle(node).backgroundColor;
    if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') {
      bg = c;
      break;
    }
    node = node.parentElement;
  }

  return {
    selector: el.className || el.tagName.toLowerCase(),
    color: cs.color,
    backgroundColor: bg,
    documentHasHorizontalScroll:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  };
};

async function shoot(browser, { name, root }) {
  const server = await serveDirectory(root);
  const results = [];

  for (const pass of PASSES) {
    const context = await browser.newContext({
      viewport: pass.viewport,
      deviceScaleFactor: 2,
      ...pass.context,
    });
    const page = await context.newPage();
    await page.goto(server.url, { waitUntil: 'networkidle' });
    // Let the ticker animation reach a stable point, and any web font settle.
    await page.waitForTimeout(700);

    const file = `pass-${name}-${pass.id}.png`;
    await page.screenshot({ path: join(PUBLIC_DIR, file), animations: 'disabled', fullPage: false });

    // And the whole page, which is what the five-up strip in scene 5 shows.
    // An above-the-fold crop forced into a card of a different aspect ratio
    // cut every pane off mid-section; at 1280 x 2333 the complete page fits a
    // 0.549 card exactly, and the silhouette is what the scene is comparing.
    // Scale factor 1 is ample — these display about 274px wide.
    const fullFile = `passfull-${name}-${pass.id}.png`;
    const tallCtx = await browser.newContext({ viewport: pass.viewport, deviceScaleFactor: 1, ...pass.context });
    const tallPage = await tallCtx.newPage();
    await tallPage.goto(server.url, { waitUntil: 'networkidle' });
    await tallPage.waitForTimeout(600);
    const doc = await tallPage.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    // A fullPage screenshot expands to the document's scrollWidth, not the
    // viewport. On the 320px pass that means Playwright hands back a 1180px
    // image — which is itself the finding (asked for 320, the page insists on
    // 1180) but renders indistinguishable from the four wide passes. Clip to
    // the viewport width so the pane shows what someone at 320px actually
    // sees: a narrow column with the rest of the page off the right edge.
    await tallPage.screenshot({
      path: join(PUBLIC_DIR, fullFile),
      animations: 'disabled',
      fullPage: true,
      clip: { x: 0, y: 0, width: pass.viewport.width, height: doc.scrollHeight },
    });
    const fullHeight = doc.scrollHeight;
    await tallCtx.close();
    const measured = await page.evaluate(MEASURE);
    const ratio = await contrast(measured.color, measured.backgroundColor);

    results.push({
      ...pass,
      file,
      pixelSize: { width: pass.viewport.width * 2, height: pass.viewport.height * 2 },
      measured,
      contrast: ratio,
      fullFile,
      fullSize: { width: pass.viewport.width, height: fullHeight },
      documentScrollWidth: doc.scrollWidth,
    });
    console.log(
      `  ${pass.id.padEnd(15)} ${measured.color} on ${measured.backgroundColor}` +
        (ratio ? `  → ${ratio.ratio}:1 ${ratio.passesAA ? 'PASS' : 'FAIL'} AA` : '  → n/a') +
        (measured.documentHasHorizontalScroll ? '  · horizontal scroll present' : '')
    );

    await context.close();
  }

  // Full-page shots for the scene-6 seam wipe, where the two versions of the
  // page sit side by side and the viewer needs to see more than the fold.
  const tall = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const tallPage = await tall.newPage();
  await tallPage.goto(server.url, { waitUntil: 'networkidle' });
  await tallPage.waitForTimeout(700);
  const fullFile = `full-${name}.png`;
  await tallPage.screenshot({ path: join(PUBLIC_DIR, fullFile), fullPage: true, animations: 'disabled' });
  const fullHeight = await tallPage.evaluate(() => document.documentElement.scrollHeight);
  await tall.close();
  console.log(`  full page      ${fullFile} · 1280 × ${fullHeight} css px`);

  await server.close();
  return { passes: results, fullPage: { file: fullFile, width: 1280, height: fullHeight, scale: 2 } };
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });
  const browser = await chromium.launch();
  const manifest = {};
  try {
    for (const [name, root] of [
      ['before', DEMO_BEFORE],
      ['after', DEMO_AFTER],
    ]) {
      console.log(`\nfive-pass matrix — ${name}`);
      manifest[name] = await shoot(browser, { name, root });
    }
  } finally {
    await browser.close();
  }

  await writeFile(join(PUBLIC_DIR, 'passes.json'), JSON.stringify(manifest, null, 2));

  const reflowBefore = manifest.before.passes.find((p) => p.id === 'reflow');
  const reflowAfter = manifest.after.passes.find((p) => p.id === 'reflow');
  console.log(
    `\n  reflow at 320px — before: ${reflowBefore.measured.documentHasHorizontalScroll ? 'overflows' : 'fits'}` +
      ` · after: ${reflowAfter.measured.documentHasHorizontalScroll ? 'overflows' : 'fits'}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
