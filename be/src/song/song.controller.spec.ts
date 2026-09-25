import { Test, TestingModule } from "@nestjs/testing";
import { SongController } from "./song.controller";
import { SongService } from "../prisma-api/song.service";
import { SongSyncService } from "../cron/song-sync/song-sync.service";

describe("SongController", () => {
  let controller: SongController;
  let createSongMock: jest.Mock;
  let songsMock: jest.Mock;
  let songMock: jest.Mock;
  let updateSongMock: jest.Mock;
  let deleteSongMock: jest.Mock;
  let syncWithSingleSourceOfTruthMock: jest.Mock;
  let triggerSyncMock: jest.Mock;
  let updateSelectabilityMock: jest.Mock;

  beforeEach(async () => {
    createSongMock = jest.fn();
    songsMock = jest.fn();
    songMock = jest.fn();
    updateSongMock = jest.fn();
    deleteSongMock = jest.fn();
    syncWithSingleSourceOfTruthMock = jest.fn();
    triggerSyncMock = jest.fn();
    updateSelectabilityMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongController],
      providers: [
        {
          provide: SongService,
          useValue: {
            createSong: createSongMock,
            songs: songsMock,
            song: songMock,
            updateSong: updateSongMock,
            deleteSong: deleteSongMock,
            syncWithSingleSourceOfTruth: syncWithSingleSourceOfTruthMock,
          },
        },
        {
          provide: SongSyncService,
          useValue: {
            triggerSync: triggerSyncMock,
            updateSelectability: updateSelectabilityMock,
          },
        },
      ],
    }).compile();

    controller = module.get(SongController);
  });

  it("delegates creation to the SongService", () => {
    const data = { name: "Song", artist: "Artist" };

    controller.create(data as any);

    expect(createSongMock).toHaveBeenCalledWith(data);
  });

  it("finds all non-deleted songs ordered by artist then name", () => {
    controller.findAll();

    expect(songsMock).toHaveBeenCalledWith({
      where: {
        deleted: { equals: false },
      },
      orderBy: [{ artist: "asc" }, { name: "asc" }],
    });
  });

  it("finds all non-deleted, selectable songs ordered by artist then name", () => {
    controller.findAllSelectable();

    expect(songsMock).toHaveBeenCalledWith({
      where: {
        AND: {
          deleted: { equals: false },
          selectable: { equals: true },
        },
      },
      orderBy: [{ artist: "asc" }, { name: "asc" }],
    });
  });

  it("delegates fetching a single song to the SongService, converting the id to a number", () => {
    controller.findOne("5");

    expect(songMock).toHaveBeenCalledWith({ id: 5 });
  });

  it("searches songs by name or artist containing the given text", () => {
    controller.search("foo");

    expect(songsMock).toHaveBeenCalledWith({
      where: {
        OR: [{ name: { contains: "foo" } }, { artist: { contains: "foo" } }],
      },
      orderBy: {
        artist: "asc",
        name: "asc",
      },
    });
  });

  it("delegates syncing with the single source of truth to the SongService", () => {
    controller.syncWithSingleSourceOfTruth();

    expect(syncWithSingleSourceOfTruthMock).toHaveBeenCalledWith();
  });

  it("delegates triggering a cloud sync to the SongSyncService", () => {
    controller.triggerCloudSync();

    expect(triggerSyncMock).toHaveBeenCalledWith();
  });

  it("delegates updating selectability to the SongSyncService", () => {
    controller.updateSelectability();

    expect(updateSelectabilityMock).toHaveBeenCalledWith();
  });

  it("delegates updating a song to the SongService, converting the id to a number", () => {
    const data = { name: "New Name" };

    controller.update("5", data as any);

    expect(updateSongMock).toHaveBeenCalledWith({
      where: { id: 5 },
      data,
    });
  });

  it("delegates removing a song to the SongService, converting the id to a number", () => {
    controller.remove("5");

    expect(deleteSongMock).toHaveBeenCalledWith({ id: 5 });
  });
});
