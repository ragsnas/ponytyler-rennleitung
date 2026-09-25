import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ImportService } from "./import.service";
import { PrismaService } from "../prisma-api/prisma.service";
import { DATABASE_EXPORT_FORMAT_VERSION } from "../export/export.types";

function createTxMock() {
  const table = () => ({
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  });

  return {
    shiftRole: table(),
    race: table(),
    shift: table(),
    show: table(),
    song: table(),
    user: table(),
    $executeRawUnsafe: jest.fn(),
  };
}

function validExport(overrides: Partial<Record<string, unknown[]>> = {}) {
  return {
    formatVersion: DATABASE_EXPORT_FORMAT_VERSION,
    exportedAt: "2024-01-01T00:00:00.000Z",
    shows: [{ id: 1 }],
    shifts: [{ id: 1 }],
    shiftRoles: [{ id: 1 }],
    songs: [{ id: 1 }],
    races: [{ id: 1 }],
    users: [{ id: 1, name: "a" }],
    ...overrides,
  };
}

describe("ImportService", () => {
  let service: ImportService;
  let txMock: ReturnType<typeof createTxMock>;
  let transactionMock: jest.Mock;

  beforeEach(async () => {
    txMock = createTxMock();
    transactionMock = jest.fn((cb: (tx: unknown) => unknown) => cb(txMock));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        {
          provide: PrismaService,
          useValue: { $transaction: transactionMock },
        },
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

      expect(txMock.$executeRawUnsafe).toHaveBeenCalledTimes(6);
      const sqlCalls = txMock.$executeRawUnsafe.mock.calls.map(
        ([sql]) => sql as string,
      );
      expect(sqlCalls.some((sql) => sql.includes('"Show"'))).toBe(true);

      expect(result.formatVersion).toBe(DATABASE_EXPORT_FORMAT_VERSION);
      expect(typeof result.importedAt).toBe("string");
      expect(result.imported).toEqual({
        shows: raw.shows.length,
        shifts: raw.shifts.length,
        shiftRoles: raw.shiftRoles.length,
        songs: raw.songs.length,
        races: raw.races.length,
        users: raw.users.length,
      });
    });

    it("skips createMany calls for empty tables while still deleting and resetting sequences", async () => {
      const raw = validExport({
        shows: [],
        shifts: [],
        shiftRoles: [],
        songs: [],
        races: [],
        users: [],
      });

      const result = await service.importDatabase(raw);

      expect(txMock.show.createMany).not.toHaveBeenCalled();
      expect(txMock.song.createMany).not.toHaveBeenCalled();
      expect(txMock.user.createMany).not.toHaveBeenCalled();
      expect(txMock.shift.createMany).not.toHaveBeenCalled();
      expect(txMock.race.createMany).not.toHaveBeenCalled();
      expect(txMock.shiftRole.createMany).not.toHaveBeenCalled();

      expect(txMock.show.deleteMany).toHaveBeenCalled();
      expect(txMock.$executeRawUnsafe).toHaveBeenCalledTimes(6);

      expect(result.imported).toEqual({
        shows: 0,
        shifts: 0,
        shiftRoles: 0,
        songs: 0,
        races: 0,
        users: 0,
      });
    });
  });
});
