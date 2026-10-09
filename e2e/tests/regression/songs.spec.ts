import { test, expect, rowByText, dismissSuccessSnackBar, uniqueName } from '../fixtures';

/**
 * Exercises the Songs page end to end through the Angular frontend: adding a
 * song directly, syncing songs from local files ("DJ Notebook" upload),
 * finding/merging duplicate songs, syncing songs from the cloud
 * songlist (https://songlist.ponytyler.de in production, the same site the app itself
 * integrates with - see be/src/cron/song-sync/song-sync.service.ts). In the
 * e2e stack the backend's SONGLIST_URL points at the songlist stub
 * (e2e/songlist-stub), so the cloud list is a fixed, known set of songs.
 * Syncing songs' selectability lives in song-selectability.spec.ts, since it
 * mutates every song globally.
 *
 * Each test is independent (own page, unique names, seeding through the
 * fixtures' API helper), so they can run in parallel.
 */

// Fixture songs served by the songlist stub (e2e/songlist-stub/songs.json).
const STUB_ARTIST = 'Stub Artist';
const STUB_LISTED_SONG = 'Stub Listed Song';
const STUB_UNLISTED_SONG = 'Stub Unlisted Song';

test.describe('Songs', () => {
  test.setTimeout(120000);

  test('adds a song', async ({ page }) => {
    const name = uniqueName('E2E Song');
    const artist = uniqueName('E2E Artist');

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

  test('syncs songs via file upload', async ({ page }) => {
    const artist = uniqueName('E2E Upload Artist');
    const name = uniqueName('E2E Upload Song');
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

  test('finds and merges duplicate songs', async ({ page, api }) => {
    const artist = uniqueName('E2E Duplicate Artist');
    const suffix = uniqueName('');
    // A single middle-character edit (e -> o) gives a Levenshtein distance
    // of 1, well under the page's default threshold of 6, while keeping
    // neither name a substring of the other.
    const nameA = `Thunder Strike${suffix}`;
    const nameB = `Thundor Strike${suffix}`;

    for (const name of [nameA, nameB]) {
      await api.createSong({ name, artist, selectable: true });
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
    await expect(rowByText(page, originalName)).toContainText('check_box');
  });

  test('syncs songs via the cloud songlist', async ({ page }) => {
    await page.goto('/song', { waitUntil: 'networkidle' });

    await page.locator('button:has-text("Sync Songs")').click();
    await page.waitForURL(/\/song\/sync$/, { timeout: 10000 });

    await page.locator('button:has-text("Sync with Cloud Songlist")').click();
    await expect(page.getByText('Cloud Song Sync finished.')).toBeVisible({ timeout: 30000 });
    await dismissSuccessSnackBar(page);

    // The sync creates missing songs in the background without awaiting each
    // write before responding, so the list only catches up eventually.
    for (const { name, icon } of [
      { name: STUB_LISTED_SONG, icon: 'check_box' },
      { name: STUB_UNLISTED_SONG, icon: 'block' },
    ]) {
      await expect(async () => {
        await page.goto('/song', { waitUntil: 'networkidle' });
        // Exact match: a leftover "<name> [PT]" row from another spec must not count.
        const row = page.locator('table tr').filter({ has: page.getByText(name, { exact: true }) });
        await expect(row).toBeVisible({ timeout: 2000 });
        await expect(row).toContainText(STUB_ARTIST);
        // FROM_CLOUD_SYNC origin icon, plus selectable (listed) or blocked (unlisted).
        await expect(row).toContainText('cloud');
        await expect(row).toContainText(icon);
      }).toPass({ timeout: 30000 });
    }
  });
});
