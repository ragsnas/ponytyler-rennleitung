import { test, expect, pause, rowByText, BACKEND_URL } from '../fixtures';

/**
 * The show states as the backend and the shows page handle them. Like races,
 * shows have no transition rules in the backend: any state can be set from
 * any other. What it guarantees:
 *
 *  - a change of state is announced on MQTT ("ShowStateChange"), a repeat is not;
 *  - only one show is in an active state at a time: entering one resets every
 *    other such show to LISTED (it stays `active`, only its state is reset);
 *  - "the current show" is a show flagged `active`.
 *
 * The shows page moves a show through its lifecycle: Start Show (active,
 * BEFORE_RACE), Stop Show / Set Show to finished (not active, finished,
 * SHOW_FINISHED) and Re-Activate Show (as Start Show). All tests hold
 * `exclusiveRaceState`, because the live show is global.
 */

const SHOW_STATES = [
  'LISTED',
  'BEFORE_SHOW',
  'BEFORE_RACE',
  'RACE',
  'RACE_FINISHED',
  'PLAYING_VIDEO',
  'VIDEO_FINISHED',
  'SHOW_FINISHED',
  'BEFORE_ENCORE',
  'PLAYING_ENCORE',
  'ENCORE_FINISHED',
];
const INACTIVE_SHOW_STATES = ['LISTED', 'SHOW_FINISHED'];

type StateChange = { showId: string; state: string };

test.describe('show state machine', () => {
  test.setTimeout(120000);

  test('announces a change of state once, and nothing when the state stays', async ({ api, mqttListener, exclusiveRaceState }) => {
    const show = await api.createShow();

    await api.setShowState(show, 'BEFORE_RACE');
    await api.setShowState(show, 'BEFORE_RACE');
    await api.setShowState(show, 'RACE');
    await mqttListener.waitFor('ShowStateChange', (body) => (body as StateChange).showId === String(show.id) && (body as StateChange).state === 'RACE');
    await pause(300);

    const announced = mqttListener
      .messages('ShowStateChange')
      .map((message) => message.body as StateChange)
      .filter((change) => change.showId === String(show.id))
      .map((change) => change.state);
    // A new show starts as BEFORE_SHOW, so BEFORE_RACE is the first change.
    expect(announced).toEqual(['BEFORE_RACE', 'RACE']);
  });

  for (const entering of SHOW_STATES) {
    const resets = !INACTIVE_SHOW_STATES.includes(entering);

    test(`a show entering ${entering} ${resets ? 'resets' : 'leaves alone'} the show that is in an active state`, async ({
      api,
      mqttListener,
      exclusiveRaceState,
    }) => {
      const live = await api.createShow();
      const other = await api.createShow();
      await api.startShow(live, 'BEFORE_RACE');

      await api.setShowState(other, entering);

      if (resets) {
        await mqttListener.waitFor(
          'ShowStateChange',
          (body) => (body as StateChange).showId === String(live.id) && (body as StateChange).state === 'LISTED',
        );
        // Only its state is reset: it is still flagged active.
        expect(await api.getShow(live)).toMatchObject({ showState: 'LISTED', active: true });
      } else {
        await pause(300);
        expect(await api.getShow(live)).toMatchObject({ showState: 'BEFORE_RACE', active: true });
      }
    });
  }

  test('accepts every transition from every show state to every other: there are no transition rules', async ({ api, exclusiveRaceState }) => {
    const show = await api.createShow();

    for (const from of SHOW_STATES) {
      for (const to of SHOW_STATES) {
        await api.setShowState(show, from);
        expect((await api.setShowState(show, to)) as { showState: string }, `${from} -> ${to}`).toMatchObject({ showState: to });
      }
    }
  });

  test.describe('current show', () => {
    test('is the show flagged active', async ({ api, request, exclusiveRaceState }) => {
      const show = await api.createShow();
      await api.startShow(show);

      const response = await request.get(`${BACKEND_URL}/api/show/current-show`);

      expect(await response.json()).toMatchObject({ id: show.id, active: true });
    });

    test('is missing, as a 404, when no show is active', async ({ api, request, exclusiveRaceState }) => {
      await api.createShow();
      await api.stopAllShows();

      const response = await request.get(`${BACKEND_URL}/api/show/current-show`);

      expect(response.status()).toBe(404);
    });
  });

  test.describe('shows page lifecycle', () => {
    test('Start Show makes the show live, Stop Show finishes it, Re-Activate Show starts it again', async ({ page, api, mqttListener, exclusiveRaceState }) => {
      const show = await api.createShow();
      await api.stopAllShows();
      await page.goto('/show', { waitUntil: 'networkidle' });
      const row = rowByText(page, show.name);
      const stateOf = () => api.getShow(show) as Promise<{ active: boolean; finished: boolean; showState: string }>;

      await row.getByRole('button', { name: 'Start Show' }).click();
      await expect.poll(stateOf).toMatchObject({ active: true, finished: false, showState: 'BEFORE_RACE' });
      await mqttListener.waitFor('ShowStateChange', (body) => (body as StateChange).showId === String(show.id) && (body as StateChange).state === 'BEFORE_RACE');

      await row.getByRole('button', { name: 'Stop Show' }).click();
      await expect.poll(stateOf).toMatchObject({ active: false, finished: true, showState: 'SHOW_FINISHED' });
      await mqttListener.waitFor('ShowStateChange', (body) => (body as StateChange).showId === String(show.id) && (body as StateChange).state === 'SHOW_FINISHED');

      await row.getByRole('button', { name: 'Re-Activate Show' }).click();
      await expect.poll(stateOf).toMatchObject({ active: true, finished: false, showState: 'BEFORE_RACE' });
    });

    test('Set Show to finished ends a live show like Stop Show does', async ({ page, api, exclusiveRaceState }) => {
      const show = await api.createShow();
      await api.startShow(show);
      await page.goto('/show', { waitUntil: 'networkidle' });

      await rowByText(page, show.name).getByRole('button', { name: 'Set Show to finished' }).click();

      await expect.poll(() => api.getShow(show)).toMatchObject({ active: false, showState: 'SHOW_FINISHED' });
    });

    test('starting a second show takes the live state from the first', async ({ page, api, exclusiveRaceState }) => {
      const first = await api.createShow();
      const second = await api.createShow();
      await api.startShow(first);
      await page.goto('/show', { waitUntil: 'networkidle' });

      await rowByText(page, second.name).getByRole('button', { name: 'Start Show' }).click();

      await expect.poll(() => api.getShow(second)).toMatchObject({ active: true, showState: 'BEFORE_RACE' });
      expect(await api.getShow(first)).toMatchObject({ showState: 'LISTED' });
    });
  });
});
