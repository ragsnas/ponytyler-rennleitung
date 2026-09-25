import { Test, TestingModule } from "@nestjs/testing";
import { StatisticsController } from "./statistics.controller";
import { StatsService } from "../prisma-api/stats.service";

describe("StatisticsController", () => {
  let controller: StatisticsController;
  let mostPlayedSongsMock: jest.Mock;
  let mostWishedSongsMock: jest.Mock;
  let neverWishedSongsMock: jest.Mock;
  let whichBikeWonMostMock: jest.Mock;

  beforeEach(async () => {
    mostPlayedSongsMock = jest.fn();
    mostWishedSongsMock = jest.fn();
    neverWishedSongsMock = jest.fn();
    whichBikeWonMostMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        {
          provide: StatsService,
          useValue: {
            mostPlayedSongs: mostPlayedSongsMock,
            mostWishedSongs: mostWishedSongsMock,
            neverWishedSongs: neverWishedSongsMock,
            whichBikeWonMost: whichBikeWonMostMock,
          },
        },
      ],
    }).compile();

    controller = module.get<StatisticsController>(StatisticsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("mostPlayedSongs delegates to the StatsService", async () => {
    const rows = [{ artist: "Artist", name: "Song", totalCount: 3 }];
    mostPlayedSongsMock.mockResolvedValue(rows);

    await expect(controller.mostPlayedSongs()).resolves.toEqual(rows);
    expect(mostPlayedSongsMock).toHaveBeenCalled();
  });

  it("mostWishedSongs delegates to the StatsService", async () => {
    const rows = [{ artist: "Artist", name: "Song", totalCount: 3 }];
    mostWishedSongsMock.mockResolvedValue(rows);

    await expect(controller.mostWishedSongs()).resolves.toEqual(rows);
    expect(mostWishedSongsMock).toHaveBeenCalled();
  });

  it("neverWishedSongs delegates to the StatsService", async () => {
    const rows = [{ artist: "Artist", name: "Song" }];
    neverWishedSongsMock.mockResolvedValue(rows);

    await expect(controller.neverWishedSongs()).resolves.toEqual(rows);
    expect(neverWishedSongsMock).toHaveBeenCalled();
  });

  it("whichBikeWonMost delegates to the StatsService", async () => {
    const rows = [{ bikeWon: 1, timesWon: 5 }];
    whichBikeWonMostMock.mockResolvedValue(rows);

    await expect(controller.whichBikeWonMost()).resolves.toEqual(rows);
    expect(whichBikeWonMostMock).toHaveBeenCalled();
  });
});
