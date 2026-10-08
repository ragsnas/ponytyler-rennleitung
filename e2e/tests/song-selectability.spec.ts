import { test, expect, Page, Locator } from '@playwright/test';

/**
 * Syncs songs' selectability against the real cloud songlist.
 *
 * This flips the selectable flag on EVERY local song that isn't on the cloud
 * list - including songs seeded by other spec files (e.g. the show dashboard's),
 * which would then vanish from the song autocomplete mid-test. It therefore
 * runs in its own Playwright project ("global-mutations", see
 * playwright.config.ts) that only starts after all other specs have finished.
 */

const BACKEND_URL = 'http://localhost:3010';

function rowByText(page: Page, text: string): Locator {
  return page.locator('table tr', { hasText: text });
}

async function dismissSuccessSnackBar(page: Page): Promise<void> {
  const snackBarAction = page.locator('.mat-mdc-snack-bar-action button, button:has-text("OK")').last();
  await snackBarAction.waitFor({ state: 'visible', timeout: 10000 });
  await snackBarAction.click();
}

test.setTimeout(120000);

const uniqueSuffix = Date.now();

test('syncs songs selectability against the cloud songlist', async ({ page, request }) => {
  const name = `E2E Selectability Song ${uniqueSuffix}`;
  // Guaranteed absent from the real cloud list by virtue of the timestamp.
  const artist = `E2E Selectability Artist ${uniqueSuffix}`;

  const response = await request.post(`${BACKEND_URL}/api/song`, {
    data: { name, artist, selectable: true },
  });
  expect(response.status()).toBe(201);

  await page.goto('/song', { waitUntil: 'networkidle' });
  const row = rowByText(page, name);
  await expect(row).toBeVisible({ timeout: 10000 });
  await expect(row).toContainText('check-box');

  await page.locator('button:has-text("Update Selecability")').click();
  await expect(page.getByText('Selectability updated.')).toBeVisible({ timeout: 30000 });
  await dismissSuccessSnackBar(page);

  // Not present on the real cloud list, so the sync should have blocked it.
  await expect(row).toContainText('block', { timeout: 10000 });
});
