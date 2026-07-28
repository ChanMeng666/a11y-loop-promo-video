/**
 * The keyboard walk — the film's central piece of evidence.
 *
 * Drives the *same* opening keystrokes against demo/before and demo/after and
 * records, per keystroke: a full-resolution screenshot, where focus actually
 * landed, and whether the focused element renders any visible focus indicator.
 *
 * Two deliberate choices:
 *
 * 1. **Frames, not video.** Playwright's `recordVideo` is VP8 at a fixed
 *    quality and it smears small text. These pages are almost entirely still
 *    between keystrokes, so a screenshot per step plus a hold duration is both
 *    crisper and retimeable in the edit without re-capturing.
 *
 * 2. **The page is never modified.** No overlay is injected, no CSS is added.
 *    The focus marker and key-press chip you see in the film are drawn by
 *    Remotion from the JSON this writes. What is on screen is the unmodified
 *    page; the annotation is clearly editorial and labelled as such. Injecting
 *    a highlight into a page whose whole problem is that it has no visible
 *    focus indicator would be staging the result.
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

import { DEMO_AFTER, DEMO_BEFORE, PUBLIC_DIR, serveDirectory } from './lib/paths.mjs';

const VIEWPORT = { width: 1440, height: 900 };
const SCALE = 2;

/**
 * The opening phase, identical for both pages. Eight tabs and an Enter — the
 * ordinary act of trying to reach the primary call to action with a keyboard.
 */
const OPENING = [
  { key: null, hold: 1400, note: 'page loaded' },
  ...Array.from({ length: 8 }, () => ({ key: 'Tab', hold: 520 })),
  { key: 'Enter', hold: 1600, note: 'activate whatever has focus' },
];

/**
 * After the opening, each page is driven toward the registration dialog by the
 * route that page actually supports. `before` has no keyboard route to it at
 * all — the trigger is a <div onclick> — so the walk records that dead end
 * instead of pretending otherwise.
 */
const GOAL = {
  // On `before`, eight tabs and an Enter get you nowhere near registering. The
  // dead end is the whole point, so the walk simply stops there and the tab
  // ring below supplies the checkable claim.
  before: [{ key: null, hold: 1800, note: 'still no way to register' }],
  // On `after`, the eighth tab lands on the Register button and the Enter in
  // the opening phase already opened the dialog. Continue from inside it.
  after: [
    { key: 'Tab', hold: 520 },
    { key: 'Tab', hold: 520 },
    { key: 'Tab', hold: 620, note: 'every stop stays inside the dialog' },
    { key: 'Escape', hold: 1800, note: 'dialog closes, focus returns to the trigger' },
  ],
};

/**
 * Walk the focus cycle with the dialog open, and record whether any stop lands
 * on content behind it.
 *
 * Chromium's modal `<dialog>` wraps by handing focus to browser chrome for one
 * step — `document.activeElement` reads as <body> at that moment — before
 * re-entering the dialog at its first control. That single stop is the
 * platform's wrap point, not an escape, and this measurement is what lets the
 * film distinguish the two instead of guessing.
 */
async function dialogRing(page, cap = 16) {
  const stops = [];
  for (let i = 0; i < cap; i += 1) {
    const stop = await page.evaluate(() => {
      const d = document.getElementById('registerDialog') || document.getElementById('registerModal');
      const el = document.activeElement;
      if (!d || !el) return null;
      const behind = !d.contains(el) && el !== document.body && el !== document.documentElement;
      return {
        tag: el.tagName.toLowerCase(),
        inDialog: d.contains(el),
        /** True only if focus reached real page content behind the dialog. */
        escapedToPage: behind,
      };
    });
    if (!stop) break;
    stops.push(stop);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(90);
  }
  return {
    stops,
    escapes: stops.filter((s) => s.escapedToPage).length,
    chromeWrapStops: stops.filter((s) => !s.inDialog && !s.escapedToPage).length,
  };
}

/**
 * Walk the entire tab ring once and report every stop.
 *
 * This is what lets the film say "the Register control is not one of the N
 * stops" as a measured fact rather than an assertion. Stops are collected
 * until focus returns to the first one or a generous cap is hit.
 */
async function tabRing(page, cap = 80) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  const stops = [];
  for (let i = 0; i < cap; i += 1) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      const label =
        el.getAttribute('aria-label') ||
        (el.labels && el.labels[0] && el.labels[0].textContent.trim()) ||
        (el.textContent || '').trim().slice(0, 48) ||
        el.getAttribute('placeholder') ||
        '';
      return { tag: el.tagName.toLowerCase(), label, tabindex: el.getAttribute('tabindex') };
    });
    if (!stop) break;
    const key = `${stop.tag}|${stop.label}|${stop.tabindex}`;
    if (stops.length && key === `${stops[0].tag}|${stops[0].label}|${stops[0].tabindex}`) break;
    stops.push(stop);
  }
  return stops;
}

