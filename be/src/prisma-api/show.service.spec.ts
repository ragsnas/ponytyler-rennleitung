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
        ShowService,
        {
          provide: PrismaService,
          useValue: {
            show: {
              findUnique: findUniqueMock,
              update: updateMock,
              findMany: findManyMock,
            },
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

  describe("updateShow - single active show enforcement", () => {
    it("resets other shows with a non-LISTED/SHOW_FINISHED state to LISTED when this show becomes active", async () => {
      findUniqueMock.mockResolvedValue({ id: 1, showState: ShowState.LISTED });
      updateMock.mockResolvedValueOnce({ id: 1, showState: ShowState.RACE });
      findManyMock.mockResolvedValue([
        { id: 2, showState: ShowState.BEFORE_SHOW },
        { id: 3, showState: ShowState.RACE_FINISHED },
      ]);
      updateMock.mockResolvedValueOnce({ id: 2, showState: ShowState.LISTED });
      updateMock.mockResolvedValueOnce({ id: 3, showState: ShowState.LISTED });

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.RACE },
      });

      expect(findManyMock).toHaveBeenCalledWith({
        where: {
          id: { not: 1 },
          showState: { notIn: [ShowState.LISTED, ShowState.SHOW_FINISHED] },
        },
      });
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { showState: ShowState.LISTED },
      });
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { showState: ShowState.LISTED },
      });
      expect(mqttClient.publish).toHaveBeenCalledWith(
        "ShowStateChange",
        JSON.stringify({ showId: 2, state: ShowState.LISTED }),
      );
      expect(mqttClient.publish).toHaveBeenCalledWith(
        "ShowStateChange",
        JSON.stringify({ showId: 3, state: ShowState.LISTED }),
      );
    });

    it("does not query for other shows when this show is set to LISTED", async () => {
      findUniqueMock.mockResolvedValue({ id: 1, showState: ShowState.RACE });
      updateMock.mockResolvedValue({ id: 1, showState: ShowState.LISTED });

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.LISTED },
      });

      expect(findManyMock).not.toHaveBeenCalled();
    });

    it("does not query for other shows when this show is set to SHOW_FINISHED", async () => {
      findUniqueMock.mockResolvedValue({ id: 1, showState: ShowState.RACE });
      updateMock.mockResolvedValue({ id: 1, showState: ShowState.SHOW_FINISHED });

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.SHOW_FINISHED },
      });

      expect(findManyMock).not.toHaveBeenCalled();
    });

    it("does nothing extra when there are no other active shows", async () => {
      findUniqueMock.mockResolvedValue({ id: 1, showState: ShowState.LISTED });
      updateMock.mockResolvedValue({ id: 1, showState: ShowState.RACE });
      findManyMock.mockResolvedValue([]);

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.RACE },
      });

      expect(updateMock).toHaveBeenCalledTimes(1);
    });
  });
});
