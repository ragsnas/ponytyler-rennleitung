import { test, expect, Page, Locator, BrowserContext } from '@playwright/test';

/**
 * Exercises the Show Dashboard page end to end through the Angular frontend:
 * creating a show, adding races, editing a race's songs and rider names,
 * merging two races that are waiting for an opponent, reordering races,
 * marking each bike (and both bikes) as the winner, and deleting (canceling)
 * a race.
 *
 * The suite runs as one serial journey against a single page/show, mirroring
 * ../../be/test/rest-api-lifecycle.e2e-spec.ts on the frontend side. Songs
 * are seeded directly via the backend REST API (see backend-rest-api.spec.ts)
 * since song selection isn't itself under test here - the goal is to drive
 * the dashboard's own actions through the UI.
 */

const BACKEND_URL = 'http://localhost:3010';

interface SeededSong {
  name: string;
  artist: string;
}

function rowByText(page: Page, text: string): Locator {
  return page.locator('table tr', { hasText: text });
}

function waitForSongOptionsLoaded(page: Page) {
  // The song autocomplete only (re-)filters its options when its own input
  // value changes (see InputComponent.ngOnInit); it doesn't react if the
  // underlying selectable-songs list arrives later. Registering this wait
  // before opening a race form and awaiting it before typing avoids a race
  // where the field is typed into before that list has loaded, which would
  // leave it permanently filtered against an empty list.
  return page.waitForResponse((response) => response.url().includes('/api/song/selectable') && response.ok());
}

async function pickSong(page: Page, songFieldLabel: string, song: SeededSong): Promise<void> {
  const input = page.locator('lib-song-auto-complete', { hasText: songFieldLabel }).locator('input');
  await input.click();
  await input.fill(song.name);
  // Match on the (unique) song name rather than the full "artist - name" role
  // name: an option can carry extra icon text (e.g. a "warning" icon for a
  // song already wished for elsewhere), which breaks an exact accessible-name match.
  await page.locator('mat-option').filter({ hasText: song.name }).first().click();
}

async function waitForRaceFormLoaded(page: Page): Promise<void> {
  const person1Input = page.locator('input[formControlName="person1"]');
  await person1Input.waitFor({ state: 'visible', timeout: 10000 });
  // The update-race form fields start empty and are patched asynchronously
  // once the race loads (see UpdateRaceComponent.ngOnInit); waiting for that
  // patch to land before editing avoids it silently overwriting an edit
  // made too early.
  await expect(person1Input).not.toHaveValue('', { timeout: 10000 });
}

async function dismissSuccessSnackBar(page: Page): Promise<void> {
  // .last(): a still-closing snackbar from a preceding action can briefly
  // overlap with a freshly opened one, so anchor on the most recent.
  const snackBarAction = page.locator('.mat-mdc-snack-bar-action button, button:has-text("OK")').last();
  await snackBarAction.waitFor({ state: 'visible', timeout: 10000 });
  await snackBarAction.click();
}

