import { test, expect, Page, Locator, BrowserContext } from '@playwright/test';

/**
 * Exercises the Songs page end to end through the Angular frontend: adding a
 * song directly, syncing songs from local files ("DJ Notebook" upload),
 * finding/merging duplicate songs, syncing songs from the real cloud
 * songlist (https://songlist.ponytyler.de, the same site the app itself
 * integrates with - see be/src/cron/song-sync/song-sync.service.ts), and
 * syncing songs' selectability against that same cloud songlist.
 *
 * Ordering matters here: "syncs songs selectability" flips the selectable
 * flag on every local song that isn't found on the real cloud list (which
 * includes every fabricated song this file creates), so it runs last to
 * avoid invalidating assumptions made by the tests before it. "finds and
 * merges duplicate songs" runs before the cloud sync so the duplicate
 * detection (an O(n^2) scan over all selectable songs) isn't slowed down by
 * however many songs the real cloud list happens to contain.
 */

const BACKEND_URL = 'http://localhost:3010';

function rowByText(page: Page, text: string): Locator {
  return page.locator('table tr', { hasText: text });
}

async function dismissSuccessSnackBar(page: Page): Promise<void> {
  // .last(): a still-closing snackbar from a preceding action can briefly
  // overlap with a freshly opened one, so anchor on the most recent.
  const snackBarAction = page.locator('.mat-mdc-snack-bar-action button, button:has-text("OK")').last();
  await snackBarAction.waitFor({ state: 'visible', timeout: 10000 });
  await snackBarAction.click();
}

test.describe.serial('Songs', () => {
  test.setTimeout(120000);

  const uniqueSuffix = Date.now();

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('adds a song', async () => {
    const name = `E2E Song ${uniqueSuffix}`;
    const artist = `E2E Artist ${uniqueSuffix}`;

    await page.goto('/song', { waitUntil: 'networkidle' });

    await page.locator('button:has-text("Add Song")').first().click();
    await page.waitForURL(/\/song\/create$/, { timeout: 10000 });

    await page.locator('input[formControlName="name"]').fill(name);
    await page.locator('input[formControlName="artist"]').fill(artist);
    await page.locator('button:has-text("Speichern")').click();

    await page.waitForURL(/\/song$/, { timeout: 15000 });

    const row = rowByText(page, name);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(artist);
    // FROM_DIRECT_INPUT origin icon (lib-song-sync-origin).
    await expect(row).toContainText('keyboard');
  });

  test('syncs songs via file upload', async () => {
    const artist = `E2E Upload Artist ${uniqueSuffix}`;
    const name = `E2E Upload Song ${uniqueSuffix}`;
    const fileName = `${artist} - ${name}.mp3`;

    await page.goto('/song/sync', { waitUntil: 'networkidle' });

    await page.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('fake-audio-data'),
    });

    const fileListItem = page.locator('mat-list-item', { hasText: fileName });
    await expect(fileListItem).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("Sync all new Files")').click();
    await expect(fileListItem).toHaveCount(0, { timeout: 10000 });

    await page.goto('/song', { waitUntil: 'networkidle' });
    const row = rowByText(page, name);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(artist);
    // FROM_FILE_SYNC origin icon.
    await expect(row).toContainText('file_upload');
  });

  test('finds and merges duplicate songs', async ({ request }) => {
    const artist = `E2E Duplicate Artist ${uniqueSuffix}`;
    // A single middle-character edit (e -> o) gives a Levenshtein distance
    // of 1, well under the page's default threshold of 6, while keeping
    // neither name a substring of the other.
    const nameA = `Thunder Strike ${uniqueSuffix}`;
    const nameB = `Thundor Strike ${uniqueSuffix}`;

    for (const name of [nameA, nameB]) {
      const response = await request.post(`${BACKEND_URL}/api/song`, {
        data: { name, artist, selectable: true },
      });
      expect(response.status()).toBe(201);
    }

    await page.goto('/song/duplicates', { waitUntil: 'networkidle' });

    const pairRow = page.locator('table tr').filter({ hasText: artist });
    await expect(pairRow).toBeVisible({ timeout: 15000 });
    await expect(pairRow).toContainText('1'); // distance column

    const duplicateCellText = await pairRow.locator('td').nth(2).innerText();
    const duplicateName = [nameA, nameB].find((name) => duplicateCellText.includes(name));
    expect(duplicateName).toBeDefined();
    const originalName = duplicateName === nameA ? nameB : nameA;

    await pairRow.getByRole('button', { name: 'Deactivate Duplicate' }).click();
    await expect(page.getByText('Successfully deactivated Duplicate')).toBeVisible({ timeout: 10000 });
    await dismissSuccessSnackBar(page);

    await page.goto('/song', { waitUntil: 'networkidle' });
    await expect(rowByText(page, duplicateName as string)).toContainText('block');
    await expect(rowByText(page, originalName)).toContainText('check-box');
  });

  test('syncs songs via the cloud songlist', async () => {
    await page.goto('/song', { waitUntil: 'networkidle' });

    await page.locator('button:has-text("Sync Songs")').click();
    await page.waitForURL(/\/song\/sync$/, { timeout: 10000 });

    await page.locator('button:has-text("Sync with Cloud Songlist")').click();
    await expect(page.getByText('Cloud Song Sync finished.')).toBeVisible({ timeout: 30000 });
    await dismissSuccessSnackBar(page);

    // Not asserting "a new song appeared": the backend also runs this same
    // sync on its own 30-minute cron (see SongSyncService.handleCron), so by
    // the time this test runs, everything from the cloud list may already
    // be present locally and this trigger is a no-op. Also, the sync
    // creates missing songs in the background without awaiting each write
    // before responding, so the list only catches up eventually. Instead,
    // just confirm cloud-origin songs exist at all - proof the sync (this
    // run's or the cron's) actually populated something.
    await page.goto('/song', { waitUntil: 'networkidle' });
    const cloudOriginIcons = page.locator('tr[mat-row] mat-icon', { hasText: 'cloud' });
    await expect(cloudOriginIcons.first()).toBeVisible({ timeout: 30000 });
  });

  test('syncs songs selectability against the cloud songlist', async ({ request }) => {
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
});
