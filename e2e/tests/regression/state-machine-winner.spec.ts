import { test, expect, pause, SeedingApi, MqttListener, Race, Show } from '../fixtures';

/**
 * How a race is won through the bike sensors (MQTT), the part of the state
 * machine the backend drives itself (be/src/mqtt: BikeRaceTracker and
 * MqttBrokerService). A bike crosses the finish line when its pulsecount
 * exceeds 120. The first finisher starts a one second grace period for the
 * other bike; then the winner is decided (the lower `sequenz` wins, equal
 * means both) and recorded on the CURRENT race of the CURRENT show: the race
 * becomes RACED with `bikeWon`, the show RACE_FINISHED, and "Bike/<n>/won"
 * is announced. The tracker holds one race at a time and is reset by a
 * RaceStateChange to WAITING_TO_RACE or RACING.
 *
 * The tracker is global, so every test holds `exclusiveRaceState`.
 *
 * Tests marked `test.fail` document a known defect: they assert the sensible
 * behaviour and are expected to fail until the app is fixed, at which point
 * Playwright reports them as unexpectedly passing and the marker should go.
 */

type StateChange = { raceId?: string; showId?: string; state: string };

/** A live show in state RACE with a RACING race: what the winner is recorded on. */
async function racing(api: SeedingApi, mqttListener: MqttListener): Promise<{ show: Show; race: Race }> {
  mqttListener.clear(); // announcements of tests that held the lock before must not count
  const show = await api.createShow();
  const race = await api.createCompleteRace(show);
  await api.startShow(show, 'RACE');
  await api.setRaceState(race, 'RACING');
  await restarted(mqttListener, race, 'RACING');
  return { show, race };
}

/** Waits until the broker has seen the state change that resets its tracker. */
async function restarted(mqttListener: MqttListener, race: Race, state: string): Promise<void> {
  await mqttListener.waitFor('RaceStateChange', (body) => (body as StateChange).raceId === String(race.id) && (body as StateChange).state === state);
  await pause(150); // the broker handles the message in the same moment it forwards it
}

/** How long to wait to be sure that NO winner is decided: the grace period plus slack. */
const NO_WINNER_WAIT_MS = 1800;

