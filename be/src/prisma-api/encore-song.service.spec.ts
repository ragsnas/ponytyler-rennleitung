import { Test, TestingModule } from "@nestjs/testing";
import { EncoreSongService } from "./encore-song.service";
import { PrismaService } from "./prisma.service";

describe("EncoreSongService", () => {
  let service: EncoreSongService;
  let findManyMock: jest.Mock;
  let createMock: jest.Mock;

  beforeEach(async () => {
    findManyMock = jest.fn();
    createMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncoreSongService,
        {
          provide: PrismaService,
          useValue: {
            encoreSong: { findMany: findManyMock, create: createMock },
          },
        },
      ],
    }).compile();

    service = module.get(EncoreSongService);
  });

  describe("createEncoreSong", () => {
    it("assigns order 0 when the show has no encore songs yet", async () => {
      findManyMock.mockResolvedValue([]);
      createMock.mockResolvedValue({ id: 1, showId: 5, songId: 10, order: 0 });

      await service.createEncoreSong({ showId: 5, songId: 10 });

      expect(findManyMock).toHaveBeenCalledWith({
        where: { showId: 5 },
        orderBy: { order: "desc" },
        take: 1,
      });
      expect(createMock).toHaveBeenCalledWith({
        data: { showId: 5, songId: 10, order: 0 },
        include: { song: true },
      });
    });

    it("assigns the next order number after the highest existing encore song for that show", async () => {
      findManyMock.mockResolvedValue([{ id: 2, showId: 5, songId: 11, order: 3 }]);
      createMock.mockResolvedValue({ id: 3, showId: 5, songId: 12, order: 4 });

      await service.createEncoreSong({ showId: 5, songId: 12 });

      expect(createMock).toHaveBeenCalledWith({
        data: { showId: 5, songId: 12, order: 4 },
        include: { song: true },
      });
    });

    it("scopes the highest order lookup to the given show", async () => {
      findManyMock.mockResolvedValue([]);
      createMock.mockResolvedValue({ id: 1, showId: 7, songId: 20, order: 0 });

      await service.createEncoreSong({ showId: 7, songId: 20 });

      expect(findManyMock).toHaveBeenCalledWith({
        where: { showId: 7 },
        orderBy: { order: "desc" },
        take: 1,
      });
    });
  });

  describe("encoreSongsForShow", () => {
    it("returns the encore songs for a show ordered by their order, including the song", async () => {
      const rows = [{ id: 1, showId: 5, songId: 10, order: 0 }];
      findManyMock.mockResolvedValue(rows);

      await expect(service.encoreSongsForShow(5)).resolves.toEqual(rows);
      expect(findManyMock).toHaveBeenCalledWith({
        where: { showId: 5 },
        include: { song: true },
        orderBy: { order: "asc" },
      });
    });
  });
});