/** Read everything about the focused element that the film needs to be truthful. */
const PROBE = () => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) {
    return {
      none: true,
      scrollY: window.scrollY,
      // Which of the two it is matters: <body> means focus fell out of the
      // page's interactive content entirely.
      landedOn: el ? el.tagName.toLowerCase() : 'null',
    };
  }
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const label =
    el.getAttribute('aria-label') ||
    (el.labels && el.labels[0] && el.labels[0].textContent.trim()) ||
    (el.textContent || '').trim().slice(0, 60) ||
    el.getAttribute('placeholder') ||
    '';

  const outlineWidth = parseFloat(cs.outlineWidth) || 0;
  const hasOutline = cs.outlineStyle !== 'none' && outlineWidth > 0;
  const hasShadow = cs.boxShadow !== 'none' && cs.boxShadow !== '';

  return {
    none: false,
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role') || null,
    type: el.getAttribute('type') || null,
    tabindex: el.getAttribute('tabindex'),
    label,
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    scrollY: window.scrollY,
    // Reported as measured, not interpreted. The film says "outline: none"
    // because the page says outline: none.
    focusStyle: {
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      boxShadow: hasShadow ? cs.boxShadow : 'none',
      visibleIndicator: hasOutline || hasShadow,
    },
    /** Is this element actually operable by keyboard, or only by mouse? */
    keyboardOperable: !(
      el.tagName.toLowerCase() === 'div' && el.hasAttribute('onclick') && !el.hasAttribute('tabindex')
    ),
  };
};

/** Was the register dialog open at this moment? Recorded so the edit can't misstate it. */
const DIALOG_STATE = () => {
  const native = document.getElementById('registerDialog');
  if (native) return native.open ? 'open' : 'closed';
  const hand = document.getElementById('registerModal');
  if (hand) return hand.classList.contains('open') ? 'open' : 'closed';
  return 'none';
};

async function walk(browser, { name, root, steps }) {
  const server = await serveDirectory(root);
  const outDir = join(PUBLIC_DIR, `kb-${name}`);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    reducedMotion: 'no-preference',
    colorScheme: 'light',
  });
  const page = await context.newPage();
  await page.goto(server.url, { waitUntil: 'networkidle' });

  // Start from a clean slate: focus the document body so the first Tab is
  // genuinely the first Tab, not a continuation of whatever the browser did.
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });

  const frames = [];
  for (const [i, step] of steps.entries()) {
    if (step.key) await page.keyboard.press(step.key);
    if (step.focus) await page.locator(step.focus).focus();
    // Let focus-driven scrolling and any dialog transition settle before the shot.
    await page.waitForTimeout(step.key || step.focus ? 260 : 120);

    const probe = await page.evaluate(PROBE);
    const dialog = await page.evaluate(DIALOG_STATE);
    const file = `${String(i).padStart(2, '0')}.png`;
    await page.screenshot({ path: join(outDir, file), animations: 'disabled' });

    frames.push({
      file: `kb-${name}/${file}`,
      key: step.key ?? null,
      hold: step.hold,
      note: step.note ?? null,
      dialog,
      focus: probe,
    });

    const where = probe.none
      ? `nothing focused (<${probe.landedOn}>)`
      : `${probe.tag}${probe.tabindex ? `[tabindex=${probe.tabindex}]` : ''} "${probe.label}"`;
    const ring = probe.none
      ? ''
      : probe.focusStyle.visibleIndicator
        ? ' · focus ring visible'
        : ' · NO visible focus ring';
    console.log(`  ${String(i).padStart(2, '0')} ${(step.key ?? step.focus ?? 'load').padEnd(8)} → ${where}${ring}`);
  }

  // Measure the tab ring on a fresh load, so the walk above can't have
  // perturbed it (the `before` page's dialog, once opened, changes the ring).
  const ringPage = await context.newPage();
  await ringPage.goto(server.url, { waitUntil: 'networkidle' });
  const stops = await tabRing(ringPage);
  const reachesRegister = stops.some((s) => /register now/i.test(s.label));

  // With the dialog open, does focus ever reach the page behind it?
  let trap = null;
  const opener = await ringPage.$('#registerTrigger, .btn-primary');
  if (opener) {
    await opener.click();
    await ringPage.waitForTimeout(300);
    trap = await dialogRing(ringPage);
  }
  await ringPage.close();

  await context.close();
  await server.close();

  const manifest = {
    name,
    source: root,
    viewport: VIEWPORT,
    scale: SCALE,
    pixelSize: { width: VIEWPORT.width * SCALE, height: VIEWPORT.height * SCALE },
    capturedFrom: 'unmodified page — no injected overlay or CSS',
    tabRing: { stopCount: stops.length, reachesRegister, stops },
    dialogTrap: trap,
    frames,
  };
  await writeFile(join(PUBLIC_DIR, `kb-${name}.json`), JSON.stringify(manifest, null, 2));
  return manifest;
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const [name, root] of [
      ['before', DEMO_BEFORE],
      ['after', DEMO_AFTER],
    ]) {
      console.log(`\nkeyboard walk — ${name}`);
      const manifest = await walk(browser, { name, root, steps: [...OPENING, ...GOAL[name]] });

      const invisible = manifest.frames.filter(
        (f) => !f.focus.none && f.focus.focusStyle && !f.focus.focusStyle.visibleIndicator
      ).length;
      const { stopCount, reachesRegister } = manifest.tabRing;
      console.log(
        `  ${manifest.frames.length} frames · ${invisible} with no visible focus indicator`
      );
      console.log(
        `  tab ring: ${stopCount} stops · reaches "Register now": ${reachesRegister ? 'yes' : 'NO'}`
      );
      if (manifest.dialogTrap) {
        const { escapes, chromeWrapStops, stops: ds } = manifest.dialogTrap;
        console.log(
          `  dialog open: ${ds.length} focus stops · escaped to page behind: ${escapes} · chrome wrap: ${chromeWrapStops}`
        );
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
