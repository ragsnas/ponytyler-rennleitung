import { Test, TestingModule } from "@nestjs/testing";
import { ExportService } from "./export.service";
import { PrismaService } from "../prisma-api/prisma.service";
import { DATABASE_EXPORT_FORMAT_VERSION } from "./export.types";

describe("ExportService", () => {
  let service: ExportService;
  let showFindManyMock: jest.Mock;
  let shiftFindManyMock: jest.Mock;
  let shiftRoleFindManyMock: jest.Mock;
  let songFindManyMock: jest.Mock;
  let raceFindManyMock: jest.Mock;
  let userFindManyMock: jest.Mock;

  const shows = [{ id: 1 }];
  const shifts = [{ id: 2 }];
  const shiftRoles = [{ id: 3 }];
  const songs = [{ id: 4 }];
  const races = [{ id: 5 }];
  const users = [{ id: 6, name: "Alice" }];

  beforeEach(async () => {
    showFindManyMock = jest.fn().mockResolvedValue(shows);
    shiftFindManyMock = jest.fn().mockResolvedValue(shifts);
    shiftRoleFindManyMock = jest.fn().mockResolvedValue(shiftRoles);
    songFindManyMock = jest.fn().mockResolvedValue(songs);
    raceFindManyMock = jest.fn().mockResolvedValue(races);
    userFindManyMock = jest.fn().mockResolvedValue(users);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: PrismaService,
          useValue: {
            show: { findMany: showFindManyMock },
            shift: { findMany: shiftFindManyMock },
            shiftRole: { findMany: shiftRoleFindManyMock },
            song: { findMany: songFindManyMock },
            race: { findMany: raceFindManyMock },
            user: { findMany: userFindManyMock },
          },
        },
      ],
    }).compile();

    service = module.get(ExportService);
  });

  it("fetches every table ordered by id ascending, stripping non-name/id fields from users", async () => {
    await service.exportDatabase();

    expect(showFindManyMock).toHaveBeenCalledWith({ orderBy: { id: "asc" } });
    expect(shiftFindManyMock).toHaveBeenCalledWith({ orderBy: { id: "asc" } });
    expect(shiftRoleFindManyMock).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
    });
    expect(songFindManyMock).toHaveBeenCalledWith({ orderBy: { id: "asc" } });
    expect(raceFindManyMock).toHaveBeenCalledWith({ orderBy: { id: "asc" } });
    expect(userFindManyMock).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
  });

  it("returns the current format version, an ISO timestamp, and all fetched rows", async () => {
    const result = await service.exportDatabase();

    expect(result.formatVersion).toBe(DATABASE_EXPORT_FORMAT_VERSION);
    expect(typeof result.exportedAt).toBe("string");
    expect(new Date(result.exportedAt).toISOString()).toBe(result.exportedAt);
    expect(result.shows).toBe(shows);
    expect(result.shifts).toBe(shifts);
    expect(result.shiftRoles).toBe(shiftRoles);
    expect(result.songs).toBe(songs);
    expect(result.races).toBe(races);
    expect(result.users).toBe(users);
  });
});
