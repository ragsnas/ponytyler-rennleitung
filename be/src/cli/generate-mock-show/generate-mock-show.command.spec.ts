import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException } from "@nestjs/common";
import { ShowState } from "@prisma/client";
import { GenerateMockShowCommand } from "./generate-mock-show.command";
import { SongSyncService } from "../../cron/song-sync/song-sync.service";
import { SongService } from "../../prisma-api/song.service";
import { ShowService } from "../../prisma-api/show.service";
import { RaceService } from "../../prisma-api/race.service";
import * as randomNameUtil from "./random-name.util";

describe("GenerateMockShowCommand", () => {
  let command: GenerateMockShowCommand;

  let triggerSyncMock: jest.Mock;
  let updateSelectabilityMock: jest.Mock;
  let songsMock: jest.Mock;
  let createShowMock: jest.Mock;
  let createRaceMock: jest.Mock;

  const selectableSongs = [
    {
      id: 1,
      name: "Song A",
      artist: "Artist A",
      selectable: true,
      deleted: false,
    },
    {
      id: 2,
      name: "Song B",
      artist: "Artist B",
      selectable: true,
      deleted: false,
    },
    {
      id: 3,
      name: "Song C",
      artist: "Artist C",
      selectable: true,
      deleted: false,
    },
  ];

  beforeEach(async () => {
    triggerSyncMock = jest.fn().mockResolvedValue(undefined);
    updateSelectabilityMock = jest.fn().mockResolvedValue(undefined);
    songsMock = jest.fn().mockResolvedValue(selectableSongs);
    createShowMock = jest
      .fn()
      .mockImplementation(({ name }) =>
        Promise.resolve({ id: 42, name, showState: ShowState.BEFORE_SHOW }),
      );
    let nextRaceId = 1;
    createRaceMock = jest
      .fn()
      .mockImplementation((data) =>
        Promise.resolve({ id: nextRaceId++, ...data }),
      );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateMockShowCommand,
        {
          provide: SongSyncService,
          useValue: {
            triggerSync: triggerSyncMock,
            updateSelectability: updateSelectabilityMock,
          },
        },
        { provide: SongService, useValue: { songs: songsMock } },
        { provide: ShowService, useValue: { createShow: createShowMock } },
        { provide: RaceService, useValue: { createRace: createRaceMock } },
      ],
    }).compile();

    command = module.get(GenerateMockShowCommand);
  });

  it("syncs songs and updates selectability before doing anything else", async () => {
    await command.run();

    expect(triggerSyncMock).toHaveBeenCalled();
    expect(updateSelectabilityMock).toHaveBeenCalled();
  });

  it("continues when a sync is already in progress", async () => {
    triggerSyncMock.mockRejectedValue(new ConflictException());

    await expect(command.run()).resolves.toBeUndefined();
    expect(updateSelectabilityMock).toHaveBeenCalled();
    expect(createShowMock).toHaveBeenCalled();
  });

  it("continues when the song sync fails outright (e.g. no network)", async () => {
    triggerSyncMock.mockRejectedValue(new Error("network down"));
    updateSelectabilityMock.mockRejectedValue(new Error("network down"));

    await expect(command.run()).resolves.toBeUndefined();
    expect(createShowMock).toHaveBeenCalled();
  });

  it("creates a show with a generated, human-readable name", async () => {
    await command.run();

    expect(createShowMock).toHaveBeenCalledTimes(1);
    const [data] = createShowMock.mock.calls[0];
    expect(typeof data.name).toBe("string");
    expect(data.name.length).toBeGreaterThan(0);
    expect(data.showState).toBe(ShowState.BEFORE_SHOW);
  });

  it("retries with a new title when the generated name collides", async () => {
    createShowMock
      .mockRejectedValueOnce({ code: "P2002" })
      .mockImplementationOnce(({ name }) =>
        Promise.resolve({ id: 42, name, showState: ShowState.BEFORE_SHOW }),
      );

    await command.run();

    expect(createShowMock).toHaveBeenCalledTimes(2);
  });

  it("only queries non-deleted, selectable songs", async () => {
    await command.run();

    expect(songsMock).toHaveBeenCalledWith({
      where: { deleted: false, selectable: true },
    });
  });

  it("creates exactly 20 races for the newly created show", async () => {
    await command.run();

    expect(createRaceMock).toHaveBeenCalledTimes(20);
    for (const [data] of createRaceMock.mock.calls) {
      expect(data.showId).toBe(42);
    }
  });

  it("gives every race two distinct existing songs and human-readable racer names", async () => {
    await command.run();

    const validIds = new Set(selectableSongs.map((song) => song.id));
    for (const [data] of createRaceMock.mock.calls) {
      expect(validIds.has(data.song1Id)).toBe(true);
      expect(validIds.has(data.song2Id)).toBe(true);
      expect(data.song1Id).not.toBe(data.song2Id);
      expect(typeof data.person1).toBe("string");
      expect(data.person1.length).toBeGreaterThan(0);
      expect(typeof data.person2).toBe("string");
      expect(data.person2.length).toBeGreaterThan(0);
    }
  });

  it("retries generating a racer name if both racers would get the same one", async () => {
    let callCount = 0;
    const scripted = ["Alex Nakamura", "Alex Nakamura", "Jordan Silva"];
    jest.spyOn(randomNameUtil, "generatePersonName").mockImplementation(() => {
      if (callCount < scripted.length) {
        return scripted[callCount++];
      }
      callCount++;
      // alternate afterwards so later races never collide either
      return callCount % 2 === 0 ? "Filler A" : "Filler B";
    });

    await command.run();

    const [firstRaceData] = createRaceMock.mock.calls[0];
    expect(firstRaceData.person1).toBe("Alex Nakamura");
    expect(firstRaceData.person2).toBe("Jordan Silva");
  });

  it("throws without creating races when fewer than 2 selectable songs exist", async () => {
    songsMock.mockResolvedValue([selectableSongs[0]]);

    await expect(command.run()).rejects.toThrow();
    expect(createRaceMock).not.toHaveBeenCalled();
  });
});
