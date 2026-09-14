/**
 * Full-lifecycle e2e test for the backend REST API: show -> races -> song ->
 * manipulate -> export -> delete -> import.
 *
 * The final step (`POST /api/import/database`) wipes every Show, Shift,
 * ShiftRole, Song, Race and User row and recreates them from the uploaded
 * export (see src/import/import.service.ts) — that is how the real endpoint
 * works, not a test artifact. Only ever run this suite against a disposable
 * database (e.g. the Postgres started by docker-compose.e2e.yml), never
 * against a database that holds real show data.
 *
 * This only wires up the REST feature modules under test, not the full
 * AppModule — in particular it skips MqttModule, which pulls in the
 * ESM-only `aedes` package that Jest's CommonJS transform can't load, and
 * which has nothing to do with the REST API.
 */
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { ShowModule } from "../src/show/show.module";
import { RaceModule } from "../src/race/race.module";
import { SongModule } from "../src/song/song.module";
import { ExportModule } from "../src/export/export.module";
import { ImportModule } from "../src/import/import.module";
import { RaceState } from "../src/race/race-state.enum";
import { DatabaseExport } from "../src/export/export.types";

describe("Backend REST API lifecycle (e2e)", () => {
  let app: INestApplication;
  const uniqueSuffix = Date.now();
  const showName = `E2E Lifecycle Show ${uniqueSuffix}`;
  const songName = `E2E Lifecycle Song ${uniqueSuffix}`;

  let showId: number;
  let race1Id: number;
  let race2Id: number;
  let songId: number;
  let exportSnapshot: DatabaseExport;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ShowModule, RaceModule, SongModule, ExportModule, ImportModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // Best-effort cleanup: the import step (further down) resurrects
    // showId/race*Id/songId with their original data, so remove them again
    // to leave the database as it was before this suite ran.
    if (showId) {
      await request(app.getHttpServer()).delete(`/api/show/${showId}`);
    }
    if (songId) {
      await request(app.getHttpServer()).delete(`/api/song/${songId}`);
    }
    await app.close();
  });

  it("creates a new show", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/show")
      .send({ name: showName })
      .expect(201);

    expect(response.body).toMatchObject({ name: showName, active: false });
    expect(response.body.id).toEqual(expect.any(Number));
    showId = response.body.id;
  });

  it("adds races to the show", async () => {
    const race1 = await request(app.getHttpServer())
      .post("/api/race")
      .send({ showId, person1: "Alice", person2: "Bob" })
      .expect(201);
    expect(race1.body).toMatchObject({
      showId,
      person1: "Alice",
      person2: "Bob",
      orderNumber: 0,
    });
    race1Id = race1.body.id;

    const race2 = await request(app.getHttpServer())
      .post("/api/race")
      .send({ showId, person1: "Carl", person2: "Dora" })
      .expect(201);
    expect(race2.body).toMatchObject({
      showId,
      person1: "Carl",
      person2: "Dora",
      orderNumber: 1,
    });
    race2Id = race2.body.id;

    const racesForShow = await request(app.getHttpServer())
      .get(`/api/race/for-show/${showId}/all`)
      .expect(200);
    expect(racesForShow.body.map((race: { id: number }) => race.id).sort()).toEqual(
      [race1Id, race2Id].sort(),
    );
  });

  it("adds a song", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/song")
      .send({ name: songName, artist: "E2E Artist" })
      .expect(201);

    expect(response.body).toMatchObject({
      name: songName,
      artist: "E2E Artist",
      deleted: false,
    });
    songId = response.body.id;
  });

  it("manipulates the races (assigns the song and reorders them)", async () => {
    // The race update endpoint always tries to (re)connect the race's show,
    // so `showId` must be included even when only other fields change.
    const updated = await request(app.getHttpServer())
      .patch(`/api/race/${race1Id}`)
      .send({ showId, song1Id: songId, person1: "Alice" })
      .expect(200);
    expect(updated.body).toMatchObject({ song1Id: songId, raceState: RaceState.LISTED });

    const beforeMove = await request(app.getHttpServer()).get(`/api/race/${race2Id}`);
    expect(beforeMove.body.orderNumber).toBe(1);

    await request(app.getHttpServer()).patch(`/api/race/${race2Id}/up`).expect(200);

    const race1AfterMove = await request(app.getHttpServer()).get(`/api/race/${race1Id}`);
    const race2AfterMove = await request(app.getHttpServer()).get(`/api/race/${race2Id}`);
    expect(race2AfterMove.body.orderNumber).toBe(0);
    expect(race1AfterMove.body.orderNumber).toBe(1);
  });

  it("manipulates the show", async () => {
    const updated = await request(app.getHttpServer())
      .patch(`/api/show/${showId}`)
      .send({ finished: true, showState: "SHOW_FINISHED" })
      .expect(200);

    expect(updated.body).toMatchObject({
      id: showId,
      finished: true,
      showState: "SHOW_FINISHED",
    });
  });

  it("exports the data", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/export/database")
      .expect(200);

    exportSnapshot = response.body;
    expect(exportSnapshot.formatVersion).toBe(1);
    expect(exportSnapshot.shows.map((show) => show.id)).toContain(showId);
    expect(exportSnapshot.songs.map((song) => song.id)).toContain(songId);
    expect(exportSnapshot.races.map((race) => race.id)).toEqual(
      expect.arrayContaining([race1Id, race2Id]),
    );
  });

  it("deletes the races", async () => {
    await request(app.getHttpServer()).delete(`/api/race/${race1Id}`).expect(200);
    await request(app.getHttpServer()).delete(`/api/race/${race2Id}`).expect(200);

    const race1AfterDelete = await request(app.getHttpServer()).get(`/api/race/${race1Id}`);
    const race2AfterDelete = await request(app.getHttpServer()).get(`/api/race/${race2Id}`);
    expect(race1AfterDelete.body).toEqual({});
    expect(race2AfterDelete.body).toEqual({});
  });

  it("deletes the show", async () => {
    await request(app.getHttpServer()).delete(`/api/show/${showId}`).expect(200);

    const showAfterDelete = await request(app.getHttpServer()).get(`/api/show/${showId}`);
    expect(showAfterDelete.body).toEqual({});
  });

  it("deletes the song", async () => {
    await request(app.getHttpServer()).delete(`/api/song/${songId}`).expect(200);

    const songAfterDelete = await request(app.getHttpServer()).get(`/api/song/${songId}`);
    expect(songAfterDelete.body).toEqual({});
  });

  it("imports the data, restoring the deleted show, races and song", async () => {
    await request(app.getHttpServer())
      .post("/api/import/database")
      .attach("file", Buffer.from(JSON.stringify(exportSnapshot)), "export.json")
      .expect(201);

    const restoredShow = await request(app.getHttpServer()).get(`/api/show/${showId}`);
    expect(restoredShow.body).toMatchObject({ id: showId, name: showName, finished: true });

    const restoredSong = await request(app.getHttpServer()).get(`/api/song/${songId}`);
    expect(restoredSong.body).toMatchObject({ id: songId, name: songName });

    const restoredRace1 = await request(app.getHttpServer()).get(`/api/race/${race1Id}`);
    const restoredRace2 = await request(app.getHttpServer()).get(`/api/race/${race2Id}`);
    expect(restoredRace1.body).toMatchObject({ id: race1Id, showId, song1Id: songId });
    expect(restoredRace2.body).toMatchObject({ id: race2Id, showId });

    // Bulk-importing rows with explicit ids must not leave the id sequence
    // behind — a plain create right after import should get a fresh id.
    const showAfterImport = await request(app.getHttpServer())
      .post("/api/show")
      .send({ name: `E2E Post-Import Show ${uniqueSuffix}` })
      .expect(201);
    expect(showAfterImport.body.id).toBeGreaterThan(showId);
    await request(app.getHttpServer()).delete(`/api/show/${showAfterImport.body.id}`);
  });
});
