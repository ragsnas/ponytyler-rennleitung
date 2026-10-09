import { Test, TestingModule } from "@nestjs/testing";
import { StatsService } from "./stats.service";
import { PrismaService } from "./prisma.service";

describe("StatsService", () => {
  let service: StatsService;
  let queryRawMock: jest.Mock;

  beforeEach(async () => {
    queryRawMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: PrismaService, useValue: { $queryRaw: queryRawMock } },
      ],
    }).compile();

    service = module.get(StatsService);
  });

  it("mostWishedSongs returns the songs from the database", async () => {
    const rows = [{ artist: "Artist", name: "Song", totalCount: 3 }];
    queryRawMock.mockResolvedValue(rows);

    await expect(service.mostWishedSongs()).resolves.toEqual(rows);
    expect(queryRawMock).toHaveBeenCalledTimes(1);
  });

  it("neverWishedSongs returns the songs from the database", async () => {
    const rows = [{ artist: "Artist", name: "Song" }];
    queryRawMock.mockResolvedValue(rows);

    await expect(service.neverWishedSongs()).resolves.toEqual(rows);
    expect(queryRawMock).toHaveBeenCalledTimes(1);
  });

  it("whichBikeWonMost returns the bike win counts from the database", async () => {
    const rows = [{ bikeWon: 1, timesWon: 5 }];
    queryRawMock.mockResolvedValue(rows);

    await expect(service.whichBikeWonMost()).resolves.toEqual(rows);
    expect(queryRawMock).toHaveBeenCalledTimes(1);
  });

  it("limits the top lists to 100 rows by default", async () => {
    queryRawMock.mockResolvedValue([]);

    await service.mostPlayedSongs();
    await service.mostWishedSongs();

    for (const [query] of queryRawMock.mock.calls) {
      expect(query.values).toContain(100);
    }
  });

  it("passes an explicit limit on to the query", async () => {
    queryRawMock.mockResolvedValue([]);

    await service.mostPlayedSongs(5);

    expect(queryRawMock.mock.calls[0][0].values).toContain(5);
  });
});
