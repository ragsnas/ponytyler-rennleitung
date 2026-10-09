import { test, expect, uniqueName, chooseSyncFiles, syncListItem } from '../fixtures';

/**
 * "Block all Songs, missing from File List" on the song sync page blocks EVERY
 * selectable song without a chosen file, including songs seeded by other
 * specs. It therefore runs in the `global-mutations` project, serialized by
 * the `exclusiveSongs` fixture. The rest of the local file sync is in
 * song-file-sync.spec.ts.
 */

test.setTimeout(120000);

test('blocks the selectable songs that have no file and keeps those that do', async ({ page, api, exclusiveSongs }) => {
  const artist = uniqueName('E2E Block Artist');
  const withFile = await api.createSong({ artist, name: 'Has File', selectable: true });
  const withoutFile = await api.createSong({ artist, name: 'Has No File', selectable: true });
  const alreadyBlocked = await api.createSong({ artist, name: 'Already Blocked', selectable: false });

  await chooseSyncFiles(page, [`${artist} - Has File.mp3`]);
  await expect(syncListItem(page, `${artist} - Has No File`)).toBeVisible();
  await page.locator('button:has-text("Block all Songs, missing from File List")').click();
  await expect(page.getByText(/Processing \d+ Files\/Songs/)).toHaveCount(0, { timeout: 30000 });

  const songs = Object.fromEntries((await api.adoptSongsByArtist(artist)).map((song) => [song.id, song.selectable]));
  expect(songs).toEqual({ [withFile.id]: true, [withoutFile.id]: false, [alreadyBlocked.id]: false });
});
