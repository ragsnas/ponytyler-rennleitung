import { test, expect } from '@playwright/test';

/**
 * Exercises the backend REST API directly (bypassing the Angular frontend)
 * against the e2e docker-compose stack (see ../README.md and
 * ../../docker-compose.e2e.yml). The backend's REST API is published on
 * host port 3010 there (mapped from container port 3000), separate from the
 * frontend's baseURL configured in playwright.config.ts.
 *
 * Steps run in sequence and share state (ids created in one step are used
 * by later steps), mirroring the backend's own lifecycle e2e suite at
 * be/test/rest-api-lifecycle.e2e-spec.ts.
 */

const BACKEND_URL = 'http://localhost:3010';

test.describe.serial('Backend REST API lifecycle', () => {
  const uniqueSuffix = Date.now();
  const showName = `E2E API Show ${uniqueSuffix}`;
  const songName = `E2E API Song ${uniqueSuffix}`;

  let showId: number;
  let songId: number;
  let race1Id: number;
  let race2Id: number;

  test('creates a show', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/show`, {
      data: { name: showName },
    });
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toMatchObject({ name: showName, active: false });
    expect(body.id).toEqual(expect.any(Number));
    showId = body.id;
  });

  test('creates/adds a song', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/song`, {
      data: { name: songName, artist: 'E2E API Artist' },
    });
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toMatchObject({ name: songName, artist: 'E2E API Artist', deleted: false });
    songId = body.id;
  });

  test('creates a race for the show using the song', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/race`, {
      data: { showId, person1: 'Solo Rider', song1Id: songId },
    });
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toMatchObject({
      showId,
      person1: 'Solo Rider',
      song1Id: songId,
      orderNumber: 0,
    });
    race1Id = body.id;
  });

  test('updates the race', async ({ request }) => {
    // The race update endpoint always tries to (re)connect the race's show,
    // so showId must be included even when only other fields change.
    const response = await request.patch(`${BACKEND_URL}/api/race/${race1Id}`, {
      data: { showId, person1: 'Solo Rider Updated', song1Id: songId },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({ id: race1Id, person1: 'Solo Rider Updated', song1Id: songId });
  });

  test('creates another race for the show with two opponents ("black" & "white")', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/race`, {
      data: { showId, person1: 'black', person2: 'white' },
    });
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toMatchObject({
      showId,
      person1: 'black',
      person2: 'white',
      orderNumber: 1,
    });
    race2Id = body.id;
  });

  test('marks "black" as the winner of that race', async ({ request }) => {
    const response = await request.patch(`${BACKEND_URL}/api/race/${race2Id}`, {
      data: {
        showId,
        person1: 'black',
        person2: 'white',
        bikeWon: 1,
        raceState: 'RACED',
        raced: true,
      },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      id: race2Id,
      bikeWon: 1,
      raceState: 'RACED',
      raced: true,
    });
  });

  test('deletes all the races', async ({ request }) => {
    const deleteRace1 = await request.delete(`${BACKEND_URL}/api/race/${race1Id}`);
    expect(deleteRace1.status()).toBe(200);
    const deleteRace2 = await request.delete(`${BACKEND_URL}/api/race/${race2Id}`);
    expect(deleteRace2.status()).toBe(200);

    // A missing race is returned as an empty (null) body rather than a 404.
    const race1AfterDelete = await request.get(`${BACKEND_URL}/api/race/${race1Id}`);
    const race2AfterDelete = await request.get(`${BACKEND_URL}/api/race/${race2Id}`);
    expect(await race1AfterDelete.text()).toBe('');
    expect(await race2AfterDelete.text()).toBe('');
  });

  test('deletes the show', async ({ request }) => {
    const response = await request.delete(`${BACKEND_URL}/api/show/${showId}`);
    expect(response.status()).toBe(200);

    const showAfterDelete = await request.get(`${BACKEND_URL}/api/show/${showId}`);
    expect(await showAfterDelete.text()).toBe('');
  });

  test('deletes the song', async ({ request }) => {
    const response = await request.delete(`${BACKEND_URL}/api/song/${songId}`);
    expect(response.status()).toBe(200);

    const songAfterDelete = await request.get(`${BACKEND_URL}/api/song/${songId}`);
    expect(await songAfterDelete.text()).toBe('');
  });
});
