import { test, expect, rowByText, dismissSuccessSnackBar, uniqueName, Page } from '../fixtures';

/**
 * Syncs songs' selectability against the cloud songlist (the songlist stub
 * in the e2e stack, see e2e/songlist-stub).
 *
 * This flips the selectable flag on EVERY local song that isn't on the cloud
 * list - including songs seeded by other spec files (e.g. the show dashboard's),
 * which would then vanish from the song autocomplete mid-test. It therefore
 * runs in its own Playwright project ("global-mutations", see
 * playwright.config.ts) that only starts after all other specs have finished.
 */

const BACKEND_URL = 'http://localhost:3010';

test.setTimeout(120000);

// Fixture songs served by the songlist stub (e2e/songlist-stub/songs.json).
const STUB_ARTIST = 'Stub Artist';
const STUB_LISTED_SONG = 'Stub Listed Song';

/** The selectable column of a song's row: a ticked box or a block icon. */
const selectableCell = (page: Page, text: string) => rowByText(page, text).locator('td.mat-column-selectable');

test('syncs songs selectability against the cloud songlist', async ({ page, api, exclusiveSongs }) => {
  // Guaranteed absent from the cloud list by its unique artist.
  const artist = uniqueName('E2E Selectability Artist');
  await api.createSong({ artist, name: 'Not On The List', selectable: true });

  await page.goto('/song', { waitUntil: 'networkidle' });
  await expect(selectableCell(page, artist)).toContainText('check_box', { timeout: 10000 });

  await page.locator('button:has-text("Update Selecability")').click();
  await expect(page.getByText('Selectability updated.')).toBeVisible({ timeout: 30000 });
  await dismissSuccessSnackBar(page);

  // Not present on the cloud list, so the sync should have blocked it.
  await expect(selectableCell(page, artist)).toContainText('block', { timeout: 10000 });
});

test('re-enables a blocked song that is on the cloud songlist', async ({ page, api, exclusiveSongs }) => {
  // The "[PT]" tag is ignored when matching against the cloud list, and
  // keeps this row distinguishable from the one the cloud sync created.
  const name = `${STUB_LISTED_SONG} [PT]`;
  await api.createSong({ name, artist: STUB_ARTIST, selectable: false });

  await page.goto('/song', { waitUntil: 'networkidle' });
  await expect(selectableCell(page, name)).toContainText('block', { timeout: 10000 });

  await page.locator('button:has-text("Update Selecability")').click();
  await expect(page.getByText('Selectability updated.')).toBeVisible({ timeout: 30000 });
  await dismissSuccessSnackBar(page);

  await expect(selectableCell(page, name)).toContainText('check_box', { timeout: 10000 });
});

async function updateSelectability(page: Page): Promise<void> {
  await page.goto('/song', { waitUntil: 'networkidle' });
  await page.locator('button:has-text("Update Selecability")').click();
  await expect(page.getByText('Selectability updated.')).toBeVisible({ timeout: 30000 });
  await dismissSuccessSnackBar(page);
}

test('flips a song back and forth as it enters and leaves the cloud list, and the autocomplete follows', async ({
  page,
  request,
  api,
  songlist,
}) => {
  const artist = uniqueName('E2E Flip Flop Artist');
  const song = await api.createSong({ artist, name: 'Flip Flop', selectable: true });
  const listed = [{ artist, title: 'Flip Flop', status: 'listed' as const }];

  // What the song autocomplete offers: the selectable songs.
  const offered = async (): Promise<boolean> => {
    const selectable: Array<{ id: number }> = await (await request.get(`${BACKEND_URL}/api/song/selectable`)).json();
    return selectable.some((candidate) => candidate.id === song.id);
  };

  await songlist.set(listed);
  await updateSelectability(page);
  expect(await offered(), 'listed: stays offered').toBe(true);

  await songlist.set([]);
  await updateSelectability(page);
  expect(await offered(), 'gone from the list: blocked').toBe(false);

  await songlist.set(listed);
  await updateSelectability(page);
  expect(await offered(), 'listed again: offered again').toBe(true);
});

test('blocks a song the cloud marks as unlisted, because only listed songs count', async ({ page, api, songlist }) => {
  const artist = uniqueName('E2E Unlisted Artist');
  await api.createSong({ artist, name: 'Not On The Page', selectable: true });
  await songlist.set([{ artist, title: 'Not On The Page', status: 'unlisted' }]);

  await updateSelectability(page);

  await expect(selectableCell(page, artist)).toContainText('block', { timeout: 10000 });
});
