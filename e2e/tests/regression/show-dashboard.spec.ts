import { test, expect, rowByText, dismissSuccessSnackBar, uniqueName, Page, Show, Song } from '../fixtures';

/**
 * Exercises the Show Dashboard page end to end through the Angular frontend:
 * creating a show, adding a race, editing a race's songs and rider names,
 * merging two races that are waiting for an opponent, reordering races,
 * marking each bike (and both bikes) as the winner, and deleting (canceling)
 * a race.
 *
 * Every test is independent: it seeds its own show, songs and races through
 * the backend REST API (the `api` fixture, cleaned up afterwards) and uses
 * the UI only for the action under test. The first two tests create their
 * show / race through the UI, since that is what they cover.
 */

function waitForSongOptionsLoaded(page: Page) {
  // The song autocomplete only (re-)filters its options when its own input
  // value changes (see InputComponent.ngOnInit); it doesn't react if the
  // underlying selectable-songs list arrives later. Registering this wait
  // before opening a race form and awaiting it before typing avoids a race
  // where the field is typed into before that list has loaded, which would
  // leave it permanently filtered against an empty list.
  return page.waitForResponse((response) => response.url().includes('/api/song/selectable') && response.ok());
}

async function pickSong(page: Page, songFieldLabel: string, song: Pick<Song, 'name'>): Promise<void> {
  const input = page.locator('lib-song-auto-complete', { hasText: songFieldLabel }).locator('input');
  // Match on the (unique) song name rather than the full "artist - name" role
  // name: an option can carry extra icon text (e.g. a "warning" icon for a
  // song already wished for elsewhere), which breaks an exact accessible-name match.
  const option = page.locator('mat-option').filter({ hasText: song.name }).first();
  // Retyping re-runs the autocomplete's filter, which recovers the rare case
  // where it was first applied before the selectable-songs list had arrived
  // (see waitForSongOptionsLoaded).
  await expect(async () => {
    await input.click();
    await input.fill('');
    await input.fill(song.name);
    await expect(option).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 30000 });
  await option.click();
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

/**
 * Opens the dashboard of a seeded show. The dashboard's own polling refresh
 * is turned off so it can't interfere with the interactions; every action
 * already reloads the race list itself once it completes.
 */
async function openDashboard(page: Page, show: Pick<Show, 'id' | 'name'>): Promise<void> {
  await page.goto(`/show/${show.id}`, { waitUntil: 'networkidle' });
  await expect(page.getByText(show.name)).toBeVisible({ timeout: 10000 });
  await page.locator('#show-dashboard-refresh-setting-dropdown mat-select').click();
  await page.getByRole('option', { name: 'Stopp' }).click();
}

test.describe('Show Dashboard', () => {
  test.setTimeout(120000);

  test('creates a new show', async ({ page, api }) => {
    const showName = uniqueName('E2E Dashboard Show');

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
    api.adoptShow(Number(page.url().match(/\/show\/(\d+)$/)![1]));
    await expect(page.getByText(showName)).toBeVisible({ timeout: 10000 });
  });

  test('creates a race for the show', async ({ page, api }) => {
    const show = await api.createShow();
    const song1 = await api.createSong();
    const song2 = await api.createSong();
    const person1 = uniqueName('Runner A1');
    const person2 = uniqueName('Runner A2');
    await openDashboard(page, show);

    const songOptionsLoaded = waitForSongOptionsLoaded(page);
    await page.locator('button:has-text("Add Race for this Show")').click();
    await page.waitForSelector('input[formControlName="person1"]', { timeout: 10000 });
    await songOptionsLoaded;

    await page.locator('input[formControlName="person1"]').fill(person1);
    await pickSong(page, 'Song for Black Bike', song1);
    await page.locator('input[formControlName="person2"]').fill(person2);
    await pickSong(page, 'Song for White Bike', song2);

    const saveButton = page.locator('button:has-text("Speichern")');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await dismissSuccessSnackBar(page);
    await page.waitForURL(/\/show\/\d+$/, { timeout: 15000 });

    const row = rowByText(page, person1);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(person2);
    await expect(row).toContainText(song1.name);
    await expect(row).toContainText(song2.name);
  });

  test("edits a race's songs", async ({ page, api }) => {
    const show = await api.createShow();
    const oldSong = await api.createSong();
    const newSong = await api.createSong();
    const person1 = uniqueName('Runner A1');
    await api.createRace(show, { person1, song1: oldSong, person2: uniqueName('Runner A2'), song2: await api.createSong() });
    await openDashboard(page, show);
    const row = rowByText(page, person1);

    const songOptionsLoaded = waitForSongOptionsLoaded(page);
    await row.getByRole('button', { name: 'Edit Race' }).click();
    await waitForRaceFormLoaded(page);
    await songOptionsLoaded;

    await pickSong(page, 'Song for Black Bike', newSong);

    await page.locator('button:has-text("Speichern")').click();
    await dismissSuccessSnackBar(page);
    await page.waitForURL(/\/show\/\d+$/, { timeout: 15000 });

    await expect(row).toContainText(newSong.name);
    await expect(row).not.toContainText(oldSong.name);
  });

  test("edits a race's rider names", async ({ page, api }) => {
    const show = await api.createShow();
    const oldPerson1 = uniqueName('Runner A1');
    await api.createRace(show, {
      person1: oldPerson1,
      song1: await api.createSong(),
      person2: uniqueName('Runner A2'),
      song2: await api.createSong(),
    });
    const newPerson1 = uniqueName('Runner A1 Updated');
    const newPerson2 = uniqueName('Runner A2 Updated');
    await openDashboard(page, show);

    await rowByText(page, oldPerson1).getByRole('button', { name: 'Edit Race' }).click();
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

  test('merges two races that are waiting for an opponent', async ({ page, api }) => {
    const show = await api.createShow();
    const soloC = uniqueName('Solo C');
    const soloD = uniqueName('Solo D');
    await api.createRace(show, { person1: soloC, song1: await api.createSong() });
    await api.createRace(show, { person1: soloD, song1: await api.createSong() });
    await openDashboard(page, show);

    const soloCRow = rowByText(page, soloC);
    await expect(soloCRow).toContainText('WAITING_FOR_OPPONENT');
    await expect(rowByText(page, soloD)).toContainText('WAITING_FOR_OPPONENT');

    await soloCRow.getByRole('button', { name: 'Merge Races' }).click();
    await dismissSuccessSnackBar(page);

    const mergedRow = rowByText(page, soloC);
    await expect(mergedRow).toContainText(soloD, { timeout: 10000 });
    await expect(mergedRow).toContainText('LISTED');
  });

  test('moves a race up and down in the order', async ({ page, api }) => {
    const show = await api.createShow();
    const personB1 = uniqueName('Runner B1');
    const personF1 = uniqueName('Runner F1');
    for (const person1 of [personB1, personF1]) {
      await api.createRace(show, {
        person1,
        song1: await api.createSong(),
        person2: uniqueName('Runner 2'),
        song2: await api.createSong(),
      });
    }
    await openDashboard(page, show);

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

    await rowByText(page, personF1).getByRole('button', { name: 'Move Race Down' }).click();
    await dismissSuccessSnackBar(page);

    await expect.poll(() => orderNumberOf(personF1)).toEqual(orderFBefore);
    await expect.poll(() => orderNumberOf(personB1)).toEqual(orderBBefore);
  });

  test('sets a race with bike 1 (black bike) won', async ({ page, api, exclusiveRaceState }) => {
    const show = await api.createShow();
    const personB1 = uniqueName('Runner B1');
    const personB2 = uniqueName('Runner B2');
    await api.createRace(show, {
      person1: personB1,
      song1: await api.createSong(),
      person2: personB2,
      song2: await api.createSong(),
    });
    await openDashboard(page, show);
    const row = rowByText(page, personB1);

    await row.locator('td.song-column button.bike-won-button').nth(0).click();
    await dismissSuccessSnackBar(page);

    await expect(row).toContainText('RACED');
    await expect(row.locator('.winning-bike')).toContainText(personB1);
    await expect(row.locator('.losing-bike')).toContainText(personB2);
  });

  test('sets a race with bike 2 (white bike) won', async ({ page, api, exclusiveRaceState }) => {
    const show = await api.createShow();
    const person1 = uniqueName('Runner C1');
    const person2 = uniqueName('Runner C2');
    await api.createRace(show, {
      person1,
      song1: await api.createSong(),
      person2,
      song2: await api.createSong(),
    });
    await openDashboard(page, show);
    const row = rowByText(page, person1);

    await row.locator('td.song-column button.bike-won-button').nth(1).click();
    await dismissSuccessSnackBar(page);

    await expect(row).toContainText('RACED');
    await expect(row.locator('.winning-bike')).toContainText(person2);
    await expect(row.locator('.losing-bike')).toContainText(person1);
  });

  test('sets a race with both bikes won', async ({ page, api, exclusiveRaceState }) => {
    const show = await api.createShow();
    const person1 = uniqueName('Runner A1');
    const person2 = uniqueName('Runner A2');
    await api.createRace(show, {
      person1,
      song1: await api.createSong(),
      person2,
      song2: await api.createSong(),
    });
    await openDashboard(page, show);
    const row = rowByText(page, person1);

    await row.getByRole('button', { name: 'Songs Beide' }).click();
    await dismissSuccessSnackBar(page);

    await expect(row).toContainText('RACED');
    const winningBikes = row.locator('.winning-bike');
    await expect(winningBikes).toHaveCount(2);
    await expect(winningBikes.nth(0)).toContainText(person1);
    await expect(winningBikes.nth(1)).toContainText(person2);
  });

  test('deletes a race', async ({ page, api }) => {
    const show = await api.createShow();
    const person1 = uniqueName('Runner F1');
    await api.createRace(show, {
      person1,
      song1: await api.createSong(),
      person2: uniqueName('Runner F2'),
      song2: await api.createSong(),
    });
    await openDashboard(page, show);
    const row = rowByText(page, person1);

    await expect(row).not.toContainText('CANCELED');

    await row.getByRole('button', { name: 'Cancel Race' }).click();
    await dismissSuccessSnackBar(page);

    await expect(row).toContainText('CANCELED');
  });
});