test.describe.serial('Show Dashboard', () => {
  test.setTimeout(120000);

  const uniqueSuffix = Date.now();
  const showName = `E2E Dashboard Show ${uniqueSuffix}`;

  const songs: SeededSong[] = Array.from({ length: 9 }, (_, i) => ({
    name: `E2E Dashboard Song ${uniqueSuffix}-${i}`,
    artist: `E2E Dashboard Artist ${uniqueSuffix}`,
  }));

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser, request }) => {
    for (const song of songs) {
      const response = await request.post(`${BACKEND_URL}/api/song`, {
        data: { name: song.name, artist: song.artist },
      });
      expect(response.status()).toBe(201);
    }

    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('creates a new show', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const addButton = page.locator('button:has-text("Add Show")');
    await addButton.waitFor({ state: 'visible', timeout: 10000 });
    await addButton.click();

    await page.waitForSelector('input[formControlName="name"]', { timeout: 10000 });
    await page.locator('input[formControlName="name"]').fill(showName);

    const saveButton = page.locator('button:has-text("Speichern")');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await dismissSuccessSnackBar(page);
    await page.waitForURL(/\/show\/\d+$/, { timeout: 15000 });
    await expect(page.getByText(showName)).toBeVisible({ timeout: 10000 });

    // Avoid the dashboard's own polling refresh interfering with the
    // interactions below by turning it off; every action already reloads
    // the race list itself once it completes.
    await page.locator('#show-dashboard-refresh-setting-dropdown mat-select').click();
    await page.getByRole('option', { name: 'Stopp' }).click();
  });

  test('creates races for the show', async () => {
    const races = [
      { person1: `Runner A1 ${uniqueSuffix}`, song1: songs[0], person2: `Runner A2 ${uniqueSuffix}`, song2: songs[1] },
      { person1: `Runner B1 ${uniqueSuffix}`, song1: songs[2], person2: `Runner B2 ${uniqueSuffix}`, song2: songs[3] },
      { person1: `Runner F1 ${uniqueSuffix}`, song1: songs[4], person2: `Runner F2 ${uniqueSuffix}`, song2: songs[5] },
    ];

    for (const race of races) {
      const songOptionsLoaded = waitForSongOptionsLoaded(page);
      await page.locator('button:has-text("Add Race for this Show")').click();
      await page.waitForSelector('input[formControlName="person1"]', { timeout: 10000 });
      await songOptionsLoaded;

      await page.locator('input[formControlName="person1"]').fill(race.person1);
      await pickSong(page, 'Song for Black Bike', race.song1);
      await page.locator('input[formControlName="person2"]').fill(race.person2);
      await pickSong(page, 'Song for White Bike', race.song2);

      const saveButton = page.locator('button:has-text("Speichern")');
      await expect(saveButton).toBeEnabled();
      await saveButton.click();
      await dismissSuccessSnackBar(page);
      await page.waitForURL(/\/show\/\d+$/, { timeout: 15000 });

      await expect(rowByText(page, race.person1)).toBeVisible({ timeout: 10000 });
      await expect(rowByText(page, race.person1)).toContainText(race.person2);
      await expect(rowByText(page, race.person1)).toContainText(race.song1.name);
      await expect(rowByText(page, race.person1)).toContainText(race.song2.name);
    }
  });

  test("edits a race's songs", async () => {
    const person1 = `Runner A1 ${uniqueSuffix}`;
    const row = rowByText(page, person1);

    const songOptionsLoaded = waitForSongOptionsLoaded(page);
    await row.getByRole('button', { name: 'Edit Race' }).click();
    await waitForRaceFormLoaded(page);
    await songOptionsLoaded;

    await pickSong(page, 'Song for Black Bike', songs[6]);

    await page.locator('button:has-text("Speichern")').click();
    await dismissSuccessSnackBar(page);
    await page.waitForURL(/\/show\/\d+$/, { timeout: 15000 });

    await expect(row).toContainText(songs[6].name);
    await expect(row).not.toContainText(songs[0].name);
  });

  test("edits a race's rider names", async () => {
    const oldPerson1 = `Runner A1 ${uniqueSuffix}`;
    const newPerson1 = `Runner A1 Updated ${uniqueSuffix}`;
    const newPerson2 = `Runner A2 Updated ${uniqueSuffix}`;
    const row = rowByText(page, oldPerson1);

    await row.getByRole('button', { name: 'Edit Race' }).click();
    await waitForRaceFormLoaded(page);

    await page.locator('input[formControlName="person1"]').fill(newPerson1);
    await page.locator('input[formControlName="person2"]').fill(newPerson2);

    await page.locator('button:has-text("Speichern")').click();
    await dismissSuccessSnackBar(page);
    await page.waitForURL(/\/show\/\d+$/, { timeout: 15000 });

    const updatedRow = rowByText(page, newPerson1);
    await expect(updatedRow).toBeVisible({ timeout: 10000 });
    await expect(updatedRow).toContainText(newPerson2);
  });

  test('merges two races that are waiting for an opponent', async () => {
    const soloC = `Solo C ${uniqueSuffix}`;
    const soloD = `Solo D ${uniqueSuffix}`;

    for (const [person1, song] of [[soloC, songs[7]], [soloD, songs[8]]] as const) {
      const songOptionsLoaded = waitForSongOptionsLoaded(page);
      await page.locator('button:has-text("Add Race for this Show")').click();
      await page.waitForSelector('input[formControlName="person1"]', { timeout: 10000 });
      await songOptionsLoaded;

      await page.locator('input[formControlName="person1"]').fill(person1);
      await pickSong(page, 'Song for Black Bike', song);

      const saveButton = page.locator('button:has-text("Speichern")');
      await expect(saveButton).toBeEnabled();
      await saveButton.click();
      await dismissSuccessSnackBar(page);
      await page.waitForURL(/\/show\/\d+$/, { timeout: 15000 });
    }

    const soloCRow = rowByText(page, soloC);
    await expect(soloCRow).toContainText('WAITING_FOR_OPPONENT');
    await expect(rowByText(page, soloD)).toContainText('WAITING_FOR_OPPONENT');

    await soloCRow.getByRole('button', { name: 'Merge Races' }).click();
    await dismissSuccessSnackBar(page);

    const mergedRow = rowByText(page, soloC);
    await expect(mergedRow).toContainText(soloD, { timeout: 10000 });
    await expect(mergedRow).toContainText('LISTED');
  });

  test('moves a race up and down in the order', async () => {
    const personB1 = `Runner B1 ${uniqueSuffix}`;
    const personF1 = `Runner F1 ${uniqueSuffix}`;

    const orderNumberOf = async (person: string): Promise<number> => {
      const text = await rowByText(page, person).locator('td').first().innerText();
      return Number(text.split('\n')[0]);
    };

    const orderBBefore = await orderNumberOf(personB1);
    const orderFBefore = await orderNumberOf(personF1);
    // F was created right after B, so it's expected to sort right after it.
    expect(orderFBefore).toBeGreaterThan(orderBBefore);

    await rowByText(page, personF1).getByRole('button', { name: 'Move Race Up' }).click();
    await dismissSuccessSnackBar(page);

    await expect.poll(() => orderNumberOf(personF1)).toEqual(orderBBefore);
    await expect.poll(() => orderNumberOf(personB1)).toEqual(orderFBefore);

    // Move it back down so later tests can rely on a known order.
    await rowByText(page, personF1).getByRole('button', { name: 'Move Race Down' }).click();
    await dismissSuccessSnackBar(page);
  });

  test('sets a race with bike 1 (black bike) won', async () => {
    const personB1 = `Runner B1 ${uniqueSuffix}`;
    const personB2 = `Runner B2 ${uniqueSuffix}`;
    const row = rowByText(page, personB1);

    await row.locator('td.song-column button.bike-won-button').nth(0).click();
    await dismissSuccessSnackBar(page);

    await expect(row).toContainText('RACED');
    await expect(row.locator('.winning-bike')).toContainText(personB1);
    await expect(row.locator('.losing-bike')).toContainText(personB2);
  });

  test('sets a race with bike 2 (white bike) won', async () => {
    const soloC = `Solo C ${uniqueSuffix}`;
    const soloD = `Solo D ${uniqueSuffix}`;
    const row = rowByText(page, soloC);

    await row.locator('td.song-column button.bike-won-button').nth(1).click();
    await dismissSuccessSnackBar(page);

    await expect(row).toContainText('RACED');
    await expect(row.locator('.winning-bike')).toContainText(soloD);
    await expect(row.locator('.losing-bike')).toContainText(soloC);
  });

  test('sets a race with both bikes won', async () => {
    const person1 = `Runner A1 Updated ${uniqueSuffix}`;
    const person2 = `Runner A2 Updated ${uniqueSuffix}`;
    const row = rowByText(page, person1);

    await row.getByRole('button', { name: 'Songs Beide' }).click();
    await dismissSuccessSnackBar(page);

    await expect(row).toContainText('RACED');
    const winningBikes = row.locator('.winning-bike');
    await expect(winningBikes).toHaveCount(2);
    await expect(winningBikes.nth(0)).toContainText(person1);
    await expect(winningBikes.nth(1)).toContainText(person2);
  });

  test('deletes a race', async () => {
    const person1 = `Runner F1 ${uniqueSuffix}`;
    const row = rowByText(page, person1);

    await expect(row).not.toContainText('CANCELED');

    await row.getByRole('button', { name: 'Cancel Race' }).click();
    await dismissSuccessSnackBar(page);

    await expect(row).toContainText('CANCELED');
  });
});
