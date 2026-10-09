import { expect } from '@playwright/test';
import * as mqtt from 'mqtt';
import { test, uniqueName, createApi, acquireLock, MQTT_TCP_URL, BACKEND_URL } from '../fixtures';

/**
 * Self-test for the shared fixtures in ../fixtures. The regression specs
 * build on them, so a broken seeding or publishing helper should fail here,
 * with a clear message, rather than as a confusing failure in a scenario.
 */

test.describe('uniqueName', () => {
  test('keeps the prefix and never repeats, even within the same millisecond', () => {
    const names = Array.from({ length: 1000 }, () => uniqueName('E2E Thing'));

    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      expect(name.startsWith('E2E Thing ')).toBe(true);
    }
  });

  test('adds only letters, digits and spaces, so the name survives file-name parsing', () => {
    // The song file sync reads "<artist> - <name>.mp3" and mangles hyphens
    // inside either part, so the suffix must not contain any.
    expect(uniqueName('E2E Thing')).toMatch(/^E2E Thing [A-Za-z0-9]+$/);
  });
});

test.describe('cross-worker lock', () => {
  test('lets only one holder in at a time and hands over on release', async () => {
    const name = uniqueName('e2e-lock-handover').replace(/ /g, '-');
    const events: string[] = [];

    const releaseFirst = await acquireLock(name);
    const second = acquireLock(name, { pollMs: 10 }).then((release) => {
      events.push('second acquired');
      return release;
    });

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(events).toEqual([]);

    await releaseFirst();
    const releaseSecond = await second;
    expect(events).toEqual(['second acquired']);
    await releaseSecond();
  });

  test('takes over a lock whose holder never released it', async () => {
    const name = uniqueName('e2e-lock-stale').replace(/ /g, '-');
    await acquireLock(name); // never released, as after a killed worker

    const release = await acquireLock(name, { pollMs: 10, staleMs: 100 });

    await release();
  });

  test('gives up with a clear error after the timeout', async () => {
    const name = uniqueName('e2e-lock-timeout').replace(/ /g, '-');
    const release = await acquireLock(name);

    await expect(acquireLock(name, { pollMs: 10, timeoutMs: 100 })).rejects.toThrow(/timed out waiting for lock/);

    await release();
  });
});

test.describe('api seeding', () => {
  test('creates a show, songs and a race that reference each other', async ({ api }) => {
    const show = await api.createShow();
    const song1 = await api.createSong();
    const song2 = await api.createSong();
    const race = await api.createRace(show, {
      person1: 'Rider One',
      song1,
      person2: 'Rider Two',
      song2,
    });

    expect(show.name).toContain('E2E Show');
    expect(race).toMatchObject({
      showId: show.id,
      person1: 'Rider One',
      person2: 'Rider Two',
      song1Id: song1.id,
      song2Id: song2.id,
    });
    expect(song1.name).not.toBe(song2.name);
  });

  test('derives the race state from the riders and songs, like the create-race form', async ({ api }) => {
    const show = await api.createShow();
    const song1 = await api.createSong();
    const song2 = await api.createSong();

    const complete = await api.createRace(show, { person1: 'A', song1, person2: 'B', song2 });
    const solo = await api.createRace(show, { person1: 'Solo', song1 });
    const noSongs = await api.createRace(show, { person1: 'A', person2: 'B' });
    const canceled = await api.createRace(show, { person1: 'A', person2: 'B', raceState: 'CANCELED' });

    expect(complete.raceState).toBe('LISTED');
    expect(solo.raceState).toBe('WAITING_FOR_OPPONENT');
    expect(noSongs.raceState).toBe('WAITING_FOR_OPPONENT');
    expect(canceled.raceState).toBe('CANCELED');
  });

  test('numbers the races of a show in creation order', async ({ api }) => {
    const show = await api.createShow();
    const first = await api.createRace(show);
    const second = await api.createRace(show);

    expect(second.orderNumber).toBe(first.orderNumber + 1);
  });

  test('marks a race as won through the REST API', async ({ api, exclusiveRaceState }) => {
    const show = await api.createShow();
    const race = await api.createRace(show, { person1: 'black', person2: 'white' });

    const won = await api.setWinner(race, 2);

    expect(won).toMatchObject({ id: race.id, bikeWon: 2, raceState: 'RACED', raced: true });
  });

  test('lets a name override the generated one', async ({ api }) => {
    const show = await api.createShow({ name: 'Fixed Show Name' });
    const song = await api.createSong({ name: 'Fixed Song', artist: 'Fixed Artist', selectable: true });

    expect(show.name).toBe('Fixed Show Name');
    expect(song).toMatchObject({ name: 'Fixed Song', artist: 'Fixed Artist', selectable: true });
  });

  test('cleanup removes everything the helper created, races before shows', async ({ request }) => {
    const api = createApi(request);
    const show = await api.createShow();
    const song = await api.createSong();
    const race = await api.createRace(show, { person1: 'Rider', song1: song });

    await api.cleanup();

    for (const path of [`race/${race.id}`, `show/${show.id}`, `song/${song.id}`]) {
      const response = await request.get(`${BACKEND_URL}/api/${path}`);
      // A missing entity comes back as an empty body rather than a 404.
      expect(await response.text(), path).toBe('');
    }
  });

  test('cleanup also removes a show (and its races) that was created outside the helper', async ({ request }) => {
    const api = createApi(request);
    const created = await request.post(`${BACKEND_URL}/api/show`, { data: { name: uniqueName('E2E Adopted Show') } });
    const { id } = await created.json();
    api.adoptShow(id);

    await api.cleanup();

    const response = await request.get(`${BACKEND_URL}/api/show/${id}`);
    expect(await response.text()).toBe('');
  });

  test('cleanup tolerates entities a test already deleted itself', async ({ request }) => {
    const api = createApi(request);
    const show = await api.createShow();
    await request.delete(`${BACKEND_URL}/api/show/${show.id}`);

    await expect(api.cleanup()).resolves.toBeUndefined();
  });
});

