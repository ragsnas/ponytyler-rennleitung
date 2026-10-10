import { Test, TestingModule } from "@nestjs/testing";
import { EncoreSongService } from "./encore-song.service";
import { PrismaService } from "./prisma.service";

describe("EncoreSongService", () => {
  let service: EncoreSongService;
  let findManyMock: jest.Mock;
  let events: string[];
  let transactionMock: jest.Mock;
  let tx: {
    encoreSong: { aggregate: jest.Mock; create: jest.Mock };
    $executeRaw: jest.Mock;
  };

  beforeEach(async () => {
    findManyMock = jest.fn();
    events = [];
    tx = {
      encoreSong: {
        aggregate: jest.fn().mockImplementation(async () => {
          events.push("aggregate");
          return { _max: { order: null } };
        }),
        create: jest.fn().mockImplementation(async () => {
          events.push("create");
          return {};
        }),
      },
      $executeRaw: jest.fn().mockImplementation(async () => {
        events.push("lock");
      }),
    };
    transactionMock = jest.fn((work: (t: typeof tx) => unknown) => work(tx));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncoreSongService,
        {
          provide: PrismaService,
          useValue: {
            encoreSong: { findMany: findManyMock },
            $transaction: transactionMock,
          },
        },
      ],
    }).compile();

    service = module.get(EncoreSongService);
  });

  describe("createEncoreSong", () => {
    it("assigns order 0 when the show has no encore songs yet", async () => {
      tx.encoreSong.aggregate.mockResolvedValue({ _max: { order: null } });

      await service.createEncoreSong({ showId: 5, songId: 10 });

      expect(tx.encoreSong.create).toHaveBeenCalledWith({
        data: { showId: 5, songId: 10, order: 0 },
        include: { song: true },
      });
    });

    it("assigns the next order number after the highest existing encore song of that show", async () => {
      tx.encoreSong.aggregate.mockResolvedValue({ _max: { order: 3 } });

      await service.createEncoreSong({ showId: 5, songId: 12 });

      expect(tx.encoreSong.create).toHaveBeenCalledWith({
        data: { showId: 5, songId: 12, order: 4 },
        include: { song: true },
      });
    });

    it("asks the database for the maximum of the given show instead of loading rows", async () => {
      await service.createEncoreSong({ showId: 7, songId: 20 });

      expect(tx.encoreSong.aggregate).toHaveBeenCalledWith({
        where: { showId: 7 },
        _max: { order: true },
      });
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it("locks the show, reads the maximum and writes in one transaction, in that order", async () => {
      await service.createEncoreSong({ showId: 5, songId: 10 });

      expect(transactionMock).toHaveBeenCalledTimes(1);
      expect(events).toEqual(["lock", "aggregate", "create"]);
      expect(tx.$executeRaw.mock.calls[0].slice(1)).toContain(5);
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
