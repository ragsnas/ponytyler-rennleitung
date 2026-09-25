import { Test, TestingModule } from "@nestjs/testing";
import { firstValueFrom, of } from "rxjs";
import { RaceController } from "./race.controller";
import { RaceService } from "../prisma-api/race.service";
import { ShowService } from "../prisma-api/show.service";
import { RaceState } from "./race-state.enum";

describe("RaceController", () => {
  let controller: RaceController;
  let createRaceMock: jest.Mock;
  let racesMock: jest.Mock;
  let currentRaceMock: jest.Mock;
  let upcomingRaceWithSongsMock: jest.Mock;
  let upcomingRacesWithSongsMock: jest.Mock;
  let raceMock: jest.Mock;
  let raceWithSongsMock: jest.Mock;
  let moveRacePositionMock: jest.Mock;
  let updateRaceMock: jest.Mock;
  let deleteRaceMock: jest.Mock;
  let showsMock: jest.Mock;

  beforeEach(async () => {
    createRaceMock = jest.fn();
    racesMock = jest.fn();
    currentRaceMock = jest.fn();
    upcomingRaceWithSongsMock = jest.fn();
    upcomingRacesWithSongsMock = jest.fn();
    raceMock = jest.fn();
    raceWithSongsMock = jest.fn();
    moveRacePositionMock = jest.fn();
    updateRaceMock = jest.fn();
    deleteRaceMock = jest.fn();
    showsMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RaceController],
      providers: [
        {
          provide: RaceService,
          useValue: {
            createRace: createRaceMock,
            races: racesMock,
            currentRace: currentRaceMock,
            upcomingRaceWithSongs: upcomingRaceWithSongsMock,
            upcomingRacesWithSongs: upcomingRacesWithSongsMock,
            race: raceMock,
            raceWithSongs: raceWithSongsMock,
            moveRacePosition: moveRacePositionMock,
            updateRace: updateRaceMock,
            deleteRace: deleteRaceMock,
          },
        },
        {
          provide: ShowService,
          useValue: { shows: showsMock },
        },
      ],
    }).compile();

    controller = module.get(RaceController);
  });

  it("delegates creation to the RaceService", () => {
    const data = { showId: 1, orderNumber: 1 };

    controller.create(data as any);

    expect(createRaceMock).toHaveBeenCalledWith(data);
  });

  describe("findRacesForShow", () => {
    it("filters for raced races, ordered descending, when raced is truthy", () => {
      controller.findRacesForShow("5", "true");

      expect(racesMock).toHaveBeenCalledWith({
        where: {
          showId: 5,
          raceState: { equals: RaceState.RACED },
        },
        orderBy: { orderNumber: "desc" },
      });
    });

    it("filters for non-raced races, ordered ascending, when raced is falsy", () => {
      controller.findRacesForShow("5", undefined as any);

      expect(racesMock).toHaveBeenCalledWith({
        where: {
          showId: 5,
          raceState: { not: { equals: RaceState.RACED } },
        },
        orderBy: { orderNumber: "asc" },
      });
    });
  });

  it("finds all races for a show ordered ascending", () => {
    controller.findAllRacesForShow("7");

    expect(racesMock).toHaveBeenCalledWith({
      where: { showId: 7 },
      orderBy: { orderNumber: "asc" },
    });
  });

  it("finds all races with no filter", () => {
    controller.findRaces();

    expect(racesMock).toHaveBeenCalledWith({});
  });

  describe("calculateAverageRacesPerHour", () => {
    it("computes races per hour from raced races and finished show durations", async () => {
      racesMock.mockReturnValue(
        of([{ bikeWon: 3 }, { bikeWon: 1 }, { bikeWon: 2 }]),
      );
      showsMock.mockReturnValue(of([{ duration: 30 }, { duration: 30 }]));

      const result = await firstValueFrom(
        controller.calculateAverageRacesPerHour(),
      );

      expect(result).toBe(4);
      expect(racesMock).toHaveBeenCalledWith({
        where: {
          raceState: { equals: RaceState.RACED },
          show: { finished: { equals: true } },
        },
      });
      expect(showsMock).toHaveBeenCalledWith({
        where: { finished: { equals: true } },
      });
    });
  });

  it("finds the current race for a show", () => {
    controller.findCurrentRace("9");

    expect(currentRaceMock).toHaveBeenCalledWith(9);
  });

  it("delegates finding the upcoming race with songs to the RaceService", () => {
    controller.findUpcomingRaceWithSongs();

    expect(upcomingRaceWithSongsMock).toHaveBeenCalledWith();
  });

  it("delegates finding the upcoming races with songs to the RaceService", () => {
    controller.findUpcomingRacesWithSongs();

    expect(upcomingRacesWithSongsMock).toHaveBeenCalledWith();
  });

  it("finds one race by numeric id", () => {
    controller.findOne("3");

    expect(raceMock).toHaveBeenCalledWith({ id: 3 });
  });

  it("finds one race with songs by the raw id", () => {
    controller.findOneWithSongs("3");

    expect(raceWithSongsMock).toHaveBeenCalledWith("3");
  });

  it("moves a race up or down", async () => {
    await controller.moveRaceUpOrDown("3", "up");

    expect(moveRacePositionMock).toHaveBeenCalledWith({
      raceToMoveId: "3",
      upOrDown: "up",
    });
  });

  it("updates a race", () => {
    const data = { orderNumber: 2 };

    controller.update("3", data as any);

    expect(updateRaceMock).toHaveBeenCalledWith({
      where: { id: 3 },
      data,
    });
  });

  it("removes a race", () => {
    controller.remove("3");

    expect(deleteRaceMock).toHaveBeenCalledWith({ id: 3 });
  });
});
