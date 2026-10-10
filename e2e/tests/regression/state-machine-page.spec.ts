import { test, expect, Page, SeedingApi, MqttListener, Race, Show } from '../fixtures';

/**
 * The state machine page (/state-machine): the operator's control for the
 * live show. This is where the transition rules live; the backend accepts any
 * state (see race-state-machine.spec.ts). The page
 *
 *  - enables its buttons by state: play unless a race is WAITING_TO_RACE or
 *    RACING, stop only then, skip always, "lyrics" only when the show is
 *    RACE_FINISHED, "check" only while a video plays or is finished;
 *  - moves the race and the show together when a button is pressed;
 *  - follows the state changes the backend announces over MQTT;
 *  - starts the race by itself when the countdown of a WAITING_TO_RACE race
 *    in a show in state RACE ends.
 *
 * All tests hold `exclusiveRaceState`, because the live show is global.
 */

const button = (page: Page, icon: string) => page.locator('button', { has: page.locator('mat-icon', { hasText: new RegExp(`^${icon}$`) }) });
const BUTTONS = { start: 'play_circle', skip: 'skip_next', stop: 'stop_circle', done: 'lyrics', videoDone: 'check_circle' } as const;

type StateChange = { raceId?: string; showId?: string; state: string };

async function liveShowWithRace(
  api: SeedingApi,
  options: { showState?: string; raceState?: string; races?: number } = {},
): Promise<{ show: Show; races: Race[] }> {
  const show = await api.createShow();
  const races: Race[] = [];
  for (let i = 0; i < (options.races ?? 1); i++) {
    races.push(await api.createCompleteRace(show));
  }
  await api.startShow(show, options.showState ?? 'BEFORE_RACE');
  if (options.raceState && options.raceState !== 'LISTED') {
    await api.setRaceState(races[races.length - 1], options.raceState);
  }
  return { show, races };
}

async function openStateMachine(page: Page, show: Show, raceState?: string): Promise<void> {
  await page.goto('/state-machine', { waitUntil: 'networkidle' });
  await expect(page.locator('.showInfo')).toContainText(show.name);
  if (raceState) {
    await expect(page.locator('.showInfo')).toContainText(raceState);
  }
  // The page listens to the broker over a WebSocket; it must be subscribed
  // before the test changes states behind its back.
  await page.waitForTimeout(500);
}

const announced = (mqttListener: MqttListener, topic: 'RaceStateChange' | 'ShowStateChange', id: number, state: string) =>
  mqttListener.waitFor(topic, (body) => {
    const change = body as StateChange;
    return (change.raceId ?? change.showId) === String(id) && change.state === state;
  });

