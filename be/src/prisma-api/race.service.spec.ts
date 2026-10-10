import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import * as mqtt from "mqtt";
import { RaceService } from "./race.service";
import { PrismaService } from "./prisma.service";
import { ShowService } from "./show.service";
import { RaceState } from "@prisma/client";

jest.mock("mqtt", () => ({
  connect: jest.fn(),
}));

describe("RaceService", () => {
  let service: RaceService;
  let findUniqueMock: jest.Mock;
  let updateMock: jest.Mock;
  let findManyMock: jest.Mock;
  let findFirstMock: jest.Mock;
  let getCurrentShowMock: jest.Mock;
  let transactionMock: jest.Mock;
  // the interactive transaction client handed to `$transaction(async tx => …)`
  let tx: {
    race: {
      findUnique: jest.Mock;
      update: jest.Mock;
      updateManyAndReturn: jest.Mock;
      aggregate: jest.Mock;
      create: jest.Mock;
    };
    $executeRaw: jest.Mock;
  };
  let events: string[];
  let mqttClient: { publish: jest.Mock; end: jest.Mock };

  beforeEach(async () => {
    findUniqueMock = jest.fn();
    updateMock = jest.fn();
    findManyMock = jest.fn().mockResolvedValue([]);
    findFirstMock = jest.fn();
    getCurrentShowMock = jest.fn().mockResolvedValue({ id: 7 });
    events = [];
    tx = {
      race: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateManyAndReturn: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockImplementation(async () => {
          events.push("aggregate");
          return { _max: { orderNumber: null } };
        }),
        create: jest.fn().mockImplementation(async (args) => {
          events.push("create");
          return { id: 1, ...args.data };
        }),
      },
      $executeRaw: jest.fn().mockImplementation(async () => {
        events.push("lock");
        return [];
      }),
    };
    transactionMock = jest.fn((work: unknown) =>
      typeof work === "function" ? work(tx) : undefined,
    );
    mqttClient = { publish: jest.fn(), end: jest.fn() };
    (mqtt.connect as jest.Mock).mockReturnValue(mqttClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RaceService,
        {
          provide: PrismaService,
          useValue: {
            // updateRace must work on the transaction client only
            race: {
              findUnique: findUniqueMock,
              update: updateMock,
              findMany: findManyMock,
              findFirst: findFirstMock,
              updateMany: jest.fn(() => {
                throw new Error("use the transaction client");
              }),
            },
            $transaction: transactionMock,
          },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: ShowService,
          useValue: { getCurrentShow: getCurrentShowMock },
        },
      ],
    }).compile();

    service = module.get(RaceService);
  });

  it("connects an mqtt client to the broker on construction", () => {
    expect(mqtt.connect).toHaveBeenCalledWith(
      expect.stringMatching(/^mqtt:\/\//),
      expect.objectContaining({ clientId: expect.any(String) }),
    );
  });

  it("closes the mqtt client when the module is destroyed", () => {
    service.onModuleDestroy();

    expect(mqttClient.end).toHaveBeenCalled();
  });

  describe("upcoming races use the current show of the ShowService", () => {
    it("upcomingRaceWithSongs looks in that show", async () => {
      findFirstMock.mockResolvedValue({ id: 1 });

      await service.upcomingRaceWithSongs();

      expect(findFirstMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { showId: 7, raceState: { equals: RaceState.LISTED } },
        }),
      );
    });

    it("upcomingRaceWithSongs is null, without touching races, when there is no current show", async () => {
      getCurrentShowMock.mockResolvedValue(null);

      expect(await service.upcomingRaceWithSongs()).toBeNull();
      expect(findFirstMock).not.toHaveBeenCalled();
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it("upcomingRacesWithSongs is empty, without touching races, when there is no current show", async () => {
      getCurrentShowMock.mockResolvedValue(null);

      expect(await service.upcomingRacesWithSongs()).toEqual([]);
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it("upcomingRaceWithSongs is the first of the upcoming races, by orderNumber", async () => {
      await service.upcomingRaceWithSongs();

      expect(findFirstMock).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { song1: true, song2: true },
          orderBy: { orderNumber: "asc" },
        }),
      );
    });

    it("upcomingRacesWithSongs looks in that show", async () => {
      await service.upcomingRacesWithSongs();

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { showId: 7, raceState: { equals: RaceState.LISTED } },
        }),
      );
    });
  });

  describe("updateRace", () => {
    it("publishes a RaceStateChange message when the race state changes", async () => {
      tx.race.findUnique.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.WAITING_TO_RACE,
      });
      tx.race.update.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.RACING,
      });

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.RACING },
      });

      expect(mqttClient.publish).toHaveBeenCalledWith(
        "RaceStateChange",
        JSON.stringify({ raceId: "1", state: RaceState.RACING }),
      );
    });

    it("does not publish a message when the race state stays the same", async () => {
      tx.race.findUnique.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.LISTED,
      });
      tx.race.update.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.LISTED,
      });

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.LISTED, person1: "A" },
      });

      expect(mqttClient.publish).not.toHaveBeenCalled();
    });

    it("persists raceStartedAt and raceFinishedAt", async () => {
      const raceStartedAt = "2026-10-09T20:00:00.000Z";
      const raceFinishedAt = "2026-10-09T20:00:25.000Z";
      tx.race.findUnique.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.RACING,
      });
      tx.race.update.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.RACED,
      });

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.RACED, raceStartedAt, raceFinishedAt },
      });

      expect(tx.race.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ raceStartedAt, raceFinishedAt }),
        }),
      );
    });

    it("does not publish when there is no existing race to compare against", async () => {
      tx.race.findUnique.mockResolvedValue(null);
      tx.race.update.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.LISTED,
      });

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.LISTED },
      });

      expect(mqttClient.publish).not.toHaveBeenCalled();
    });

    it("does all its database work inside one transaction", async () => {
      tx.race.findUnique.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.LISTED,
      });
      tx.race.update.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.RACING,
      });

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.RACING },
      });

      expect(transactionMock).toHaveBeenCalledTimes(1);
      expect(transactionMock).toHaveBeenCalledWith(expect.any(Function));
      expect(updateMock).not.toHaveBeenCalled();
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it("serialises concurrent updates of one show by locking it before the race is written", async () => {
      tx.race.findUnique.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.LISTED,
      });
      tx.race.update.mockImplementation(async () => {
        events.push("update");
        return { id: 1, showId: 5, raceState: RaceState.RACING };
      });

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.RACING },
      });

      expect(events).toEqual(["lock", "update"]);
      // the lock is keyed by the show of the race
      expect(tx.$executeRaw.mock.calls[0].slice(1)).toContain(5);
    });

    it("publishes only after the transaction has committed", async () => {
      tx.race.findUnique.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.LISTED,
      });
      tx.race.update.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.RACING,
      });
      tx.race.updateManyAndReturn.mockResolvedValue([
        { id: 2, showId: 5, raceState: RaceState.LISTED },
      ]);
      let publishedInsideTransaction = -1;
      transactionMock.mockImplementation(
        async (work: (t: typeof tx) => unknown) => {
          const result = await work(tx);
          publishedInsideTransaction = mqttClient.publish.mock.calls.length;
          return result;
        },
      );

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.RACING },
      });

      expect(publishedInsideTransaction).toBe(0);
      expect(mqttClient.publish).toHaveBeenCalledTimes(2);
    });

    it("publishes nothing when the transaction fails", async () => {
      tx.race.findUnique.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.LISTED,
      });
      tx.race.update.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.RACING,
      });
      tx.race.updateManyAndReturn.mockRejectedValue(new Error("boom"));

      await expect(
        service.updateRace({
          where: { id: 1 },
          data: { raceState: RaceState.RACING },
        }),
      ).rejects.toThrow("boom");

      expect(mqttClient.publish).not.toHaveBeenCalled();
    });
  });

  describe("createRace", () => {
    const complete = {
      showId: 5,
      person1: "A",
      song1Id: 10,
      person2: "B",
      song2Id: 11,
      raceState: RaceState.LISTED,
    };

    it("appends the race after the highest orderNumber of its show, taken from a database aggregate", async () => {
      tx.race.aggregate.mockResolvedValue({ _max: { orderNumber: 7 } });

      await service.createRace(complete);

      expect(tx.race.aggregate).toHaveBeenCalledWith({
        where: { showId: 5 },
        _max: { orderNumber: true },
      });
      expect(tx.race.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ showId: 5, orderNumber: 8 }),
      });
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it("starts at orderNumber 0 in a show without races", async () => {
      await service.createRace(complete);

      expect(tx.race.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ orderNumber: 0 }),
      });
    });

    it("locks the show, reads the maximum and inserts in one transaction, in that order", async () => {
      await service.createRace(complete);

      expect(transactionMock).toHaveBeenCalledTimes(1);
      expect(events).toEqual(["lock", "aggregate", "create"]);
      expect(tx.$executeRaw.mock.calls[0].slice(1)).toContain(5);
    });

    it("stores missing songs as null instead of NaN", async () => {
      await service.createRace({
        showId: 5,
        person1: "A",
        raceState: RaceState.WAITING_FOR_OPPONENT,
      });

      const { data } = tx.race.create.mock.calls[0][0];
      expect(data.song1Id).toBeNull();
      expect(data.song2Id).toBeNull();
      expect(data.raceState).toBe(RaceState.WAITING_FOR_OPPONENT);
    });

    it("keeps given songs as numbers", async () => {
      await service.createRace({
        ...complete,
        song1Id: "10" as unknown as number,
        song2Id: "11" as unknown as number,
      });

      const { data } = tx.race.create.mock.calls[0][0];
      expect(data.song1Id).toBe(10);
      expect(data.song2Id).toBe(11);
    });
  });

  describe("moveRacePosition", () => {
    /**
     * Stands in for Postgres: runs the queued updates one after another and
     * rejects as soon as two races of a show share an orderNumber, like the
     * `@@unique([showId, orderNumber])` constraint does.
     */
    function fakeDatabase(
      races: { id: number; showId: number; orderNumber: number }[],
    ) {
      findUniqueMock.mockImplementation(
        async ({ where }: { where: { id: number } }) =>
          races.find((race) => race.id === where.id),
      );
      updateMock.mockImplementation(
        ({
          where,
          data,
        }: {
          where: { id: number };
          data: { orderNumber: number };
        }) =>
          async () => {
            const race = races.find((candidate) => candidate.id === where.id)!;
            race.orderNumber = data.orderNumber;
            const seen = new Set<number>();
            for (const other of races.filter((r) => r.showId === race.showId)) {
              if (seen.has(other.orderNumber)) {
                throw new Error(
                  `Unique constraint failed on (showId, orderNumber) = (${other.showId}, ${other.orderNumber})`,
                );
              }
              seen.add(other.orderNumber);
            }
          },
      );
      transactionMock.mockImplementation(
        async (operations: (() => Promise<void>)[]) => {
          for (const operation of operations) {
            await operation();
          }
        },
      );
    }

    it.each([
      ["up", 11, 10],
      ["down", 10, 11],
    ])(
      "swaps with the neighbouring race when moving %s without ever duplicating an orderNumber",
      async (upOrDown, raceToMoveId, neighbourId) => {
        const races = [
          { id: 10, showId: 1, orderNumber: 0 },
          { id: 11, showId: 1, orderNumber: 1 },
        ];
        fakeDatabase(races);
        findManyMock.mockResolvedValue([
          races.find((race) => race.id === neighbourId),
        ]);

        await service.moveRacePosition({
          raceToMoveId: String(raceToMoveId),
          upOrDown,
        });

        expect(races.find((race) => race.id === 10)!.orderNumber).toBe(1);
        expect(races.find((race) => race.id === 11)!.orderNumber).toBe(0);
      },
    );

    it("does nothing when there is no race to swap with", async () => {
      fakeDatabase([{ id: 10, showId: 1, orderNumber: 0 }]);
      findManyMock.mockResolvedValue([]);

      await service.moveRacePosition({ raceToMoveId: "10", upOrDown: "up" });

      expect(transactionMock).not.toHaveBeenCalled();
    });
  });

  describe("updateRace - single active race enforcement", () => {
    const ALLOWED_INACTIVE_STATES = [
      RaceState.CANCELED,
      RaceState.LISTED,
      RaceState.DONE,
      RaceState.WAITING_FOR_OPPONENT,
    ];

    it("resets the other active races of the same show to LISTED with one scoped update when this race becomes active", async () => {
      tx.race.findUnique.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.LISTED,
      });
      tx.race.update.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.RACING,
      });
      tx.race.updateManyAndReturn.mockResolvedValue([
        { id: 2, showId: 5, raceState: RaceState.LISTED },
        { id: 3, showId: 5, raceState: RaceState.LISTED },
      ]);

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.RACING },
      });

      expect(tx.race.updateManyAndReturn).toHaveBeenCalledTimes(1);
      expect(tx.race.updateManyAndReturn).toHaveBeenCalledWith({
        where: {
          showId: 5,
          id: { not: 1 },
          raceState: { notIn: ALLOWED_INACTIVE_STATES },
        },
        data: { raceState: RaceState.LISTED },
      });
      expect(mqttClient.publish).toHaveBeenCalledWith(
        "RaceStateChange",
        JSON.stringify({ raceId: "2", state: RaceState.LISTED }),
      );
      expect(mqttClient.publish).toHaveBeenCalledWith(
        "RaceStateChange",
        JSON.stringify({ raceId: "3", state: RaceState.LISTED }),
      );
    });

    it("announces the new state of this race before the resets of the others", async () => {
      tx.race.findUnique.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.LISTED,
      });
      tx.race.update.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.RACING,
      });
      tx.race.updateManyAndReturn.mockResolvedValue([
        { id: 2, showId: 5, raceState: RaceState.LISTED },
      ]);

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.RACING },
      });

      expect(
        mqttClient.publish.mock.calls.map(
          ([, payload]) => JSON.parse(payload).raceId,
        ),
      ).toEqual(["1", "2"]);
    });

    it.each(ALLOWED_INACTIVE_STATES)(
      "does not reset other races when this race is set to %s",
      async (allowedState) => {
        tx.race.findUnique.mockResolvedValue({
          id: 1,
          showId: 5,
          raceState: RaceState.RACING,
        });
        tx.race.update.mockResolvedValue({
          id: 1,
          showId: 5,
          raceState: allowedState,
        });

        await service.updateRace({
          where: { id: 1 },
          data: { raceState: allowedState },
        });

        expect(tx.race.updateManyAndReturn).not.toHaveBeenCalled();
      },
    );

    it("publishes nothing extra when there are no other active races", async () => {
      tx.race.findUnique.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.LISTED,
      });
      tx.race.update.mockResolvedValue({
        id: 1,
        showId: 5,
        raceState: RaceState.RACING,
      });

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.RACING },
      });

      expect(mqttClient.publish).toHaveBeenCalledTimes(1);
    });
  });
});
