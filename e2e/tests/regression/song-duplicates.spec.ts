import { test, expect, distinctName, rowByText, dismissSuccessSnackBar, Page } from '../fixtures';

/**
 * "Find/Merge Duplicate Songs" (/song/duplicates). The page pairs every
 * selectable song with its closest other song by the Levenshtein distance of
 * "<artist> - <title>", lists the pairs within the accuracy threshold
 * (default 6, remembered in localStorage), and "merge" blocks the listed
 * duplicate. Nothing is deleted or rewired, so races that use a blocked song
 * keep it.
 */

/** The selectable column of a song's row on the songs page: a ticked box or a block icon. */
const selectableCell = (page: Page, text: string) => rowByText(page, text).locator('td.mat-column-selectable');

const THRESHOLD_KEY = 'pontyTyperLevenshteinDistanceMinimum';

/** `name` with its first `distance` characters replaced, so the two are exactly `distance` edits apart. */
const variantAt = (name: string, distance: number): string => 'Z'.repeat(distance) + name.slice(distance);

async function openDuplicates(page: Page, threshold?: number): Promise<void> {
  if (threshold !== undefined) {
    await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [THRESHOLD_KEY, String(threshold)]);
  }
  await page.goto('/song/duplicates', { waitUntil: 'networkidle' });
}

test.describe('duplicate songs', () => {
  test.setTimeout(120000);

  test('finds and merges duplicate songs', async ({ page, api }) => {
    const artist = distinctName('E2E Duplicate Artist');
    const suffix = distinctName('');
    // A single middle-character edit (e -> o) gives a Levenshtein distance
    // of 1, well under the page's default threshold of 6, while keeping
    // neither name a substring of the other.
    const nameA = `Thunder Strike${suffix}`;
    const nameB = `Thundor Strike${suffix}`;
    for (const name of [nameA, nameB]) {
      await api.createSong({ name, artist, selectable: true });
    }

    await openDuplicates(page);

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
    await expect(selectableCell(page, duplicateName as string)).toContainText('block');
    await expect(selectableCell(page, originalName)).toContainText('check_box');
  });

  test('drops the pair from the list once its duplicate is merged away', async ({ page, api }) => {
    const artist = distinctName('E2E Merge Gone Artist');
    await api.createSong({ artist, name: 'Echo Chamber', selectable: true });
    await api.createSong({ artist, name: 'Echo Chambre', selectable: true });
    await openDuplicates(page);
    const pairRow = page.locator('table tr').filter({ hasText: artist });
    await expect(pairRow).toBeVisible({ timeout: 15000 });

    await pairRow.getByRole('button', { name: 'Deactivate Duplicate' }).click();
    await dismissSuccessSnackBar(page);

    // The list reloads after the snackbar closes: only one selectable song is left, so there is no pair.
    await expect(pairRow).toHaveCount(0, { timeout: 10000 });
  });

  test('lists a pair only while its distance is within the accuracy threshold', async ({ page, api }) => {
    const suffix = distinctName('');
    // Wholly different texts, so every song's nearest neighbour is its own partner.
    const pairs = {
      close: { artist: distinctName('Alpha Quartet'), title: 'Thunderstorm Rider', distance: 1 },
      middle: { artist: distinctName('Zeta Orchestra'), title: 'Quietly Wandering Home', distance: 4 },
      far: { artist: distinctName('Kilo Brass Collective'), title: 'Marmalade Skies Forever', distance: 8 },
    };
    for (const { artist, title, distance } of Object.values(pairs)) {
      const name = `${title}${suffix}`;
      await api.createSong({ artist, name, selectable: true });
      await api.createSong({ artist, name: variantAt(name, distance), selectable: true });
    }
    const pairRow = (artist: string) => page.locator('table tr').filter({ hasText: artist });

    await openDuplicates(page); // default threshold: 6
    await expect(pairRow(pairs.close.artist)).toBeVisible({ timeout: 15000 });
    await expect(pairRow(pairs.middle.artist)).toBeVisible();
    await expect(pairRow(pairs.middle.artist)).toContainText('4');
    await expect(pairRow(pairs.far.artist)).toHaveCount(0);

    await page.evaluate((key) => window.localStorage.setItem(key, '3'), THRESHOLD_KEY);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(pairRow(pairs.close.artist)).toBeVisible({ timeout: 15000 });
    await expect(pairRow(pairs.middle.artist)).toHaveCount(0);
  });

  test('does not offer a song that is already blocked', async ({ page, api }) => {
    const artist = distinctName('E2E Blocked Pair Artist');
    await api.createSong({ artist, name: 'Mirror Image', selectable: true });
    await api.createSong({ artist, name: 'Mirror Imagf', selectable: false });
    // A sentinel pair proves the table has loaded before checking for absence.
    const sentinelArtist = distinctName('E2E Sentinel Artist');
    await api.createSong({ artist: sentinelArtist, name: 'Sentinel Song', selectable: true });
    await api.createSong({ artist: sentinelArtist, name: 'Sentinel Sonh', selectable: true });

    await openDuplicates(page);

    await expect(page.locator('table tr').filter({ hasText: sentinelArtist })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table tr').filter({ hasText: artist })).toHaveCount(0);
  });

  test('keeps the races that use a merged song: nothing is deleted or rewired', async ({ page, api }) => {
    const artist = distinctName('E2E Raced Artist');
    const songA = await api.createSong({ artist, name: 'Midnight Rider', selectable: true });
    const songB = await api.createSong({ artist, name: 'Midnight Ridex', selectable: true });
    const show = await api.createShow();
    const rider = distinctName('Rider');
    const raceA = await api.createRace(show, { person1: `${rider} A`, song1: songA });
    const raceB = await api.createRace(show, { person1: `${rider} B`, song1: songB });

    await openDuplicates(page);
    const pairRow = page.locator('table tr').filter({ hasText: artist });
    await expect(pairRow).toBeVisible({ timeout: 15000 });
    await pairRow.getByRole('button', { name: 'Deactivate Duplicate' }).click();
    await dismissSuccessSnackBar(page);

    const [stateA, stateB] = await Promise.all([songA, songB].map(async (song) => (await page.request.get(`http://localhost:3010/api/song/${song.id}`)).json()));
    expect([stateA.selectable, stateB.selectable].sort()).toEqual([false, true]);
    expect(stateA).toMatchObject({ deleted: false });
    expect(stateB).toMatchObject({ deleted: false });

    for (const [race, song] of [[raceA, songA], [raceB, songB]] as const) {
      const current = await (await page.request.get(`http://localhost:3010/api/race/${race.id}`)).json();
      expect(current, `race ${race.id} keeps its song`).toMatchObject({ song1Id: song.id, raceState: 'WAITING_FOR_OPPONENT' });
    }

    // The dashboard still shows both songs, the blocked one included.
    await page.goto(`/show/${show.id}`, { waitUntil: 'networkidle' });
    await expect(rowByText(page, `${rider} A`)).toContainText(songA.name);
    await expect(rowByText(page, `${rider} B`)).toContainText(songB.name);
  });
});
