/**
 * Interaction states for the demo conference page.
 *
 * This is the file `a11y-loop audit --interact` takes: each export drives the
 * page into a state that only exists after a user does something, so the audit
 * can run its five passes against that state too. On page load the
 * registration dialog is not in the accessibility tree at all — an
 * axe-on-load scan finds nothing wrong with it because there is nothing there
 * to find.
 *
 * Both states are written to be genuine no-ops when the control they need is
 * not rendered (the hamburger only exists at the 320px reflow pass), so the
 * same file works across every pass without throwing.
 */

export const states = {
  'register-dialog-open': async (page) => {
    // demo/after uses a real <button id="registerTrigger">; demo/before uses a
    // clickable <div class="btn btn-primary">. Try both, so one states file
    // covers the page in either condition.
    const trigger = page.locator('#registerTrigger, .hero .btn-primary').first();
    if (!(await trigger.isVisible().catch(() => false))) return;
    await trigger.click();
    await page.waitForTimeout(250);
  },

  'mobile-nav-expanded': async (page) => {
    const hamburger = page.locator('.hamburger, [aria-controls="site-nav"]').first();
    if (!(await hamburger.isVisible().catch(() => false))) return;
    await hamburger.click();
    await page.waitForTimeout(250);
  },
};
