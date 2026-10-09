import { test, expect, uniqueName, dismissSuccessSnackBar, BACKEND_URL, Page, SeedingApi } from '../fixtures';

/**
 * "Sync with Cloud Songlist" on the song sync page: the backend reads the
 * cloud songlist (the stub in the e2e stack, whose content a test sets through
 * the `songlist` fixture) and creates the songs it does not know, or flips the
 * selectable flag of a known song to the cloud status. It never removes or
 * blocks a song that is missing from the list; "Update Selecability" does that
 * (see song-selectability.global.spec.ts).
 *
 * Replacing the cloud list is global, so this runs in the `global-mutations`
 * project, and the `songlist` fixture serializes the tests in it.
 */

async function cloudSync(page: Page): Promise<void> {
  await page.goto('/song/sync', { waitUntil: 'networkidle' });
  await page.locator('button:has-text("Sync with Cloud Songlist")').click();
  await expect(page.getByText('Cloud Song Sync finished.')).toBeVisible({ timeout: 30000 });
  await dismissSuccessSnackBar(page);
}

async function updateSelectability(page: Page): Promise<void> {
  await page.goto('/song', { waitUntil: 'networkidle' });
  await page.locator('button:has-text("Update Selecability")').click();
  await expect(page.getByText('Selectability updated.')).toBeVisible({ timeout: 30000 });
  await dismissSuccessSnackBar(page);
}

/**
 * The artist's songs as `name -> selectable`, read from the backend (and
 * registered for cleanup). Fails if a title exists twice, so every test also
 * guards against a sync creating duplicates.
 */
async function songsOf(api: SeedingApi, artist: string): Promise<Record<string, boolean>> {
  const songs = await api.adoptSongsByArtist(artist);
  const names = songs.map((song) => song.name);
  expect(names, `songs of "${artist}" must be unique`).toEqual([...new Set(names)]);
  return Object.fromEntries(songs.map((song) => [song.name, song.selectable]));
}

test.describe('cloud sync', () => {
  test.setTimeout(120000);

  test('creates the songs it does not know, selectable only when listed', async ({ page, api, songlist }) => {
    const artist = uniqueName('E2E Cloud Artist');
    await songlist.set([
      { artist, title: 'Listed', status: 'listed' },
      { artist, title: 'Unlisted', status: 'unlisted' },
    ]);

    await cloudSync(page);

    expect(await songsOf(api, artist)).toEqual({ Listed: true, Unlisted: false });
    for (const song of await api.adoptSongsByArtist(artist)) {
      expect(song).toMatchObject({ origin: 'FROM_CLOUD_SYNC', deleted: false });
    }
  });

  test('creates nothing new when it runs a second time', async ({ page, api, songlist }) => {
    const artist = uniqueName('E2E Twice Cloud Artist');
    await songlist.set([{ artist, title: 'Only Once', status: 'listed' }]);

    await cloudSync(page);
    await cloudSync(page);

    expect(await songsOf(api, artist)).toEqual({ 'Only Once': true });
  });

  test('creates a song that appears twice on the cloud list only once', async ({ page, api, songlist }) => {
    const artist = uniqueName('E2E Listed Twice Artist');
    await songlist.set([
      { artist, title: 'Doubled', status: 'listed' },
      { artist, title: 'Doubled', status: 'listed' },
    ]);

    await cloudSync(page);

    expect(await songsOf(api, artist)).toEqual({ Doubled: true });
  });

  test('matches a known song ignoring case, spacing and the [PT] / [PTHQ] tags', async ({ page, api, songlist }) => {
    const artist = uniqueName('E2E Match Artist');
    await api.createSong({ artist, name: 'Mixed Case [PT]' });
    await api.createSong({ artist, name: 'High Quality [PTHQ]' });
    await songlist.set([
      { artist: artist.toUpperCase(), title: 'MIXED   CASE', status: 'listed' },
      { artist, title: 'High Quality', status: 'listed' },
    ]);

    await cloudSync(page);

    expect(Object.keys(await songsOf(api, artist)).sort()).toEqual(['High Quality [PTHQ]', 'Mixed Case [PT]']);
    // A missed match would have created the song again under the upper-cased artist.
    expect(await songsOf(api, artist.toUpperCase())).toEqual({});
  });

  test("follows a known song's cloud status: blocks it when unlisted, enables it when listed", async ({ page, api, songlist }) => {
    const artist = uniqueName('E2E Flip Artist');
    const wasSelectable = await api.createSong({ artist, name: 'Was Selectable', selectable: true });
    const wasBlocked = await api.createSong({ artist, name: 'Was Blocked', selectable: false });
    await songlist.set([
      { artist, title: 'Was Selectable', status: 'unlisted' },
      { artist, title: 'Was Blocked', status: 'listed' },
    ]);

    await cloudSync(page);

    expect(await songsOf(api, artist)).toEqual({ 'Was Selectable': false, 'Was Blocked': true });
    // The songs were updated, not recreated, so their origin stays what it was.
    const after = await (await page.request.get(`${BACKEND_URL}/api/song/${wasSelectable.id}`)).json();
    expect(after).toMatchObject({ id: wasSelectable.id, origin: 'FROM_FILE_SYNC' });
    expect(wasBlocked.id).not.toBe(wasSelectable.id);
  });

  test('keeps a song that was removed from the cloud list until the selectability is updated', async ({ page, api, songlist }) => {
    const artist = uniqueName('E2E Removed Artist');
    await songlist.set([
      { artist, title: 'Stays', status: 'listed' },
      { artist, title: 'Goes Away', status: 'listed' },
    ]);
    await cloudSync(page);
    expect(await songsOf(api, artist)).toEqual({ Stays: true, 'Goes Away': true });

    await songlist.set([{ artist, title: 'Stays', status: 'listed' }]);
    await cloudSync(page);
    expect(await songsOf(api, artist)).toEqual({ Stays: true, 'Goes Away': true });

    await updateSelectability(page);
    expect(await songsOf(api, artist)).toEqual({ Stays: true, 'Goes Away': false });
  });

  test('treats a renamed song as a new one: the old title stays until the selectability is updated', async ({ page, api, songlist }) => {
    const artist = uniqueName('E2E Renamed Artist');
    await songlist.set([{ artist, title: 'Old Title', status: 'listed' }]);
    await cloudSync(page);

    await songlist.set([{ artist, title: 'New Title', status: 'listed' }]);
    await cloudSync(page);
    expect(await songsOf(api, artist)).toEqual({ 'Old Title': true, 'New Title': true });

    await updateSelectability(page);
    expect(await songsOf(api, artist)).toEqual({ 'Old Title': false, 'New Title': true });
  });

  test('changes nothing for an empty cloud list', async ({ page, api, songlist }) => {
    const artist = uniqueName('E2E Empty List Artist');
    await api.createSong({ artist, name: 'Untouched', selectable: true });
    await songlist.set([]);

    await cloudSync(page);

    expect(await songsOf(api, artist)).toEqual({ Untouched: true });
  });
});
