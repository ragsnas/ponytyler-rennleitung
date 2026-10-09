import { test, expect, uniqueName, SONGLIST_URL, BACKEND_URL } from '../fixtures';

/**
 * Self-test for the `songlist` and `exclusiveSongs` fixtures. It replaces the
 * stub's cloud songlist, which the regression specs read, so like every spec
 * that does that it runs in the `global-mutations` project (see
 * playwright.config.ts).
 */

const DEFAULT_LIST = [
  { artist: 'Stub Artist', title: 'Stub Listed Song', status: 'listed' },
  { artist: 'Stub Artist', title: 'Stub Unlisted Song', status: 'unlisted' },
];

test('songlist.set replaces what the stub serves, as JSON and as the HTML page', async ({ songlist, request }) => {
  const artist = uniqueName('Fixture Artist');
  await songlist.set([
    { artist, title: 'Shown', status: 'listed' },
    { artist, title: 'Hidden', status: 'unlisted' },
  ]);

  const json = await (await request.get(`${SONGLIST_URL}/api/index.php`)).json();
  expect(json).toEqual([
    { artist, title: 'Shown', status: 'listed' },
    { artist, title: 'Hidden', status: 'unlisted' },
  ]);

  // The page only carries listed songs, like the real site.
  const html = await (await request.get(`${SONGLIST_URL}/`)).text();
  expect(html).toContain('Shown');
  expect(html).not.toContain('Hidden');
});

test('the stub is back to its default list at the start of the next test', async ({ songlist, request }) => {
  const json = await (await request.get(`${SONGLIST_URL}/api/index.php`)).json();

  expect(json).toEqual(DEFAULT_LIST);
  await songlist.set([]); // leave something behind for the fixture's teardown to undo
});

test('the backend reads the stub it was pointed at', async ({ songlist, request }) => {
  const artist = uniqueName('Fixture Sync Artist');
  await songlist.set([{ artist, title: 'Only Here', status: 'listed' }]);

  const response = await request.post(`${BACKEND_URL}/api/song/cloud-sync`);
  expect(response.ok()).toBe(true);

  const songs: Array<{ id: number; artist: string; name: string }> = await (await request.get(`${BACKEND_URL}/api/song`)).json();
  const created = songs.filter((song) => song.artist === artist);
  expect(created.map((song) => song.name)).toEqual(['Only Here']);

  for (const song of created) {
    await request.delete(`${BACKEND_URL}/api/song/${song.id}`);
  }
});
