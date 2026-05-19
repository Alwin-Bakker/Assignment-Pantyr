/**
 * Planning Poker — end-to-end test against the real backend.
 *
 * Tests:
 *  1. host creates, guest joins, both vote, results reveal, host resets (2 users)
 *  2. 3 users — all vote, host manually reveals via button
 *  3. 3 users — one goes inactive, auto-reveal fires without host pressing button
 */

import { test, expect, type Browser, type Page } from '@playwright/test';

const BASE = 'http://localhost:5173';

async function createSession(browser: Browser, hostName: string): Promise<{ page: Page; code: string }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE);

  // Fill the "Start a session" form (first "Your name" label)
  await page.getByLabel('Your name').first().fill(hostName);
  await page.getByRole('button', { name: /start session/i }).click();

  await expect(page).toHaveURL(/\/session\//);
  // Route now uses session ID (/session/:id); extract the join code from the heading
  const heading = page.getByRole('heading', { level: 2 });
  await expect(heading).toBeVisible();
  const headingText = await heading.textContent();
  // Heading reads "Session XXXX" — extract the code after "Session "
  const code = headingText?.replace(/^Session\s+/i, '').trim() ?? '';
  return { page, code };
}

async function joinSession(browser: Browser, code: string, guestName: string): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE);

  // Fill the "Join a session" form (second "Your name" + "Session code")
  await page.getByLabel('Your name').nth(1).fill(guestName);
  await page.getByLabel(/session code/i).fill(code);
  await page.getByRole('button', { name: /join session/i }).click();

  await expect(page).toHaveURL(/\/session\//);
  return page;
}

