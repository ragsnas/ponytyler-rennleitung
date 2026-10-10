import { test, expect, pause, BACKEND_URL } from '../fixtures';

/**
 * The race states as the backend enforces them (RaceService). It has NO
 * transition rules: any state can be set from any other. What it does
 * guarantee:
 *
 *  - a change of state is announced on MQTT ("RaceStateChange"), a repeat is not;
 *  - only one race in the whole database is in an active state at a time:
 *    entering one resets every other active race to LISTED, and announces it;
 *  - LISTED vs WAITING_FOR_OPPONENT follows the riders and songs of the request;
 *  - the "current race" of a show is the active race, else its last LISTED race.
 *
 * The page that drives these transitions is covered in
 * state-machine-page.spec.ts. All tests hold `exclusiveRaceState`, because the
 * active race is global.
 */

const RACE_STATES = ['WAITING_FOR_OPPONENT', 'CANCELED', 'LISTED', 'WAITING_TO_RACE', 'RACING', 'RACED', 'ERROR', 'VIDEO_PLAYING', 'DONE'];
const ACTIVE_RACE_STATES = ['WAITING_TO_RACE', 'RACING', 'RACED', 'ERROR', 'VIDEO_PLAYING'];

type StateChange = { raceId: string; state: string };

test.describe('race state machine', () => {
  test.setTimeout(120000);

  test('announces a change of state once, and nothing when the state stays or other fields change', async ({
    api,
    request,
    mqttListener,
    exclusiveRaceState,
  }) => {
    const show = await api.createShow();
    const race = await api.createCompleteRace(show);

    await api.setRaceState(race, 'CANCELED');
    await api.setRaceState(race, 'CANCELED'); // same state again
    const renamed = await request.patch(`${BACKEND_URL}/api/race/${race.id}`, {
      data: { showId: show.id, person1: 'Renamed Rider', person2: race.person2, song1Id: race.song1Id, song2Id: race.song2Id, raceState: 'CANCELED' },
    });
    expect(renamed.ok()).toBe(true);
    await api.setRaceState(race, 'LISTED');
    await mqttListener.waitFor('RaceStateChange', (body) => (body as StateChange).raceId === String(race.id) && (body as StateChange).state === 'LISTED');
    await pause(300);

    const announced = mqttListener
      .messages('RaceStateChange')
      .map((message) => message.body as StateChange)
      .filter((change) => change.raceId === String(race.id))
      .map((change) => change.state);
    expect(announced).toEqual(['CANCELED', 'LISTED']);
  });

  for (const entering of RACE_STATES) {
    const resets = ACTIVE_RACE_STATES.includes(entering);

    test(`a race entering ${entering} ${resets ? 'resets' : 'leaves alone'} the active race of another show`, async ({
      api,
      mqttListener,
      exclusiveRaceState,
    }) => {
      const [showA, showB] = [await api.createShow(), await api.createShow()];
      const active = await api.createCompleteRace(showA);
      const other = await api.createCompleteRace(showB);
      await api.setRaceState(active, 'RACING');

      await api.setRaceState(other, entering);

      if (resets) {
        await mqttListener.waitFor(
          'RaceStateChange',
          (body) => (body as StateChange).raceId === String(active.id) && (body as StateChange).state === 'LISTED',
        );
        expect((await api.getRace(active)).raceState).toBe('LISTED');
        expect((await api.getRace(other)).raceState).toBe(entering);
      } else {
        await pause(300);
        expect((await api.getRace(active)).raceState).toBe('RACING');
      }
    });
  }

  test('accepts every transition from every race state to every other: there are no transition rules', async ({ api, exclusiveRaceState }) => {
    const show = await api.createShow();
    const race = await api.createCompleteRace(show);

    for (const from of RACE_STATES) {
      for (const to of RACE_STATES) {
        await api.setRaceState(race, from);
        const stored = (await api.setRaceState(race, to)).raceState;
        // A complete race asked to wait for an opponent is LISTED instead.
        expect(stored, `${from} -> ${to}`).toBe(to === 'WAITING_FOR_OPPONENT' ? 'LISTED' : to);
      }
    }
  });

  test('a race without both riders and songs waits for an opponent instead of being LISTED', async ({ api, exclusiveRaceState }) => {
    const show = await api.createShow();
    const solo = await api.createRace(show, { person1: 'Solo Rider', song1: await api.createSong() });

    expect(solo.raceState).toBe('WAITING_FOR_OPPONENT');
    expect((await api.setRaceState(solo, 'LISTED')).raceState).toBe('WAITING_FOR_OPPONENT');
  });

  test('LISTED is judged on the riders and songs sent with the update, not on the stored ones', async ({ api, request, exclusiveRaceState }) => {
    const show = await api.createShow();
    const race = await api.createCompleteRace(show);

    // An update that only carries the state looks like a race without riders.
    const response = await request.patch(`${BACKEND_URL}/api/race/${race.id}`, { data: { showId: show.id, raceState: 'LISTED' } });

    expect((await response.json()).raceState).toBe('WAITING_FOR_OPPONENT');
  });

  test.describe('current race of a show', () => {
    const currentRaceOf = async (request: import('@playwright/test').APIRequestContext, showId: number): Promise<{ id: number } | null> => {
      const text = await (await request.get(`${BACKEND_URL}/api/race/current/${showId}`)).text();
      return text ? JSON.parse(text) : null;
    };

    test('is the last LISTED race while none is active', async ({ api, request, exclusiveRaceState }) => {
      const show = await api.createShow();
      const [, middle, last] = [await api.createCompleteRace(show), await api.createCompleteRace(show), await api.createCompleteRace(show)];

      expect((await currentRaceOf(request, show.id))?.id).toBe(last.id);
      await api.setRaceState(last, 'CANCELED');
      expect((await currentRaceOf(request, show.id))?.id).toBe(middle.id);
    });

    test('is the active race once one is, whatever the LISTED ones are', async ({ api, request, exclusiveRaceState }) => {
      const show = await api.createShow();
      const [first] = [await api.createCompleteRace(show), await api.createCompleteRace(show)];
      await api.setRaceState(first, 'RACING');

      expect((await currentRaceOf(request, show.id))?.id).toBe(first.id);
    });

    test('stays the race after it was raced, until it is set to DONE', async ({ api, request, exclusiveRaceState }) => {
      const show = await api.createShow();
      const [first, second] = [await api.createCompleteRace(show), await api.createCompleteRace(show)];
      await api.setRaceState(first, 'RACED');
      expect((await currentRaceOf(request, show.id))?.id).toBe(first.id);

      await api.setRaceState(first, 'DONE');
      expect((await currentRaceOf(request, show.id))?.id).toBe(second.id);
    });

    test('is nothing when the show has no race that is active or LISTED', async ({ api, request, exclusiveRaceState }) => {
      const show = await api.createShow();
      const waiting = await api.createRace(show, { person1: 'Solo', song1: await api.createSong() });
      const canceled = await api.createCompleteRace(show);
      await api.setRaceState(canceled, 'CANCELED');

      expect(waiting.raceState).toBe('WAITING_FOR_OPPONENT');
      expect(await currentRaceOf(request, show.id)).toBeNull();
    });
  });
});