test.describe('winner through the bike sensors', () => {
  test.setTimeout(120000);

  for (const [name, finishes, expectedWinner] of [
    ['bike 1', [['1', 5]], 1],
    ['bike 2', [['2', 5]], 2],
    ['the bike with the lower sequence number, even when its message arrives later', [['1', 9], ['2', 4]], 2],
    ['both bikes, when they finish with the same sequence number', [['1', 5], ['2', 5]], 3],
  ] as const) {
    test(`records ${name} as the winner`, async ({ api, mqttPublisher, mqttListener, exclusiveRaceState }) => {
      const { show, race } = await racing(api, mqttListener);

      for (const [bike, sequenz] of finishes) {
        await mqttPublisher.publishBikeFinished(bike, sequenz);
      }

      await expect.poll(() => api.getRace(race), { timeout: 10000 }).toMatchObject({ raceState: 'RACED', bikeWon: expectedWinner, raced: true });
      expect((await api.getRace(race)) as { raceFinishedAt: string | null }).toMatchObject({ raceFinishedAt: expect.any(String) });
      expect(await api.getShow(show)).toMatchObject({ showState: 'RACE_FINISHED' });
      await mqttListener.waitFor(`Bike/${expectedWinner}/won`);
      await mqttListener.waitFor('RaceStateChange', (body) => (body as StateChange).raceId === String(race.id) && (body as StateChange).state === 'RACED');
      await mqttListener.waitFor('ShowStateChange', (body) => (body as StateChange).showId === String(show.id) && (body as StateChange).state === 'RACE_FINISHED');
    });
  }

  test('a bike has not finished until its pulsecount exceeds 120', async ({ api, mqttPublisher, mqttListener, exclusiveRaceState }) => {
    const { race } = await racing(api, mqttListener);

    await mqttPublisher.publishBikeStatus('1', { pulsecount: 120, sequenz: 5, timestamp: Date.now() });
    await pause(NO_WINNER_WAIT_MS);
    expect((await api.getRace(race)).raceState).toBe('RACING');

    await mqttPublisher.publishBikeStatus('1', { pulsecount: 121, sequenz: 6, timestamp: Date.now() });
    await expect.poll(() => api.getRace(race), { timeout: 10000 }).toMatchObject({ raceState: 'RACED', bikeWon: 1 });
  });

  test('decides a race once: a later finish, of either bike, changes nothing', async ({ api, mqttPublisher, mqttListener, exclusiveRaceState }) => {
    const { show, race } = await racing(api, mqttListener);
    await mqttPublisher.publishBikeFinished('1', 5);
    await expect.poll(() => api.getRace(race), { timeout: 10000 }).toMatchObject({ raceState: 'RACED', bikeWon: 1 });

    await mqttListener.waitFor('Bike/1/won');
    mqttListener.clear();

    await mqttPublisher.publishBikeFinished('2', 9);
    await mqttPublisher.publishBikeFinished('1', 10);
    await pause(NO_WINNER_WAIT_MS);

    expect(await api.getRace(race)).toMatchObject({ raceState: 'RACED', bikeWon: 1 });
    expect(await api.getShow(show)).toMatchObject({ showState: 'RACE_FINISHED' });
    expect(mqttListener.messages().filter((message) => /\/won$/.test(message.topic))).toEqual([]);
  });

  test('forgets a finish when the race is restarted before the winner is decided', async ({ api, mqttPublisher, mqttListener, exclusiveRaceState }) => {
    const { race } = await racing(api, mqttListener);

    await mqttPublisher.publishBikeFinished('1', 5);
    await api.setRaceState(race, 'WAITING_TO_RACE'); // the restart, inside the grace period
    await restarted(mqttListener, race, 'WAITING_TO_RACE');
    await pause(NO_WINNER_WAIT_MS);
    expect(await api.getRace(race), 'the pending decision was dropped').toMatchObject({ raceState: 'WAITING_TO_RACE', bikeWon: 0 });

    await api.setRaceState(race, 'RACING');
    await restarted(mqttListener, race, 'RACING');
    await mqttPublisher.publishBikeFinished('2', 7);

    // Bike 1's earlier finish is gone, so bike 2 is the only finisher.
    await expect.poll(() => api.getRace(race), { timeout: 10000 }).toMatchObject({ raceState: 'RACED', bikeWon: 2 });
  });

  test('gives the next race its own winner once the state machine has moved on', async ({ api, mqttPublisher, mqttListener, exclusiveRaceState }) => {
    const { show, race: first } = await racing(api, mqttListener);
    const second = await api.createCompleteRace(show);
    await mqttPublisher.publishBikeFinished('1', 5);
    await expect.poll(() => api.getRace(first), { timeout: 10000 }).toMatchObject({ raceState: 'RACED', bikeWon: 1 });

    // What the operator does: first race done, then the next race starts.
    await api.setShowState(show, 'BEFORE_RACE');
    await api.setRaceState(first, 'DONE');
    await api.setShowState(show, 'RACE');
    await api.setRaceState(second, 'RACING');
    await restarted(mqttListener, second, 'RACING');
    await mqttPublisher.publishBikeFinished('2', 5);

    await expect.poll(() => api.getRace(second), { timeout: 10000 }).toMatchObject({ raceState: 'RACED', bikeWon: 2 });
    expect(await api.getRace(first)).toMatchObject({ raceState: 'DONE', bikeWon: 1 });
  });

  test('records no winner while the show is not live: it is neither started nor already finished', async ({ api, mqttPublisher, mqttListener, exclusiveRaceState }) => {
    const { show, race } = await racing(api, mqttListener);
    await api.setShowState(show, 'LISTED');

    await mqttPublisher.publishBikeFinished('1', 5);
    await pause(NO_WINNER_WAIT_MS);

    expect(await api.getRace(race)).toMatchObject({ raceState: 'RACING', bikeWon: 0 });
    expect(await api.getShow(show)).toMatchObject({ showState: 'LISTED' });
  });

  test('records no winner on a cancelled race', async ({ api, mqttPublisher, mqttListener, exclusiveRaceState }) => {
    const { show, race } = await racing(api, mqttListener);
    await api.setRaceState(race, 'CANCELED');
    await restarted(mqttListener, race, 'CANCELED');

    await mqttPublisher.publishBikeFinished('1', 5);
    await pause(NO_WINNER_WAIT_MS);

    expect(await api.getRace(race)).toMatchObject({ raceState: 'CANCELED', bikeWon: 0 });
    expect(await api.getShow(show)).toMatchObject({ showState: 'RACE' });
  });

  test('the state machine page celebrates the winner', async ({ page, api, mqttPublisher, mqttListener, exclusiveRaceState }) => {
    const { show } = await racing(api, mqttListener);
    await page.goto('/state-machine', { waitUntil: 'networkidle' });
    await expect(page.locator('.showInfo')).toContainText('RACING');
    await page.waitForTimeout(500); // subscribed to the broker

    await mqttPublisher.publishBikeFinished('2', 5);

    await expect(page.locator('.showInfo')).toContainText('RACED', { timeout: 10000 });
    await expect(page.locator('lib-state-machine')).toContainText('Celebrate the winner!');
    expect(show.id).toBeGreaterThan(0);
  });

  test.describe('known defects', () => {
    test.fail('does not mark a race that never started as won when the current race was cancelled', async ({ api, mqttPublisher, mqttListener, exclusiveRaceState }) => {
      // Defect: the winner goes to "the current race", which falls back to the
      // last LISTED race when none is active. With a race waiting behind the
      // cancelled one, a finish message marks that waiting race as won.
      const { show, race: cancelled } = await racing(api, mqttListener);
      const waiting = await api.createCompleteRace(show);
      await api.setRaceState(cancelled, 'CANCELED');
      await restarted(mqttListener, cancelled, 'CANCELED');

      await mqttPublisher.publishBikeFinished('1', 5);
      await pause(NO_WINNER_WAIT_MS);

      expect(await api.getRace(cancelled)).toMatchObject({ raceState: 'CANCELED' });
      expect(await api.getRace(waiting)).toMatchObject({ raceState: 'LISTED', bikeWon: 0 });
    });
  });
});
