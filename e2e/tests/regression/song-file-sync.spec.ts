import { test, expect, uniqueName, chooseSyncFiles, syncListItem, Page } from '../fixtures';

/**
 * Local file sync ("Choose Files from DJ Notebook" on the song sync page).
 * The page compares the chosen file names ("<artist> - <title>.<ext>") with
 * the songs it knows, offers the files without a song, and creates songs from
 * them. Only names matter, never file content. Blocking the songs that are
 * missing from the files affects every song, so that lives in
 * song-file-sync.global.spec.ts.
 *
 * Tests marked `test.fail` document a known defect: they assert the sensible
 * behaviour and are expected to fail until the app is fixed, at which point
 * Playwright reports them as unexpectedly passing and the marker should go.
 */

async function syncAll(page: Page): Promise<void> {
  await page.locator('button:has-text("Sync all new Files")').click();
  // The list empties at once; the page shows "Processing n Files/Songs" until every song is created.
  await expect(page.getByText(/Processing \d+ Files\/Songs/)).toHaveCount(0, { timeout: 15000 });
}

test.describe('local file sync', () => {
  test.setTimeout(120000);

  test('creates a song for every new file in one go', async ({ page, api }) => {
    const artist = uniqueName('E2E File Artist');
    const titles = ['First', 'Second', 'Third'];

    await chooseSyncFiles(page, titles.map((title) => `${artist} - ${title}.mp3`));
    for (const title of titles) {
      await expect(syncListItem(page, `${artist} - ${title}.mp3`)).toBeVisible();
    }
    await syncAll(page);
    await expect(syncListItem(page, artist)).toHaveCount(0, { timeout: 10000 });

    await expect
      .poll(async () => (await api.adoptSongsByArtist(artist)).map((song) => song.name).sort())
      .toEqual(titles.slice().sort());
    const songs = await api.adoptSongsByArtist(artist);
    for (const song of songs) {
      expect(song).toMatchObject({ origin: 'FROM_FILE_SYNC', selectable: true, deleted: false });
    }
  });

  test('creates only the clicked file when syncing a single one', async ({ page, api }) => {
    const artist = uniqueName('E2E Single Artist');

    await chooseSyncFiles(page, [`${artist} - Chosen.mp3`, `${artist} - Left Alone.mp3`]);
    await syncListItem(page, 'Chosen').click();
    await expect(syncListItem(page, 'Chosen')).toHaveCount(0, { timeout: 10000 });

    await expect(syncListItem(page, 'Left Alone')).toBeVisible();
    await expect.poll(async () => (await api.adoptSongsByArtist(artist)).map((song) => song.name)).toEqual(['Chosen']);
  });

  test('strips the [PT] and [PTHQ] tags and the extension from the title', async ({ page, api }) => {
    const artist = uniqueName('E2E Tag Artist');

    await chooseSyncFiles(page, [`${artist} - Tagged One [PT].mp3`, `${artist} - Tagged Two [PTHQ].mp3`, `${artist} - Plain.flac`]);
    await syncAll(page);

    await expect
      .poll(async () => (await api.adoptSongsByArtist(artist)).map((song) => song.name).sort())
      .toEqual(['Plain', 'Tagged One', 'Tagged Two']);
  });

  test('keeps further hyphens in the title: the artist ends at the first " - "', async ({ page, api }) => {
    const artist = uniqueName('E2E Hyphen Artist');

    await chooseSyncFiles(page, [`${artist} - Title - Radio Edit.mp3`]);
    await syncAll(page);

    await expect.poll(async () => (await api.adoptSongsByArtist(artist)).map((song) => song.name)).toEqual(['Title - Radio Edit']);
  });

  test('does not offer a file whose song already exists, also when the file carries a [PT] tag', async ({ page, api }) => {
    const artist = uniqueName('E2E Known Artist');
    await api.createSong({ artist, name: 'Known' });
    await api.createSong({ artist, name: 'Tagged Known' });

    await chooseSyncFiles(page, [`${artist} - Known.mp3`, `${artist} - Tagged Known [PT].mp3`, `${artist} - Brand New.mp3`]);

    await expect(syncListItem(page, `${artist} - Brand New.mp3`)).toBeVisible();
    await expect(syncListItem(page, `${artist} - Known.mp3`)).toHaveCount(0);
    await expect(syncListItem(page, `${artist} - Tagged Known [PT].mp3`)).toHaveCount(0);
  });

  test('treats an empty file like any other: only its name counts', async ({ page, api }) => {
    const artist = uniqueName('E2E Empty Artist');

    await chooseSyncFiles(page, [`${artist} - Silence.mp3`], { empty: true });
    await syncAll(page);

    await expect.poll(async () => (await api.adoptSongsByArtist(artist)).map((song) => song.name)).toEqual(['Silence']);
  });

  test('lists selectable songs that have no file, but neither blocked ones nor those with a file', async ({ page, api }) => {
    const artist = uniqueName('E2E Missing Artist');
    await api.createSong({ artist, name: 'Has File' });
    await api.createSong({ artist, name: 'Has No File', selectable: true });
    await api.createSong({ artist, name: 'Blocked No File', selectable: false });

    await chooseSyncFiles(page, [`${artist} - Has File.mp3`]);

    await expect(page.getByText('Songs that are not in the File List but selectable')).toBeVisible();
    await expect(syncListItem(page, `${artist} - Has No File`)).toBeVisible();
    await expect(syncListItem(page, `${artist} - Blocked No File`)).toHaveCount(0);
    await expect(syncListItem(page, `${artist} - Has File`)).toHaveCount(0);
  });

  test.describe('known defects', () => {
    test.fail('creates one song when the same file is chosen twice', async ({ page, api }) => {
      // Defect: both entries are offered and created, leaving two identical songs.
      const artist = uniqueName('E2E Twice Artist');

      await chooseSyncFiles(page, [`${artist} - Twice.mp3`, `${artist} - Twice.mp3`]);
      await syncAll(page);

      await expect.poll(async () => (await api.adoptSongsByArtist(artist)).length).toBeGreaterThan(0);
      expect((await api.adoptSongsByArtist(artist)).map((song) => song.name)).toEqual(['Twice']);
    });

    test.fail('splits a hyphenated artist such as "AC-DC" correctly', async ({ page, api }) => {
      // Defect: the split is at the first "-", so the artist becomes "<artist> AC" and the title "DC - Highway".
      const artist = uniqueName('E2E Band') + ' AC-DC';

      await chooseSyncFiles(page, [`${artist} - Highway.mp3`]);
      await syncAll(page);

      await expect.poll(async () => (await api.adoptSongsByArtist(artist)).length).toBeGreaterThan(0);
    });

    test.fail('does not create a song without an artist from a file name without " - "', async ({ page, api }) => {
      // Defect: "<name>.mp3" becomes a song with an empty artist.
      const title = uniqueName('E2E NoSeparator');

      await chooseSyncFiles(page, [`${title}.mp3`]);
      await syncAll(page);

      // The defect creates the song under an empty artist, which a cleanup by artist can find.
      const created = (await api.adoptSongsByArtist('')).filter((song) => song.name.includes(title));
      expect(created).toEqual([]);
    });

    test.fail('does not create a song without a title from "<artist> - .mp3"', async ({ page, api }) => {
      // Defect: this creates a song with an empty name.
      const artist = uniqueName('E2E NoTitle Artist');

      await chooseSyncFiles(page, [`${artist} - .mp3`]);
      await syncAll(page);

      await expect.poll(async () => (await api.adoptSongsByArtist(artist)).length, { timeout: 5000 }).toBe(0);
    });

    test.fail('does not create a garbled title from a file name without extension', async ({ page, api }) => {
      // Defect: "<artist> - Title" (no dot) yields the title "<artist> -".
      const artist = uniqueName('E2E NoExt Artist');

      await chooseSyncFiles(page, [`${artist} - Title`]);
      await syncAll(page);

      await expect.poll(async () => (await api.adoptSongsByArtist(artist)).length).toBeGreaterThan(0);
      expect((await api.adoptSongsByArtist(artist)).map((song) => song.name)).toEqual(['Title']);
    });
  });
});