test.describe('state machine page', () => {
  test.setTimeout(120000);

  test('enables play and stop by race state, and follows a race that changes behind its back', async ({ page, api, exclusiveRaceState }) => {
    const { show, races } = await liveShowWithRace(api);
    await openStateMachine(page, show, 'LISTED');

    // WAITING_FOR_OPPONENT is left out: a complete race cannot be in it.
    for (const raceState of ['LISTED', 'WAITING_TO_RACE', 'RACING', 'RACED', 'ERROR', 'VIDEO_PLAYING', 'CANCELED', 'DONE']) {
      await api.setRaceState(races[0], raceState);
      await expect(page.locator('.showInfo'), `race ${raceState}`).toContainText(raceState);

      const inProgress = raceState === 'WAITING_TO_RACE' || raceState === 'RACING';
      await expect(button(page, BUTTONS.start), `play in ${raceState}`).toBeEnabled({ enabled: !inProgress });
      await expect(button(page, BUTTONS.stop), `stop in ${raceState}`).toBeEnabled({ enabled: inProgress });
      await expect(button(page, BUTTONS.skip), `skip in ${raceState}`).toBeEnabled();
    }
  });

  test('enables the done buttons by show state, and shows what each show state means', async ({ page, api, exclusiveRaceState }) => {
    const { show } = await liveShowWithRace(api);
    await openStateMachine(page, show);

    const showStates: Array<[string, string | null]> = [
      ['BEFORE_SHOW', 'Waiting for Show to begin'],
      ['BEFORE_RACE', 'Waiting for Race to Start'],
      ['RACE', 'RACE!'],
      ['RACE_FINISHED', 'Celebrate the winner!'],
      ['PLAYING_VIDEO', 'VIDEO IS PLAYING NOW'],
      ['VIDEO_FINISHED', 'VIDEO FINISHED!'],
      ['BEFORE_ENCORE', 'Goodbye!'],
      ['PLAYING_ENCORE', 'ENCORE!!!'],
      ['ENCORE_FINISHED', 'The Show is over! Go Home!'],
      ['SHOW_FINISHED', 'The Show is now actually over! Go Home!'],
      ['LISTED', null],
    ];
    for (const [showState] of showStates) {
      await api.setShowState(show, showState);
      await expect(page.locator('.showInfo'), `show ${showState}`).toContainText(showState);

      await expect(button(page, BUTTONS.done), `done in ${showState}`).toBeEnabled({ enabled: showState === 'RACE_FINISHED' });
      await expect(button(page, BUTTONS.videoDone), `video done in ${showState}`).toBeEnabled({
        enabled: showState === 'PLAYING_VIDEO' || showState === 'VIDEO_FINISHED',
      });
      // The text is partly bare text in the page, so look at the whole component:
      // this state's text is there and no other state's is.
      for (const [otherState, otherText] of showStates) {
        if (otherText) {
          const expectation = expect(page.locator('lib-state-machine'), `"${otherText}" in ${showState}`);
          await (otherState === showState ? expectation.toContainText(otherText) : expectation.not.toContainText(otherText));
        }
      }
    }
  });

  test('shows what a race state means while the show is in RACE', async ({ page, api, exclusiveRaceState }) => {
    const { show, races } = await liveShowWithRace(api, { showState: 'RACE' });
    await openStateMachine(page, show, 'LISTED');

    for (const [raceState, text] of [
      ['ERROR', 'ERROR! FEHLSTART!'],
      ['RACING', 'RACE IS RUNNING!'],
      ['RACED', 'RACE IS OVER!'],
    ]) {
      await api.setRaceState(races[0], raceState);
      await expect(page.getByText(text), `race ${raceState}`).toBeVisible();
    }
  });

  test('play starts the countdown, and the race starts by itself when it ends', async ({ page, api, mqttListener, exclusiveRaceState }) => {
    const { show, races } = await liveShowWithRace(api);
    await openStateMachine(page, show, 'LISTED');

    await button(page, BUTTONS.start).click();

    await expect.poll(async () => api.getRace(races[0])).toMatchObject({ raceState: 'WAITING_TO_RACE', raced: true });
    expect(await api.getShow(show)).toMatchObject({ showState: 'RACE' });
    await announced(mqttListener, 'RaceStateChange', races[0].id, 'WAITING_TO_RACE');
    await announced(mqttListener, 'ShowStateChange', show.id, 'RACE');

    // After the 3 second countdown the page starts the race itself.
    await expect.poll(async () => api.getRace(races[0]), { timeout: 20000 }).toMatchObject({ raceState: 'RACING' });
    expect((await api.getRace(races[0])) as { raceStartedAt: string | null }).toMatchObject({ raceStartedAt: expect.any(String) });
    await announced(mqttListener, 'RaceStateChange', races[0].id, 'RACING');
  });

  for (const raceState of ['WAITING_TO_RACE', 'RACING']) {
    test(`stop puts a ${raceState} race back to LISTED and the show to BEFORE_RACE`, async ({ page, api, mqttListener, exclusiveRaceState }) => {
      // In BEFORE_RACE there is no countdown that would start the race by itself.
      const { show, races } = await liveShowWithRace(api, { raceState });
      await openStateMachine(page, show, raceState);

      await button(page, BUTTONS.stop).click();

      await expect.poll(async () => api.getRace(races[0])).toMatchObject({ raceState: 'LISTED' });
      expect(await api.getShow(show)).toMatchObject({ showState: 'BEFORE_RACE' });
      await announced(mqttListener, 'RaceStateChange', races[0].id, 'LISTED');
    });
  }

  test('skip cancels the current race and sets the show to BEFORE_RACE', async ({ page, api, mqttListener, exclusiveRaceState }) => {
    const { show, races } = await liveShowWithRace(api, { races: 2 });
    const [earlier, current] = races;
    await openStateMachine(page, show);
    // The last LISTED race is the current one.
    await expect(page.locator('.raceInfo')).toContainText(current.person1!);

    await button(page, BUTTONS.skip).click();

    await expect.poll(async () => api.getRace(current)).toMatchObject({ raceState: 'CANCELED' });
    expect(await api.getShow(show)).toMatchObject({ showState: 'BEFORE_RACE' });
    await announced(mqttListener, 'RaceStateChange', current.id, 'CANCELED');
    expect((await api.getRace(earlier)).raceState).toBe('LISTED');
  });

  test('"lyrics" sets a raced race to DONE once the show is RACE_FINISHED', async ({ page, api, mqttListener, exclusiveRaceState }) => {
    const { show, races } = await liveShowWithRace(api, { showState: 'RACE_FINISHED', races: 2 });
    const [, raced] = races;
    await api.setRaceState(raced, 'RACED');
    await openStateMachine(page, show, 'RACED');

    await button(page, BUTTONS.done).click();

    await expect.poll(async () => api.getRace(raced)).toMatchObject({ raceState: 'DONE' });
    expect(await api.getShow(show)).toMatchObject({ showState: 'BEFORE_RACE' });
    await announced(mqttListener, 'RaceStateChange', raced.id, 'DONE');
    await announced(mqttListener, 'ShowStateChange', show.id, 'BEFORE_RACE');
  });

  for (const videoState of ['PLAYING_VIDEO', 'VIDEO_FINISHED']) {
    test(`"check" sets the race to DONE and the show to BEFORE_RACE while ${videoState}`, async ({ page, api, exclusiveRaceState }) => {
      const { show, races } = await liveShowWithRace(api, { showState: videoState, raceState: 'VIDEO_PLAYING' });
      await openStateMachine(page, show, 'VIDEO_PLAYING');

      await button(page, BUTTONS.videoDone).click();

      await expect.poll(async () => api.getRace(races[0])).toMatchObject({ raceState: 'DONE' });
      expect(await api.getShow(show)).toMatchObject({ showState: 'BEFORE_RACE' });
    });
  }

  test('follows another show taking over the live state', async ({ page, api, exclusiveRaceState }) => {
    const { show } = await liveShowWithRace(api);
    await openStateMachine(page, show);
    const other = await api.createShow();

    await api.setShowState(other, 'BEFORE_RACE');

    // The page's show was reset to LISTED by the backend.
    await expect(page.locator('.showInfo')).toContainText('LISTED');
  });

  test.describe('known defects', () => {
    // Defect, intermittent (about one run in three): after "lyrics" or skip the
    // page sometimes keeps showing the finished race. The backend announces the
    // new state before the update's response arrives, so the page first reloads
    // "the current race" by id (a finished race) and afterwards "the current
    // race of the show" (the next one); whichever response arrives last wins.
    // `fixme` because an intermittent failure cannot be asserted with
    // `test.fail`. Enable it to see the defect, and once it is fixed, keep it.
    test.fixme('moves on to the next race after "lyrics", every time', async ({ page, api, exclusiveRaceState }) => {
      const { show, races } = await liveShowWithRace(api, { showState: 'RACE_FINISHED', races: 2 });
      const [next, raced] = races;
      await api.setRaceState(raced, 'RACED');
      await openStateMachine(page, show, 'RACED');

      await button(page, BUTTONS.done).click();

      await expect(page.locator('.raceInfo')).toContainText(next.person1!);
      await page.waitForTimeout(1500); // a late reload of the finished race would replace it
      await expect(page.locator('.raceInfo')).toContainText(next.person1!);
    });
  });
});