test.describe('Planning Poker full flow', () => {
  test('host creates, guest joins, both vote, results reveal, host resets', async ({ browser }) => {
    // ── 1. Host creates a session ──────────────────────────────────────
    const { page: hostPage, code } = await createSession(browser, 'Alice');
    await expect(hostPage.getByRole('heading', { name: new RegExp(code, 'i') })).toBeVisible();

    // ── 2. Guest joins the same session ───────────────────────────────
    const guestPage = await joinSession(browser, code, 'Bob');
    await expect(guestPage.getByRole('heading', { name: new RegExp(code, 'i') })).toBeVisible();

    // ── 3. Host votes with estimate "5" ───────────────────────────────
    await hostPage.getByRole('button', { name: 'Estimate 5' }).click();

    // Reload guest's view (or wait for subscription — in CI we poll)
    await guestPage.reload();
    await guestPage.waitForTimeout(500);

    // ── 4. Estimate stays hidden on guest side ─────────────────────────
    // Guest can see Alice has voted but her value should not be visible
    const aliceVotedBadge = guestPage.getByText('Voted').first();
    await expect(aliceVotedBadge).toBeVisible();

    // Results panel should still say hidden
    const guestResultsPanel = guestPage.locator('[data-testid="results-panel"]');
    await expect(guestResultsPanel.getByText(/hidden until/i)).toBeVisible();

    // ── 5. Guest votes with estimate "3" ──────────────────────────────
    await guestPage.getByRole('button', { name: 'Estimate 3' }).click();

    // ── 6. Host reveals ───────────────────────────────────────────────
    // All voted — no confirm needed
    await hostPage.reload();
    await hostPage.waitForTimeout(500);
    await hostPage.getByRole('button', { name: /reveal estimates/i }).click();

    // If a confirm dialog appears (not everyone revealed), click confirm
    const revealConfirm = hostPage.getByRole('button', { name: /^reveal$/i });
    if (await revealConfirm.isVisible().catch(() => false)) {
      await revealConfirm.click();
    }

    // ── 7. Results appear for host ────────────────────────────────────
    const hostResultsPanel = hostPage.locator('[data-testid="results-panel"]');
    await expect(hostResultsPanel).not.toContainText(/hidden until/i);
    // At least one estimate value should be visible
    await expect(hostResultsPanel.locator('div').first()).toBeVisible();

    // ── 8. Host resets ────────────────────────────────────────────────
    await hostPage.getByRole('button', { name: /reset round/i }).click();

    await hostPage.reload();
    await hostPage.waitForTimeout(500);

    // After reset, results panel should be back to pre-reveal state (no votes yet)
    await expect(
      hostPage.locator('[data-testid="results-panel"]')
    ).toContainText(/Waiting for estimates|hidden until/i);
  });

  test('3 users — all vote, host manually reveals', async ({ browser }) => {
    const { page: hostPage, code } = await createSession(browser, 'Alice');
    const bobPage = await joinSession(browser, code, 'Bob');
    const carolPage = await joinSession(browser, code, 'Carol');

    // All three vote
    await hostPage.getByRole('button', { name: 'Estimate 5' }).click();
    await bobPage.getByRole('button', { name: 'Estimate 8' }).click();
    await carolPage.getByRole('button', { name: 'Estimate 3' }).click();

    // Host reloads so all votes are visible, then reveals
    await hostPage.reload();
    await hostPage.waitForTimeout(500);
    await hostPage.getByRole('button', { name: /reveal estimates/i }).click();

    // Confirm dialog shouldn't appear (everyone voted), but handle defensively
    const revealConfirm = hostPage.getByRole('button', { name: /^reveal$/i });
    if (await revealConfirm.isVisible().catch(() => false)) {
      await revealConfirm.click();
    }

    // Results should be visible on host's page
    const hostResultsPanel = hostPage.locator('[data-testid="results-panel"]');
    await expect(hostResultsPanel).not.toContainText(/hidden until/i);

    // Reveal button should now be disabled
    await expect(hostPage.getByRole('button', { name: /reveal estimates/i })).toBeDisabled();

    // Guest sees results too (after reload)
    await bobPage.reload();
    await bobPage.waitForTimeout(500);
    const bobResultsPanel = bobPage.locator('[data-testid="results-panel"]');
    await expect(bobResultsPanel).not.toContainText(/hidden until/i);
  });

  test('3 users — one goes inactive, auto-reveal fires without host action', async ({ browser }) => {
    const { page: hostPage, code } = await createSession(browser, 'Alice');
    const bobPage = await joinSession(browser, code, 'Bob');
    const carolPage = await joinSession(browser, code, 'Carol');

    // Carol explicitly leaves before closing — Playwright's page.close() does not
    // fire beforeunload, so we call leaveSession directly to mark her as inactive.
    const carolIdentityKey = await carolPage.evaluate(() => {
      return Object.keys(sessionStorage).find((k) => k.startsWith('identity:')) ?? null;
    });
    if (carolIdentityKey) {
      const { participantId: carolParticipantId } = await carolPage.evaluate(
        (key) => JSON.parse(sessionStorage.getItem(key)!) as { participantId: string; isHost: boolean },
        carolIdentityKey,
      );
      const carolSessionId = carolIdentityKey.replace('identity:', '');
      await carolPage.request.post('http://localhost:4000/graphql', {
        data: {
          query: `mutation { leaveSession(sessionId: "${carolSessionId}", participantId: "${carolParticipantId}") }`,
        },
      });
    }
    await carolPage.close();

    // Host and Bob vote — the backend should auto-reveal once all active
    // participants have voted (Carol is disconnected so she's excluded)
    await hostPage.getByRole('button', { name: 'Estimate 5' }).click();
    await bobPage.getByRole('button', { name: 'Estimate 8' }).click();

    // Wait for auto-reveal triggered by the backend
    await hostPage.reload();
    await hostPage.waitForTimeout(1000);

    const hostResultsPanel = hostPage.locator('[data-testid="results-panel"]');
    await expect(hostResultsPanel).not.toContainText(/hidden until/i);

    // Reveal button should be disabled since votes are already revealed
    await expect(hostPage.getByRole('button', { name: /reveal estimates/i })).toBeDisabled();
  });
});
