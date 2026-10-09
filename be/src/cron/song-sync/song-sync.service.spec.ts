import { Test, TestingModule } from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { ConflictException } from "@nestjs/common";
import { of, Subject, throwError } from "rxjs";
import { SongSyncService } from "./song-sync.service";
import { SongService } from "../../prisma-api/song.service";

describe("SongSyncService", () => {
  let service: SongSyncService;
  let httpGet: jest.Mock;
  let songsMock: jest.Mock;
  let createManySongsMock: jest.Mock;
  let updateManySongsMock: jest.Mock;
  let configValues: Record<string, string>;

  beforeEach(async () => {
    httpGet = jest.fn();
    songsMock = jest.fn().mockResolvedValue([]);
    createManySongsMock = jest.fn().mockResolvedValue({ count: 0 });
    updateManySongsMock = jest.fn().mockResolvedValue({ count: 0 });
    configValues = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongSyncService,
        { provide: HttpService, useValue: { get: httpGet } },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => configValues[key] },
        },
        {
          provide: SongService,
          useValue: {
            songs: songsMock,
            createManySongs: createManySongsMock,
            updateManySongs: updateManySongsMock,
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

  describe("runSync (cloud API)", () => {
    const cloudSong = (
      artist: string,
      title: string,
      status: "listed" | "unlisted" = "listed",
    ) => ({ artist, title, status });

    it("creates the songs that do not exist locally in one batch", async () => {
      httpGet.mockReturnValue(
        of({
          data: [cloudSong("A", "One"), cloudSong("B", "Two", "unlisted")],
        }),
      );
      songsMock.mockResolvedValue([]);

      await service.triggerSync();

      expect(createManySongsMock).toHaveBeenCalledTimes(1);
      expect(createManySongsMock).toHaveBeenCalledWith([
        {
          artist: "A",
          name: "One",
          selectable: true,
          deleted: false,
          origin: "FROM_CLOUD_SYNC",
        },
        {
          artist: "B",
          name: "Two",
          selectable: false,
          deleted: false,
          origin: "FROM_CLOUD_SYNC",
        },
      ]);
      expect(updateManySongsMock).not.toHaveBeenCalled();
    });

    it("only updates matched songs whose selectable state differs, grouped per value", async () => {
      httpGet.mockReturnValue(
        of({
          data: [
            cloudSong("A", "One"),
            cloudSong("A", "Two"),
            cloudSong("A", "Three", "unlisted"),
            cloudSong("A", "Four"),
          ],
        }),
      );
      songsMock.mockResolvedValue([
        { id: 1, artist: "A", name: "One", selectable: false },
        { id: 2, artist: "A", name: "Two", selectable: false },
        { id: 3, artist: "A", name: "Three", selectable: true },
        { id: 4, artist: "A", name: "Four", selectable: true }, // unchanged
      ]);

      await service.triggerSync();

      expect(createManySongsMock).not.toHaveBeenCalled();
      expect(updateManySongsMock).toHaveBeenCalledTimes(2);
      expect(updateManySongsMock).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        data: { selectable: true },
      });
      expect(updateManySongsMock).toHaveBeenCalledWith({
        where: { id: { in: [3] } },
        data: { selectable: false },
      });
    });

    it("writes nothing when local songs already match the cloud list", async () => {
      httpGet.mockReturnValue(of({ data: [cloudSong("A", "One")] }));
      songsMock.mockResolvedValue([
        { id: 1, artist: "A", name: "One", selectable: true },
      ]);

      await service.triggerSync();

      expect(createManySongsMock).not.toHaveBeenCalled();
      expect(updateManySongsMock).not.toHaveBeenCalled();
    });

    it("creates a song only once when the cloud list contains it several times", async () => {
      httpGet.mockReturnValue(
        of({
          data: [
            cloudSong("A", "One"),
            cloudSong("a", "ONE [PT]"),
            cloudSong("A", "One"),
          ],
        }),
      );

      await service.triggerSync();

      expect(createManySongsMock).toHaveBeenCalledTimes(1);
      expect(createManySongsMock.mock.calls[0][0]).toHaveLength(1);
    });

    it("matches names ignoring case and every [PT] / [PTHQ] tag, not just the first", async () => {
      httpGet.mockReturnValue(of({ data: [cloudSong("A", "Song")] }));
      songsMock.mockResolvedValue([
        {
          id: 1,
          artist: "A",
          name: "[PT] Song [PTHQ] [PT]",
          selectable: false,
        },
      ]);

      await service.triggerSync();

      expect(createManySongsMock).not.toHaveBeenCalled();
      expect(updateManySongsMock).toHaveBeenCalledWith({
        where: { id: { in: [1] } },
        data: { selectable: true },
      });
    });

    it("keeps the lock until all writes have finished", async () => {
      let finishWrite!: () => void;
      createManySongsMock.mockReturnValue(
        new Promise((resolve) => {
          finishWrite = () => resolve({ count: 1 });
        }),
      );
      httpGet.mockReturnValue(of({ data: [cloudSong("A", "One")] }));

      const firstRun = service.triggerSync();
      await new Promise((resolve) => setImmediate(resolve));

      await expect(service.triggerSync()).rejects.toBeInstanceOf(
        ConflictException,
      );

      finishWrite();
      await firstRun;
      await expect(service.triggerSync()).resolves.toBeUndefined();
    });

    it("rejects when the cloud list cannot be fetched, and releases the lock", async () => {
      httpGet.mockReturnValueOnce(throwError(() => new Error("network down")));

      await expect(service.triggerSync()).rejects.toThrow("network down");
      expect(createManySongsMock).not.toHaveBeenCalled();

      httpGet.mockReturnValue(of({ data: [] }));
      await expect(service.triggerSync()).resolves.toBeUndefined();
    });

    it("rejects when writing fails, and releases the lock", async () => {
      httpGet.mockReturnValue(of({ data: [cloudSong("A", "One")] }));
      createManySongsMock.mockRejectedValueOnce(new Error("db down"));

      await expect(service.triggerSync()).rejects.toThrow("db down");

      createManySongsMock.mockResolvedValue({ count: 1 });
      await expect(service.triggerSync()).resolves.toBeUndefined();
    });

    it("does not let a failing scheduled run escape as an unhandled rejection", async () => {
      httpGet.mockReturnValue(throwError(() => new Error("network down")));

      await expect(service.handleCron()).resolves.toBeUndefined();
    });

    it("requests the cloud API with a timeout, at the configured songlist URL", async () => {
      configValues["SONGLIST_URL"] = "http://songs.local/";
      httpGet.mockReturnValue(of({ data: [] }));

      await service.triggerSync();

      expect(httpGet).toHaveBeenCalledWith(
        "http://songs.local/api/index.php",
        expect.objectContaining({ timeout: expect.any(Number) }),
      );
    });

    it("defaults to the public songlist", async () => {
      httpGet.mockReturnValue(of({ data: [] }));

      await service.triggerSync();

      expect(httpGet).toHaveBeenCalledWith(
        "https://songlist.ponytyler.de/api/index.php",
        expect.anything(),
      );
    });
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

      expect(updateManySongsMock).toHaveBeenCalledWith({
        where: { id: { in: [1] } },
        data: { selectable: true },
      });
      expect(updateManySongsMock).toHaveBeenCalledWith({
        where: { id: { in: [2] } },
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

      expect(updateManySongsMock).not.toHaveBeenCalled();
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

      expect(updateManySongsMock).toHaveBeenCalledWith({
        where: { id: { in: [1] } },
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

      expect(updateManySongsMock).toHaveBeenCalledWith({
        where: { id: { in: [1] } },
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

      expect(updateManySongsMock).toHaveBeenCalledTimes(2);
      expect(updateManySongsMock).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        data: { selectable: true },
      });
      expect(updateManySongsMock).toHaveBeenCalledWith({
        where: { id: { in: [3] } },
        data: { selectable: false },
      });
    });
  });
});
