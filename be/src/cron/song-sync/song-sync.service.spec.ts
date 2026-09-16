import { Test, TestingModule } from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { ConflictException } from "@nestjs/common";
import { of, Subject } from "rxjs";
import { SongSyncService } from "./song-sync.service";
import { SongService } from "../../prisma-api/song.service";

describe("SongSyncService", () => {
  let service: SongSyncService;
  let httpGet: jest.Mock;
  let songsMock: jest.Mock;

  beforeEach(async () => {
    httpGet = jest.fn();
    songsMock = jest.fn().mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongSyncService,
        { provide: HttpService, useValue: { get: httpGet } },
        {
          provide: SongService,
          useValue: { songs: songsMock, createSong: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(SongSyncService);
  });

  it("runs the sync when triggered while idle", async () => {
    httpGet.mockReturnValue(of({ data: [] }));

    await expect(service.triggerSync()).resolves.toBeUndefined();

    expect(songsMock).toHaveBeenCalled();
  });

  it("rejects a second trigger while a sync is still running", async () => {
    const pending = new Subject<{ data: unknown[] }>();
    httpGet.mockReturnValue(pending.asObservable());

    const firstRun = service.triggerSync();

    await expect(service.triggerSync()).rejects.toBeInstanceOf(
      ConflictException,
    );

    pending.next({ data: [] });
    pending.complete();
    await firstRun;
  });

  it("allows a trigger again once the previous run has finished", async () => {
    httpGet.mockReturnValue(of({ data: [] }));
    await service.triggerSync();

    await expect(service.triggerSync()).resolves.toBeUndefined();
  });

  it("silently skips a scheduled run while a sync is already in progress", async () => {
    const pending = new Subject<{ data: unknown[] }>();
    httpGet.mockReturnValue(pending.asObservable());
    const firstRun = service.triggerSync();

    await expect(service.handleCron()).resolves.toBeUndefined();

    pending.next({ data: [] });
    pending.complete();
    await firstRun;

    expect(songsMock).toHaveBeenCalledTimes(1);
  });
});
