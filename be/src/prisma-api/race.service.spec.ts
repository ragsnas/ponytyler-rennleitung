import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import * as mqtt from "mqtt";
import { RaceService } from "./race.service";
import { PrismaService } from "./prisma.service";
import { RaceState } from "../race/race-state.enum";

jest.mock("mqtt", () => ({
  connect: jest.fn(),
}));

describe("RaceService", () => {
  let service: RaceService;
  let findUniqueMock: jest.Mock;
  let updateMock: jest.Mock;
  let findManyMock: jest.Mock;
  let mqttClient: { publish: jest.Mock };

  beforeEach(async () => {
    findUniqueMock = jest.fn();
    updateMock = jest.fn();
    findManyMock = jest.fn().mockResolvedValue([]);
    mqttClient = { publish: jest.fn() };
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
        JSON.stringify({ raceId: 1, state: RaceState.RACING }),
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
        JSON.stringify({ raceId: 2, state: RaceState.LISTED }),
      );
      expect(mqttClient.publish).toHaveBeenCalledWith(
        "RaceStateChange",
        JSON.stringify({ raceId: 3, state: RaceState.LISTED }),
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