test.describe('mqtt publisher', () => {
  test('delivers a JSON message to a subscriber on the backend broker', async ({ mqttPublisher }) => {
    const topic = uniqueName('E2E/fixtures/json').replace(/ /g, '-');
    const subscriber = mqtt.connect(MQTT_TCP_URL);
    try {
      await new Promise<void>((resolve, reject) => {
        subscriber.once('error', reject);
        subscriber.once('connect', () => subscriber.subscribe(topic, (err) => (err ? reject(err) : resolve())));
      });
      const received = new Promise<string>((resolve) => subscriber.once('message', (_t, payload) => resolve(payload.toString())));

      await mqttPublisher.publish(topic, { hello: 'fixtures' });

      expect(JSON.parse(await received)).toEqual({ hello: 'fixtures' });
    } finally {
      subscriber.end(true);
    }
  });

  test('publishes bike status and state change messages in the shapes the broker expects', async ({ mqttPublisher }) => {
    const subscriber = mqtt.connect(MQTT_TCP_URL);
    try {
      const messages: Array<{ topic: string; body: unknown }> = [];
      await new Promise<void>((resolve, reject) => {
        subscriber.once('error', reject);
        subscriber.once('connect', () =>
          subscriber.subscribe(['Bike/+', 'RaceStateChange', 'ShowStateChange'], (err) => (err ? reject(err) : resolve())),
        );
      });
      subscriber.on('message', (topic, payload) => messages.push({ topic, body: JSON.parse(payload.toString()) }));

      await mqttPublisher.publishBikeStatus('1', { pulsecount: 10, sequenz: 3, timestamp: 4 });
      await mqttPublisher.publishRaceStateChange(7, 'RACING');
      await mqttPublisher.publishShowStateChange(9, 'RACE_FINISHED');

      await expect.poll(() => messages.length, { timeout: 10000 }).toBeGreaterThanOrEqual(3);
      // Other specs may publish too; only look at what this test sent.
      expect(messages).toEqual(
        expect.arrayContaining([
          { topic: 'Bike/1', body: { pulsecount: 10, sequenz: 3, timestamp: 4 } },
          { topic: 'RaceStateChange', body: { raceId: 7, state: 'RACING' } },
          { topic: 'ShowStateChange', body: { showId: 9, state: 'RACE_FINISHED' } },
        ]),
      );
    } finally {
      subscriber.end(true);
    }
  });
});
