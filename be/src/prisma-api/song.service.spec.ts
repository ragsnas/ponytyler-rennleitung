import { Test, TestingModule } from "@nestjs/testing";
import { SongService } from "./song.service";
import { PrismaService } from "./prisma.service";

describe("SongService", () => {
  let service: SongService;
  let findUniqueMock: jest.Mock;
  let findManyMock: jest.Mock;
  let createMock: jest.Mock;
  let updateMock: jest.Mock;
  let deleteMock: jest.Mock;
  let createManyMock: jest.Mock;
  let updateManyMock: jest.Mock;

  beforeEach(async () => {
    findUniqueMock = jest.fn();
    findManyMock = jest.fn();
    createMock = jest.fn();
    updateMock = jest.fn();
    deleteMock = jest.fn();
    createManyMock = jest.fn();
    updateManyMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongService,
        {
          provide: PrismaService,
          useValue: {
            song: {
              findUnique: findUniqueMock,
              findMany: findManyMock,
              create: createMock,
              update: updateMock,
              delete: deleteMock,
              createMany: createManyMock,
              updateMany: updateManyMock,
            },
          },
        },
      ],
    }).compile();

    service = module.get(SongService);
  });

  describe("song", () => {
    it("finds a single song by its unique input", async () => {
      const song = { id: 1 };
      findUniqueMock.mockResolvedValue(song);

      await expect(service.song({ id: 1 })).resolves.toBe(song);
      expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe("songs", () => {
    it("passes skip, take, cursor, where and orderBy through to findMany", async () => {
      const songs = [{ id: 1 }, { id: 2 }];
      findManyMock.mockResolvedValue(songs);
      const params = {
        skip: 1,
        take: 2,
        cursor: { id: 3 },
        where: { deleted: { equals: false } },
        orderBy: { name: "asc" as const },
      };

      await expect(service.songs(params)).resolves.toBe(songs);
      expect(findManyMock).toHaveBeenCalledWith(params);
    });
  });

  describe("createSong", () => {
    it("creates a song with the given data", async () => {
      const data = { name: "Song", artist: "Artist" } as any;
      const created = { id: 1, ...data };
      createMock.mockResolvedValue(created);

      await expect(service.createSong(data)).resolves.toBe(created);
      expect(createMock).toHaveBeenCalledWith({ data });
    });
  });

  describe("updateSong", () => {
    it("updates a song with the given where and data", async () => {
      const where = { id: 1 };
      const data = { name: "New Name" };
      const updated = { id: 1, name: "New Name" };
      updateMock.mockResolvedValue(updated);

      await expect(service.updateSong({ where, data })).resolves.toBe(updated);
      expect(updateMock).toHaveBeenCalledWith({ data, where });
    });
  });

  describe("createManySongs", () => {
    it("creates all songs in one call and skips duplicates", async () => {
      const data = [{ name: "A", artist: "B" }];
      createManyMock.mockResolvedValue({ count: 1 });

      await expect(service.createManySongs(data)).resolves.toEqual({
        count: 1,
      });
      expect(createManyMock).toHaveBeenCalledWith({
        data,
        skipDuplicates: true,
      });
    });

    it("does not hit the database for an empty list", async () => {
      await expect(service.createManySongs([])).resolves.toEqual({ count: 0 });
      expect(createManyMock).not.toHaveBeenCalled();
    });
  });

  describe("updateManySongs", () => {
    it("updates all matching songs in one call", async () => {
      const params = {
        where: { id: { in: [1, 2] } },
        data: { selectable: true },
      };
      updateManyMock.mockResolvedValue({ count: 2 });

      await expect(service.updateManySongs(params)).resolves.toEqual({
        count: 2,
      });
      expect(updateManyMock).toHaveBeenCalledWith(params);
    });
  });

  describe("deleteSong", () => {
    it("deletes a song by its unique where", async () => {
      const where = { id: 1 };
      const deleted = { id: 1 };
      deleteMock.mockResolvedValue(deleted);

      await expect(service.deleteSong(where)).resolves.toBe(deleted);
      expect(deleteMock).toHaveBeenCalledWith({ where });
    });
  });
});
