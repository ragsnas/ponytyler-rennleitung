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
  let mqttClient: { publish: jest.Mock };

  beforeEach(async () => {
    findUniqueMock = jest.fn();
    updateMock = jest.fn();
    mqttClient = { publish: jest.fn() };
    (mqtt.connect as jest.Mock).mockReturnValue(mqttClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RaceService,
        {
          provide: PrismaService,
          useValue: {
            race: { findUnique: findUniqueMock, update: updateMock },
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
});
