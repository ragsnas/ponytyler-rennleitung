import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ImportService } from "./import.service";
import { PrismaService } from "../prisma-api/prisma.service";
import { DATABASE_EXPORT_FORMAT_VERSION } from "../export/export.types";
import { ImportSnapshotService } from "./import-snapshot.service";
import {
  IMPORT_TRANSACTION_MAX_WAIT_MS,
  IMPORT_TRANSACTION_TIMEOUT_MS,
} from "./import.service";

function createTxMock(calls: string[]) {
  const table = (name: string) => ({
    deleteMany: jest.fn(() => {
      calls.push(`delete:${name}`);
    }),
    createMany: jest.fn(() => {
      calls.push(`create:${name}`);
    }),
    findMany: jest.fn().mockResolvedValue([]),
  });

  return {
    shiftRole: table("shiftRole"),
    race: table("race"),
    shift: table("shift"),
    show: table("show"),
    song: table("song"),
    user: table("user"),
    encoreSong: table("encoreSong"),
    $executeRaw: jest.fn(),
  };
}

function validExport(overrides: Partial<Record<string, unknown[]>> = {}) {
  return {
    formatVersion: DATABASE_EXPORT_FORMAT_VERSION,
    exportedAt: "2024-01-01T00:00:00.000Z",
    shows: [{ id: 1, name: "Show" }],
    shifts: [{ id: 1, showId: 1, order: 0 }],
    shiftRoles: [{ id: 1, shiftId: 1, userId: 1, roleTitle: "DJ" }],
    songs: [{ id: 1, name: "Song", artist: "Artist" }],
    races: [{ id: 1, showId: 1, orderNumber: 0 }],
    users: [{ id: 1, name: "a" }],
    encoreSongs: [{ id: 1, showId: 1, songId: 1, order: 0 }],
    ...overrides,
  };
}

function sequenceSqlOf(tx: ReturnType<typeof createTxMock>): string[] {
  return tx.$executeRaw.mock.calls.map(
    ([query]) => (query as { sql: string }).sql,
  );
}

