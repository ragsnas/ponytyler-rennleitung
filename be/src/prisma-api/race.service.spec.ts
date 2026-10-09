import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import * as mqtt from "mqtt";
import { RaceService } from "./race.service";
import { PrismaService } from "./prisma.service";
import { RaceState } from "@prisma/client";

jest.mock("mqtt", () => ({
  connect: jest.fn(),
}));

describe("RaceService", () => {
  let service: RaceService;
  let findUniqueMock: jest.Mock;
  let updateMock: jest.Mock;
  let findManyMock: jest.Mock;
  let transactionMock: jest.Mock;
  let mqttClient: { publish: jest.Mock; end: jest.Mock };

  beforeEach(async () => {
    findUniqueMock = jest.fn();
    updateMock = jest.fn();
    findManyMock = jest.fn().mockResolvedValue([]);
    transactionMock = jest.fn();
    mqttClient = { publish: jest.fn(), end: jest.fn() };
    (mqtt.connect as jest.Mock).mockReturnValue(mqttClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RaceService,
        {
          provide: PrismaService,
          useValue: {
            race: {
              findUnique: findUniqueMock,
              update: updateMock,
              findMany: findManyMock,
            },
            $transaction: transactionMock,
          },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
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

  describe("updateRace", () => {
    it("publishes a RaceStateChange message when the race state changes", async () => {
      findUniqueMock.mockResolvedValue({
        id: 1,
        raceState: RaceState.WAITING_TO_RACE,
      });
      updateMock.mockResolvedValue({ id: 1, raceState: RaceState.RACING });

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
      findUniqueMock.mockResolvedValue({ id: 1, raceState: RaceState.LISTED });
      updateMock.mockResolvedValue({ id: 1, raceState: RaceState.LISTED });

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.LISTED, person1: "A" },
      });

      expect(mqttClient.publish).not.toHaveBeenCalled();
    });

    it("persists raceStartedAt and raceFinishedAt", async () => {
      const raceStartedAt = "2026-10-09T20:00:00.000Z";
      const raceFinishedAt = "2026-10-09T20:00:25.000Z";
      findUniqueMock.mockResolvedValue({ id: 1, raceState: RaceState.RACING });
      updateMock.mockResolvedValue({ id: 1, raceState: RaceState.RACED });

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.RACED, raceStartedAt, raceFinishedAt },
      });

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ raceStartedAt, raceFinishedAt }),
        }),
      );
    });

    it("does not publish when there is no existing race to compare against", async () => {
      findUniqueMock.mockResolvedValue(null);
      updateMock.mockResolvedValue({ id: 1, raceState: RaceState.LISTED });

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.LISTED },
      });

      expect(mqttClient.publish).not.toHaveBeenCalled();
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

    it("resets other races with a state outside CANCELED/LISTED/DONE/WAITING_FOR_OPPONENT to LISTED when this race becomes active", async () => {
      findUniqueMock.mockResolvedValue({ id: 1, raceState: RaceState.LISTED });
      updateMock.mockResolvedValueOnce({ id: 1, raceState: RaceState.RACING });
      findManyMock.mockResolvedValue([
        { id: 2, raceState: RaceState.WAITING_TO_RACE },
        { id: 3, raceState: RaceState.RACED },
      ]);
      updateMock.mockResolvedValueOnce({ id: 2, raceState: RaceState.LISTED });
      updateMock.mockResolvedValueOnce({ id: 3, raceState: RaceState.LISTED });

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.RACING },
      });

      expect(findManyMock).toHaveBeenCalledWith({
        where: {
          id: { not: 1 },
          raceState: { notIn: ALLOWED_INACTIVE_STATES },
        },
      });
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { raceState: RaceState.LISTED },
      });
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 3 },
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

    it.each(ALLOWED_INACTIVE_STATES)(
      "does not query for other races when this race is set to %s",
      async (allowedState) => {
        findUniqueMock.mockResolvedValue({
          id: 1,
          raceState: RaceState.RACING,
        });
        updateMock.mockResolvedValue({ id: 1, raceState: allowedState });

        await service.updateRace({
          where: { id: 1 },
          data: { raceState: allowedState },
        });

        expect(findManyMock).not.toHaveBeenCalled();
      },
    );

    it("does nothing extra when there are no other active races", async () => {
      findUniqueMock.mockResolvedValue({ id: 1, raceState: RaceState.LISTED });
      updateMock.mockResolvedValue({ id: 1, raceState: RaceState.RACING });
      findManyMock.mockResolvedValue([]);

      await service.updateRace({
        where: { id: 1 },
        data: { raceState: RaceState.RACING },
      });

      expect(updateMock).toHaveBeenCalledTimes(1);
    });
  });
});
