/**
 * Verifies the song statistics SQL against a real Postgres. Mocked unit tests
 * cannot catch the bugs this covers (songs that are only ever picked by
 * person 2 vanishing from the rankings). Needs DATABASE_URL pointing at a
 * disposable database, like the other e2e suites.
 */
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../src/prisma-api/prisma.service";
import { StatsService } from "../src/prisma-api/stats.service";

describe("StatsService song statistics (e2e)", () => {
  let prisma: PrismaService;
  let stats: StatsService;
  const suffix = Date.now();
  const artist = `Stats Artist ${suffix}`;

  let showId: number;
  const songIds: Record<string, number> = {};

  const own = <T extends { artist: string }>(rows: T[]) =>
    rows.filter((row) => row.artist === artist);

  async function createSong(
    key: string,
    overrides: { selectable?: boolean; deleted?: boolean } = {},
  ) {
    const song = await prisma.song.create({
      data: { artist, name: `${key} ${suffix}`, ...overrides },
    });
    songIds[key] = song.id;
  }

  let nextOrder = 0;
  const race = (
    song1: string | undefined,
    song2: string | undefined,
    raced: boolean,
  ) =>
    prisma.race.create({
      data: {
        showId,
        orderNumber: nextOrder++,
        raced,
        song1Id: song1 ? songIds[song1] : undefined,
        song2Id: song2 ? songIds[song2] : undefined,
      },
    });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, StatsService],
    }).compile();
    prisma = moduleFixture.get(PrismaService);
    await prisma.onModuleInit();
    stats = moduleFixture.get(StatsService);

    showId = (
      await prisma.show.create({ data: { name: `Stats Show ${suffix}` } })
    ).id;

    await createSong("only1");
    await createSong("only2"); // only ever picked by person 2
    await createSong("both"); // picked by person 1 and person 2
    await createSong("unraced"); // only in races that did not happen yet
    await createSong("never");
    await createSong("neverUnselectable", { selectable: false });
    await createSong("neverDeleted", { deleted: true });

    await race("only1", "both", true);
    await race("both", "only2", true);
    await race("both", "only2", true);
    await race("unraced", "only2", false);
  });

  afterAll(async () => {
    await prisma.race.deleteMany({ where: { showId } });
    await prisma.show.delete({ where: { id: showId } });
    await prisma.song.deleteMany({ where: { artist } });
    await prisma.onModuleDestroy();
  });

  describe("mostPlayedSongs", () => {
    it("counts every raced pick, whether the song was picked as song 1 or song 2", async () => {
      const rows = own(await stats.mostPlayedSongs(1000));

      expect(rows.map((r) => [r.name, r.totalCount])).toEqual([
        [`both ${suffix}`, 3],
        [`only2 ${suffix}`, 2],
        [`only1 ${suffix}`, 1],
      ]);
    });

    it("lists a song that was only ever picked as song 2", async () => {
      const names = own(await stats.mostPlayedSongs(1000)).map((r) => r.name);

      expect(names).toContain(`only2 ${suffix}`);
    });

    it("ignores races that were not raced", async () => {
      const names = own(await stats.mostPlayedSongs(1000)).map((r) => r.name);

      expect(names).not.toContain(`unraced ${suffix}`);
    });

    it("limits the result", async () => {
      expect(await stats.mostPlayedSongs(1)).toHaveLength(1);
    });
  });

  describe("mostWishedSongs", () => {
    it("counts every pick, raced or not, from both positions", async () => {
      const rows = own(await stats.mostWishedSongs(1000));

      expect(rows.map((r) => [r.name, r.totalCount])).toEqual([
        [`both ${suffix}`, 3],
        [`only2 ${suffix}`, 3],
        [`only1 ${suffix}`, 1],
        [`unraced ${suffix}`, 1],
      ]);
    });

    it("limits the result", async () => {
      expect(await stats.mostWishedSongs(2)).toHaveLength(2);
    });
  });

  describe("neverWishedSongs", () => {
    it("lists only selectable, non-deleted songs that nobody ever picked", async () => {
      const names = own(await stats.neverWishedSongs()).map((r) => r.name);

      expect(names).toEqual([`never ${suffix}`]);
    });

    it("does not list a song that was only ever picked as song 2", async () => {
      const names = own(await stats.neverWishedSongs()).map((r) => r.name);

      expect(names).not.toContain(`only2 ${suffix}`);
    });
  });
});
