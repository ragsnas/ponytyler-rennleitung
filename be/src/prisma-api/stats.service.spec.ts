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
});
