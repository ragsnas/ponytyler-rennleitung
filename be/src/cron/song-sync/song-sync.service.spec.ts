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
  let updateSongMock: jest.Mock;

  beforeEach(async () => {
    httpGet = jest.fn();
    songsMock = jest.fn().mockResolvedValue([]);
    updateSongMock = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongSyncService,
        { provide: HttpService, useValue: { get: httpGet } },
        {
          provide: SongService,
          useValue: {
            songs: songsMock,
            createSong: jest.fn(),
            updateSong: updateSongMock,
          },
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

  describe("updateSelectability", () => {
    const songlistPage = (artistBlocks: string) => `
      <html><body>
        <div class="screen-only">
          ${artistBlocks}
        </div>
        <div class="print-only">ignored duplicate markup</div>
      </body></html>
    `;

    const artistBlock = (artist: string, songs: string[]) =>
      `<div class='artist-column'></div><div class='content'><span class='artist-name'>${artist}</span><br><hr class='artist-line'><div class='song-list'>${songs
        .map((song) => `<div class='song'>${song}</div>`)
        .join("")}</div></div>`;

    it("fetches the songlist HTML page rather than the JSON API", async () => {
      httpGet.mockReturnValue(
        of({ data: songlistPage(artistBlock("Artist A", ["Song A"])) }),
      );
      songsMock.mockResolvedValue([]);

      await service.updateSelectability();

      expect(httpGet).toHaveBeenCalledWith(
        "https://songlist.ponytyler.de/",
        expect.anything(),
      );
    });

    it("marks local songs found in the cloud list as selectable and others as not", async () => {
      httpGet.mockReturnValue(
        of({
          data: songlistPage(artistBlock("Artist A", ["Song A"])),
        }),
      );
      songsMock.mockResolvedValue([
        { id: 1, artist: "Artist A", name: "Song A", selectable: false },
        { id: 2, artist: "Artist B", name: "Song B", selectable: true },
      ]);

      await service.updateSelectability();

      expect(updateSongMock).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { selectable: true },
      });
      expect(updateSongMock).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { selectable: false },
      });
    });

    it("does not touch songs whose selectable state already matches the cloud list", async () => {
      httpGet.mockReturnValue(
        of({ data: songlistPage(artistBlock("Artist A", ["Song A"])) }),
      );
      songsMock.mockResolvedValue([
        { id: 1, artist: "Artist A", name: "Song A", selectable: true },
      ]);

      await service.updateSelectability();

      expect(updateSongMock).not.toHaveBeenCalled();
    });

    it("matches names case-insensitively", async () => {
      httpGet.mockReturnValue(
        of({ data: songlistPage(artistBlock("Artist A", ["Song A"])) }),
      );
      songsMock.mockResolvedValue([
        {
          id: 1,
          artist: "artist a",
          name: "song a",
          selectable: false,
        },
      ]);

      await service.updateSelectability();

      expect(updateSongMock).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { selectable: true },
      });
    });

    it("decodes HTML entities in artist and song names", async () => {
      httpGet.mockReturnValue(
        of({
          data: songlistPage(
            artistBlock("Take That &amp; Friends", ["Friday I&#039;m In Love"]),
          ),
        }),
      );
      songsMock.mockResolvedValue([
        {
          id: 1,
          artist: "Take That & Friends",
          name: "Friday I'm In Love",
          selectable: false,
        },
      ]);

      await service.updateSelectability();

      expect(updateSongMock).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { selectable: true },
      });
    });

    it("handles multiple songs for the same artist", async () => {
      httpGet.mockReturnValue(
        of({
          data: songlistPage(
            artistBlock("Backstreet Boys", ["Everybody", "Quit Playing Games"]),
          ),
        }),
      );
      songsMock.mockResolvedValue([
        {
          id: 1,
          artist: "Backstreet Boys",
          name: "Everybody",
          selectable: false,
        },
        {
          id: 2,
          artist: "Backstreet Boys",
          name: "Quit Playing Games",
          selectable: false,
        },
        {
          id: 3,
          artist: "Backstreet Boys",
          name: "Not On The List",
          selectable: true,
        },
      ]);

      await service.updateSelectability();

      expect(updateSongMock).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { selectable: true },
      });
      expect(updateSongMock).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { selectable: true },
      });
      expect(updateSongMock).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { selectable: false },
      });
    });
  });
});
