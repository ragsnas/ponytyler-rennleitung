import { expect } from '@playwright/test';
import * as mqtt from 'mqtt';
import { test, uniqueName, distinctName, createApi, acquireLock, MQTT_TCP_URL, BACKEND_URL } from '../fixtures';

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

test.describe('distinctName', () => {
  const editDistance = (a: string, b: string): number => {
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const current = [i];
      for (let j = 1; j <= b.length; j++) {
        current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      previous = current;
    }
    return previous[b.length];
  };

  test('keeps any two names far apart in edit distance, unlike the counter-based uniqueName', () => {
    const names = Array.from({ length: 200 }, () => distinctName('E2E Far'));

    let closest = Infinity;
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        closest = Math.min(closest, editDistance(names[i], names[j]));
      }
    }
    // The duplicates page lists pairs up to distance 6 by default.
    expect(closest).toBeGreaterThan(6);
    expect(names.every((name) => name.startsWith('E2E Far '))).toBe(true);
    expect(names.every((name) => /^[A-Za-z0-9 ]+$/.test(name))).toBe(true);
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

  test('lets only one of many waiters take over a stale lock', async () => {
    // The window is narrow, so many rounds, each with a freshly abandoned lock.
    let maxHolders = 0;
    for (let round = 0; round < 40; round++) {
      const name = uniqueName('e2e-lock-stale-race').replace(/ /g, '-');
      await acquireLock(name); // abandoned
      await new Promise((resolve) => setTimeout(resolve, 40));

      let holders = 0;
      await Promise.all(
        Array.from({ length: 8 }, async () => {
          const release = await acquireLock(name, { pollMs: 1, staleMs: 30 });
          holders += 1;
          maxHolders = Math.max(maxHolders, holders);
          await new Promise((resolve) => setTimeout(resolve, 8)); // held shorter than staleMs
          holders -= 1;
          await release();
        }),
      );
    }

    expect(maxHolders).toBe(1);
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

  test('cleanup also removes songs created outside the helper, found by artist', async ({ request }) => {
    const api = createApi(request);
    const artist = uniqueName('E2E Adopted Artist');
    for (const name of ['One', 'Two']) {
      await request.post(`${BACKEND_URL}/api/song`, { data: { name, artist } });
    }
    const bystander = await api.createSong();

    const adopted = await api.adoptSongsByArtist(artist);
    expect(adopted.map((song) => song.name).sort()).toEqual(['One', 'Two']);
    await api.cleanup();

    const songs: Array<{ artist: string }> = await (await request.get(`${BACKEND_URL}/api/song`)).json();
    expect(songs.filter((song) => song.artist === artist)).toEqual([]);
    expect(bystander.id).toBeGreaterThan(0);
  });

  test('cleanup tolerates entities a test already deleted itself', async ({ request }) => {
    const api = createApi(request);
    const show = await api.createShow();
    await request.delete(`${BACKEND_URL}/api/show/${show.id}`);

    await expect(api.cleanup()).resolves.toBeUndefined();
  });
});

test.describe('show and race states', () => {
  test('startShow makes a show the only live one, whatever was live before', async ({ api, request, exclusiveRaceState }) => {
    const first = await api.createShow();
    const second = await api.createShow();

    await api.startShow(first);
    await api.startShow(second);

    const live: Array<{ id: number; showState: string }> = await (await request.get(`${BACKEND_URL}/api/show/current-shows`)).json();
    expect(live.map((show) => show.id)).toEqual([second.id]);
    expect(live[0].showState).toBe('BEFORE_RACE');
  });

  test('state changes survive other shows being deleted at that very moment', async ({ api, request, exclusiveRaceState }) => {
    // The backend lists every show in an active state (every new show is one)
    // to reset it, and fails the whole update if one of them is deleted meanwhile.
    const show = await api.createShow();

    for (let i = 0; i < 40; i++) {
      const other = await (await request.post(`${BACKEND_URL}/api/show`, { data: { name: uniqueName('E2E Vanishing Show') } })).json();
      await Promise.all([api.setShowState(show, i % 2 ? 'RACE' : 'BEFORE_RACE'), request.delete(`${BACKEND_URL}/api/show/${other.id}`)]);
    }

    expect(await api.getShow(show)).toMatchObject({ showState: 'RACE' });
  });

  test('startShow can start a show in another state', async ({ api, request, exclusiveRaceState }) => {
    const show = await api.createShow();

    await api.startShow(show, 'RACE');

    expect(await api.getShow(show)).toMatchObject({ active: true, showState: 'RACE' });
  });

  test('setRaceState sends the stored riders and songs like the UI does, so a complete race stays LISTED', async ({ api, exclusiveRaceState }) => {
    const show = await api.createShow();
    const race = await api.createCompleteRace(show);

    await api.setRaceState(race, 'CANCELED');
    const relisted = await api.setRaceState(race, 'LISTED');

    expect(relisted.raceState).toBe('LISTED');
  });

  test('stopAllShows leaves no live show', async ({ api, request, exclusiveRaceState }) => {
    await api.startShow(await api.createShow());

    await api.stopAllShows();

    const live = await (await request.get(`${BACKEND_URL}/api/show/current-shows`)).json();
    expect(live).toEqual([]);
  });

  test('createCompleteRace makes a LISTED race with both riders and songs', async ({ api }) => {
    const show = await api.createShow();

    const race = await api.createCompleteRace(show);

    expect(race).toMatchObject({ showId: show.id, raceState: 'LISTED' });
    expect(race.person1).toBeTruthy();
    expect(race.person2).toBeTruthy();
    expect(race.song1Id).toBeTruthy();
    expect(race.song2Id).toBeTruthy();
    expect(race.person1).not.toBe(race.person2);
  });

  test('setRaceState and setShowState change one state and return the stored entity', async ({ api, exclusiveRaceState }) => {
    const show = await api.createShow();
    const race = await api.createRace(show, { person1: 'A', person2: 'B', song1: await api.createSong(), song2: await api.createSong() });

    expect(await api.setShowState(show, 'BEFORE_RACE')).toMatchObject({ id: show.id, showState: 'BEFORE_RACE' });
    expect(await api.setRaceState(race, 'RACING')).toMatchObject({ id: race.id, raceState: 'RACING' });
    expect(await api.getRace(race)).toMatchObject({ raceState: 'RACING', person1: 'A', person2: 'B' });
  });
});

test.describe('mqtt listener', () => {
  test('records what is published and waits for a matching message', async ({ mqttListener, mqttPublisher }) => {
    const topic = 'E2E/fixtures/listener';
    const waiting = mqttListener.waitFor(topic, (body) => (body as { n: number }).n === 2);

    await mqttPublisher.publish(topic, { n: 1 });
    await mqttPublisher.publish(topic, { n: 2 });
    await mqttPublisher.publish(topic, 'not json');

    expect(await waiting).toEqual({ n: 2 });
    await expect.poll(() => mqttListener.messages(topic).map((m) => m.body)).toEqual([{ n: 1 }, { n: 2 }, 'not json']);
  });

  test('clear forgets what arrived so far, so a test can count only what comes after', async ({ mqttListener, mqttPublisher }) => {
    const topic = 'E2E/fixtures/listener-clear';
    await mqttPublisher.publish(topic, { before: true });
    await mqttListener.waitFor(topic);

    mqttListener.clear();
    expect(mqttListener.messages(topic)).toEqual([]);

    await mqttPublisher.publish(topic, { after: true });
    expect(await mqttListener.waitFor(topic)).toEqual({ after: true });
    expect(mqttListener.messages(topic)).toHaveLength(1);
  });

  test('sees the state changes the backend announces for REST updates', async ({ api, mqttListener, exclusiveRaceState }) => {
    const show = await api.createShow();
    const race = await api.createRace(show, { person1: 'A', person2: 'B', song1: await api.createSong(), song2: await api.createSong() });

    await api.setRaceState(race, 'CANCELED');
    await api.setShowState(show, 'BEFORE_RACE');

    expect(await mqttListener.waitFor('RaceStateChange', (body) => (body as { raceId: string }).raceId === String(race.id))).toEqual({
      raceId: String(race.id),
      state: 'CANCELED',
    });
    expect(await mqttListener.waitFor('ShowStateChange', (body) => (body as { showId: string }).showId === String(show.id))).toEqual({
      showId: String(show.id),
      state: 'BEFORE_RACE',
    });
  });

  test('fails with a readable error when nothing matching arrives', async ({ mqttListener }) => {
    await expect(mqttListener.waitFor('E2E/fixtures/never', undefined, 200)).rejects.toThrow(/E2E\/fixtures\/never.*within 200ms/);
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