describe("ImportService", () => {
  const sequenceSql = () => sequenceSqlOf(txMock);

  let service: ImportService;
  let txMock: ReturnType<typeof createTxMock>;
  let transactionMock: jest.Mock;
  let snapshotMock: jest.Mock;
  let calls: string[];

  beforeEach(async () => {
    calls = [];
    txMock = createTxMock(calls);
    transactionMock = jest.fn((cb: (tx: unknown) => unknown) => {
      calls.push("transaction");
      return cb(txMock);
    });
    snapshotMock = jest.fn(async () => {
      calls.push("snapshot");
      return "/snapshots/pre-import-1.json";
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        {
          provide: PrismaService,
          useValue: { $transaction: transactionMock },
        },
        { provide: ImportSnapshotService, useValue: { save: snapshotMock } },
      ],
    }).compile();

    service = module.get(ImportService);
  });

  describe("validation", () => {
    it("rejects null input", async () => {
      await expect(service.importDatabase(null)).rejects.toThrow(
        BadRequestException,
      );
      expect(transactionMock).not.toHaveBeenCalled();
    });

    it("rejects non-object input", async () => {
      await expect(service.importDatabase("nope")).rejects.toThrow(
        BadRequestException,
      );
      expect(transactionMock).not.toHaveBeenCalled();
    });

    it("rejects a mismatched formatVersion", async () => {
      const raw = validExport({});
      (raw as { formatVersion: number }).formatVersion = 999;

      await expect(service.importDatabase(raw)).rejects.toThrow(
        BadRequestException,
      );
      expect(transactionMock).not.toHaveBeenCalled();
    });

    it("rejects input missing a required array key", async () => {
      const raw: Record<string, unknown> = validExport();
      delete raw.users;

      await expect(service.importDatabase(raw)).rejects.toThrow(
        BadRequestException,
      );
      expect(transactionMock).not.toHaveBeenCalled();
    });

    it("rejects input where a required key is present but not an array", async () => {
      const raw = validExport({});
      (raw as { users: unknown }).users = "not-an-array";

      await expect(service.importDatabase(raw)).rejects.toThrow(
        BadRequestException,
      );
      expect(transactionMock).not.toHaveBeenCalled();
    });
  });

  describe("importDatabase", () => {
    it("wipes and recreates every table, resets sequences, and returns a summary", async () => {
      const raw = validExport();

      const result = await service.importDatabase(raw);

      expect(txMock.shiftRole.deleteMany).toHaveBeenCalled();
      expect(txMock.race.deleteMany).toHaveBeenCalled();
      expect(txMock.shift.deleteMany).toHaveBeenCalled();
      expect(txMock.show.deleteMany).toHaveBeenCalled();
      expect(txMock.song.deleteMany).toHaveBeenCalled();
      expect(txMock.user.deleteMany).toHaveBeenCalled();

      expect(txMock.show.createMany).toHaveBeenCalledWith({
        data: raw.shows,
      });
      expect(txMock.song.createMany).toHaveBeenCalledWith({
        data: raw.songs,
      });
      expect(txMock.user.createMany).toHaveBeenCalledWith({
        data: raw.users,
      });
      expect(txMock.shift.createMany).toHaveBeenCalledWith({
        data: raw.shifts,
      });
      expect(txMock.race.createMany).toHaveBeenCalledWith({
        data: raw.races,
      });
      expect(txMock.shiftRole.createMany).toHaveBeenCalledWith({
        data: raw.shiftRoles,
      });

      expect(txMock.encoreSong.deleteMany).toHaveBeenCalled();
      expect(txMock.encoreSong.createMany).toHaveBeenCalledWith({
        data: raw.encoreSongs,
      });

      expect(txMock.$executeRaw).toHaveBeenCalledTimes(7);
      const sqlCalls = sequenceSql();
      expect(sqlCalls.some((sql) => sql.includes('"Show"'))).toBe(true);
      expect(sqlCalls.some((sql) => sql.includes('"encore_songs"'))).toBe(true);

      expect(result.formatVersion).toBe(DATABASE_EXPORT_FORMAT_VERSION);
      expect(typeof result.importedAt).toBe("string");
      expect(result.imported).toEqual({
        shows: raw.shows.length,
        shifts: raw.shifts.length,
        shiftRoles: raw.shiftRoles.length,
        songs: raw.songs.length,
        races: raw.races.length,
        users: raw.users.length,
        encoreSongs: raw.encoreSongs.length,
      });
      expect(result.snapshot).toBe("pre-import-1.json");
    });

    it("skips createMany calls for empty tables while still deleting and resetting sequences", async () => {
      const raw = validExport({
        shows: [],
        shifts: [],
        shiftRoles: [],
        songs: [],
        races: [],
        users: [],
        encoreSongs: [],
      });

      const result = await service.importDatabase(raw);

      expect(txMock.show.createMany).not.toHaveBeenCalled();
      expect(txMock.song.createMany).not.toHaveBeenCalled();
      expect(txMock.user.createMany).not.toHaveBeenCalled();
      expect(txMock.shift.createMany).not.toHaveBeenCalled();
      expect(txMock.race.createMany).not.toHaveBeenCalled();
      expect(txMock.shiftRole.createMany).not.toHaveBeenCalled();

      expect(txMock.show.deleteMany).toHaveBeenCalled();
      expect(txMock.encoreSong.createMany).not.toHaveBeenCalled();
      expect(txMock.$executeRaw).toHaveBeenCalledTimes(7);

      expect(result.imported).toEqual({
        shows: 0,
        shifts: 0,
        shiftRoles: 0,
        songs: 0,
        races: 0,
        users: 0,
        encoreSongs: 0,
      });
    });

    it("wipes encore songs before the shows and songs they reference and restores them after both", async () => {
      await service.importDatabase(validExport());

      const index = (entry: string) => calls.indexOf(entry);
      expect(index("delete:encoreSong")).toBeLessThan(index("delete:show"));
      expect(index("delete:encoreSong")).toBeLessThan(index("delete:song"));
      expect(index("create:encoreSong")).toBeGreaterThan(index("create:show"));
      expect(index("create:encoreSong")).toBeGreaterThan(index("create:song"));
    });

    it("gives the transaction a timeout long enough for a large import", async () => {
      await service.importDatabase(validExport());

      expect(transactionMock).toHaveBeenCalledWith(expect.any(Function), {
        timeout: IMPORT_TRANSACTION_TIMEOUT_MS,
        maxWait: IMPORT_TRANSACTION_MAX_WAIT_MS,
      });
      expect(IMPORT_TRANSACTION_TIMEOUT_MS).toBeGreaterThan(5000);
    });

    it("builds the sequence reset without interpolating strings into unsafe SQL", async () => {
      await service.importDatabase(validExport());

      expect(txMock.$executeRaw).toHaveBeenCalled();
      expect(
        (txMock as Record<string, unknown>).$executeRawUnsafe,
      ).toBeUndefined();
    });

    it("keeps the passwords of users that exist before and after the import", async () => {
      txMock.user.findMany.mockResolvedValue([
        { name: "a", password: "secret" },
        { name: "gone", password: "other" },
      ]);

      await service.importDatabase(
        validExport({
          users: [
            { id: 1, name: "a" },
            { id: 2, name: "b" },
          ],
          shiftRoles: [],
        }),
      );

      expect(txMock.user.createMany).toHaveBeenCalledWith({
        data: [
          { id: 1, name: "a", password: "secret" },
          { id: 2, name: "b" },
        ],
      });
    });

    it("reads the existing passwords before it deletes the users", async () => {
      txMock.user.findMany.mockImplementation(async () => {
        calls.push("read:users");
        return [];
      });

      await service.importDatabase(validExport());

      expect(calls.indexOf("read:users")).toBeLessThan(
        calls.indexOf("delete:user"),
      );
    });

    it("saves a snapshot of the current database before the transaction starts", async () => {
      await service.importDatabase(validExport());

      expect(calls.indexOf("snapshot")).toBeLessThan(
        calls.indexOf("transaction"),
      );
    });

    it("does not touch the database when the snapshot cannot be written", async () => {
      snapshotMock.mockRejectedValue(new Error("read-only file system"));

      await expect(service.importDatabase(validExport())).rejects.toThrow(
        "read-only file system",
      );

      expect(transactionMock).not.toHaveBeenCalled();
    });

    it("rejects invalid rows before snapshot and transaction", async () => {
      const raw = validExport({ songs: [{ id: 1 }] });

      await expect(service.importDatabase(raw)).rejects.toThrow(
        BadRequestException,
      );

      expect(snapshotMock).not.toHaveBeenCalled();
      expect(transactionMock).not.toHaveBeenCalled();
    });

    it("still accepts a formatVersion 1 file (no encore songs) and imports it without them", async () => {
      const raw: Record<string, unknown> = validExport();
      raw.formatVersion = 1;
      delete raw.encoreSongs;

      const result = await service.importDatabase(raw);

      expect(result.formatVersion).toBe(1);
      expect(result.imported.encoreSongs).toBe(0);
      expect(txMock.encoreSong.deleteMany).toHaveBeenCalled();
      expect(txMock.encoreSong.createMany).not.toHaveBeenCalled();
    });

    it("requires the encoreSongs array in a formatVersion 2 file", async () => {
      const raw: Record<string, unknown> = validExport();
      delete raw.encoreSongs;

      await expect(service.importDatabase(raw)).rejects.toThrow(/encoreSongs/);
    });
  });
});
