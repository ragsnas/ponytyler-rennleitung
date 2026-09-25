import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import * as mqtt from "mqtt";
import { ShowService } from "./show.service";
import { PrismaService } from "./prisma.service";
import { ShowState } from "@prisma/client";

jest.mock("mqtt", () => ({
  connect: jest.fn(),
}));

describe("ShowService", () => {
  let service: ShowService;
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
        ShowService,
        {
          provide: PrismaService,
          useValue: {
            show: { findUnique: findUniqueMock, update: updateMock },
          },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(ShowService);
  });

  it("connects an mqtt client to the broker on construction", () => {
    expect(mqtt.connect).toHaveBeenCalledWith(
      expect.stringMatching(/^mqtt:\/\//),
      expect.objectContaining({ clientId: expect.any(String) }),
    );
  });

  describe("updateShow", () => {
    it("publishes a ShowStateChange message when the show state changes", async () => {
      findUniqueMock.mockResolvedValue({
        id: 1,
        showState: ShowState.LISTED,
      });
      updateMock.mockResolvedValue({ id: 1, showState: ShowState.RACE });

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.RACE },
      });

      expect(mqttClient.publish).toHaveBeenCalledWith(
        "ShowStateChange",
        JSON.stringify({ showId: 1, state: ShowState.RACE }),
      );
    });

    it("does not publish a message when the show state stays the same", async () => {
      findUniqueMock.mockResolvedValue({ id: 1, showState: ShowState.LISTED });
      updateMock.mockResolvedValue({ id: 1, showState: ShowState.LISTED });

      await service.updateShow({
        where: { id: 1 },
        data: { active: true },
      });

      expect(mqttClient.publish).not.toHaveBeenCalled();
    });

    it("does not publish when there is no existing show to compare against", async () => {
      findUniqueMock.mockResolvedValue(null);
      updateMock.mockResolvedValue({ id: 1, showState: ShowState.LISTED });

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.LISTED },
      });

      expect(mqttClient.publish).not.toHaveBeenCalled();
    });
  });
});
