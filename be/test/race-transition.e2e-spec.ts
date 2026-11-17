/**
 * e2e test for POST /api/race/:id/transition against a real database: the
 * race and its show move together, only from a state the action fits, and
 * concurrent requests are judged one after the other.
 *
 * Entering an active race/show state resets every other active one in the
 * whole database (that is the application's rule), so only ever run this
 * suite against a disposable database, like the other e2e suites.
 */
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { RaceState, ShowState } from "@prisma/client";
import { RaceModule } from "../src/race/race.module";
import { PrismaService } from "../src/prisma-api/prisma.service";

describe("Race transitions (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = Date.now();
  let showId: number;
  let otherShowId: number;
  let raceId: number;
  let otherRaceId: number;

  const post = (id: number | string, action: unknown) =>
    request(app.getHttpServer())
      .post(`/api/race/${id}/transition`)
      .send({ action });
  const stored = () => prisma.race.findUniqueOrThrow({ where: { id: raceId } });
  const storedShow = () =>
    prisma.show.findUniqueOrThrow({ where: { id: showId } });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RaceModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get(PrismaService);

    showId = (
      await prisma.show.create({
        data: {
          name: `Transition Show ${suffix}`,
          active: true,
          showState: ShowState.BEFORE_RACE,
        },
      })
    ).id;
    otherShowId = (
      await prisma.show.create({ data: { name: `Other Show ${suffix}` } })
    ).id;
    raceId = (
      await prisma.race.create({
        data: { showId, orderNumber: 0, raceState: RaceState.LISTED },
      })
    ).id;
    otherRaceId = (
      await prisma.race.create({
        data: {
          showId: otherShowId,
          orderNumber: 0,
          raceState: RaceState.LISTED,
        },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma.show.deleteMany({
      where: { id: { in: [showId, otherShowId] } },
    });
    await app.close();
  });

  it("walks a race through countdown, start and stop, moving the show with it", async () => {
    const countdown = await post(raceId, "countdown").expect(201);
    expect(countdown.body.race).toMatchObject({
      id: raceId,
      raceState: "WAITING_TO_RACE",
    });
    expect(countdown.body.show).toMatchObject({
      id: showId,
      showState: "RACE",
    });

    const start = await post(raceId, "start").expect(201);
    expect(start.body.race).toMatchObject({ raceState: "RACING" });
    expect(start.body.race.raceStartedAt).toEqual(expect.any(String));
    expect(await stored()).toMatchObject({ raceState: RaceState.RACING });
    expect(await storedShow()).toMatchObject({ showState: ShowState.RACE });

    const stop = await post(raceId, "stop").expect(201);
    expect(stop.body.race).toMatchObject({ raceState: "LISTED" });
    expect(stop.body.show).toMatchObject({ showState: "BEFORE_RACE" });
  });

  it("returns the race with its songs", async () => {
    const response = await post(raceId, "countdown").expect(201);

    expect(response.body.race).toHaveProperty("song1");
    expect(response.body.race).toHaveProperty("song2");

    await post(raceId, "stop").expect(201);
  });

  it("answers 409 and changes neither race nor show when the action does not fit", async () => {
    const response = await post(raceId, "stop").expect(409);

    expect(response.body.message).toBe('Cannot "stop" a race that is LISTED');
    expect(await stored()).toMatchObject({ raceState: RaceState.LISTED });
    expect(await storedShow()).toMatchObject({
      showState: ShowState.BEFORE_RACE,
    });
  });

  it("answers 404 for an unknown race, 400 for an unknown action or a bad id", async () => {
    await post(2147483647, "start").expect(404);
    await post(raceId, "explode").expect(400);
    await post(raceId, undefined).expect(400);
    await post("abc", "start").expect(400);
  });

  it("resets the active race of another show when this one becomes active", async () => {
    await post(otherRaceId, "countdown").expect(201);

    await post(raceId, "countdown").expect(201);

    expect(
      await prisma.race.findUniqueOrThrow({ where: { id: otherRaceId } }),
    ).toMatchObject({ raceState: RaceState.LISTED });
    expect(await stored()).toMatchObject({
      raceState: RaceState.WAITING_TO_RACE,
    });

    await post(raceId, "stop").expect(201);
  });

  it("judges two concurrent requests one after the other: only one of two starts wins", async () => {
    await post(raceId, "countdown").expect(201);

    const statuses = (
      await Promise.all([post(raceId, "start"), post(raceId, "start")])
    )
      .map((response) => response.status)
      .sort();

    expect(statuses).toEqual([201, 409]);
    expect(await stored()).toMatchObject({ raceState: RaceState.RACING });

    await post(raceId, "stop").expect(201);
  });
});
