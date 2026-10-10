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
  let deleteMock: jest.Mock;
  let findFirstMock: jest.Mock;
  let transactionMock: jest.Mock;
  let tx: {
    show: {
      findUnique: jest.Mock;
      update: jest.Mock;
      updateManyAndReturn: jest.Mock;
    };
    $executeRaw: jest.Mock;
  };
  let events: string[];
  let mqttClient: { publish: jest.Mock; end: jest.Mock };

  beforeEach(async () => {
    findUniqueMock = jest.fn();
    updateMock = jest.fn();
    findManyMock = jest.fn().mockResolvedValue([]);
    deleteMock = jest.fn();
    findFirstMock = jest.fn();
    events = [];
    tx = {
      show: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateManyAndReturn: jest.fn().mockResolvedValue([]),
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
        ShowService,
        {
          provide: PrismaService,
          useValue: {
            show: {
              findUnique: findUniqueMock,
              update: updateMock,
              findMany: findManyMock,
              delete: deleteMock,
              findFirst: findFirstMock,
            },
            $transaction: transactionMock,
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

  it("closes the mqtt client when the module is destroyed", () => {
    service.onModuleDestroy();

    expect(mqttClient.end).toHaveBeenCalled();
  });

  describe("getCurrentShow", () => {
    it("is the newest active show: ordered by date (undated last), then id, both descending", async () => {
      findFirstMock.mockResolvedValue({ id: 3 });

      const result = await service.getCurrentShow();

      expect(result).toEqual({ id: 3 });
      expect(findFirstMock).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: [{ date: { sort: "desc", nulls: "last" } }, { id: "desc" }],
      });
    });

    it("is null when no show is active", async () => {
      findFirstMock.mockResolvedValue(null);

      expect(await service.getCurrentShow()).toBeNull();
    });
  });

  describe("deleteShowWithRacesAndShifts", () => {
    it("deletes only the show; the database cascades to races, shifts, shift roles and encore songs", async () => {
      deleteMock.mockResolvedValue({ id: 7 });

      const result = await service.deleteShowWithRacesAndShifts("7");

      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(deleteMock).toHaveBeenCalledWith({ where: { id: 7 } });
      expect(result).toEqual({ id: 7 });
    });

    it("needs no extra reads or transaction", async () => {
      deleteMock.mockResolvedValue({ id: 7 });

      await service.deleteShowWithRacesAndShifts("7");

      expect(findManyMock).not.toHaveBeenCalled();
      expect(transactionMock).not.toHaveBeenCalled();
    });
  });

  describe("updateShow", () => {
    it("publishes a ShowStateChange message when the show state changes", async () => {
      tx.show.findUnique.mockResolvedValue({
        id: 1,
        showState: ShowState.LISTED,
      });
      tx.show.update.mockResolvedValue({ id: 1, showState: ShowState.RACE });

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.RACE },
      });

      expect(mqttClient.publish).toHaveBeenCalledWith(
        "ShowStateChange",
        JSON.stringify({ showId: "1", state: ShowState.RACE }),
      );
    });

    it("does not publish a message when the show state stays the same", async () => {
      tx.show.findUnique.mockResolvedValue({
        id: 1,
        showState: ShowState.LISTED,
      });
      tx.show.update.mockResolvedValue({ id: 1, showState: ShowState.LISTED });

      await service.updateShow({
        where: { id: 1 },
        data: { active: true },
      });

      expect(mqttClient.publish).not.toHaveBeenCalled();
    });

    it("does not publish when there is no existing show to compare against", async () => {
      tx.show.findUnique.mockResolvedValue(null);
      tx.show.update.mockResolvedValue({ id: 1, showState: ShowState.LISTED });

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.LISTED },
      });

      expect(mqttClient.publish).not.toHaveBeenCalled();
    });

    it("does all its database work inside one transaction", async () => {
      tx.show.findUnique.mockResolvedValue({
        id: 1,
        showState: ShowState.LISTED,
      });
      tx.show.update.mockResolvedValue({ id: 1, showState: ShowState.RACE });

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.RACE },
      });

      expect(transactionMock).toHaveBeenCalledWith(expect.any(Function));
      expect(updateMock).not.toHaveBeenCalled();
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it("serialises concurrent show updates by taking a lock before writing", async () => {
      tx.show.findUnique.mockResolvedValue({
        id: 1,
        showState: ShowState.LISTED,
      });
      tx.show.update.mockImplementation(async () => {
        events.push("update");
        return { id: 1, showState: ShowState.RACE };
      });

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.RACE },
      });

      expect(events).toEqual(["lock", "update"]);
    });

    it("publishes only after the transaction has committed, and not at all when it fails", async () => {
      tx.show.findUnique.mockResolvedValue({
        id: 1,
        showState: ShowState.LISTED,
      });
      tx.show.update.mockResolvedValue({ id: 1, showState: ShowState.RACE });
      let publishedInsideTransaction = -1;
      transactionMock.mockImplementationOnce(
        async (work: (t: typeof tx) => unknown) => {
          const result = await work(tx);
          publishedInsideTransaction = mqttClient.publish.mock.calls.length;
          return result;
        },
      );

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.RACE },
      });
      expect(publishedInsideTransaction).toBe(0);
      expect(mqttClient.publish).toHaveBeenCalledTimes(1);

      mqttClient.publish.mockClear();
      tx.show.updateManyAndReturn.mockRejectedValue(new Error("boom"));
      await expect(
        service.updateShow({
          where: { id: 1 },
          data: { showState: ShowState.RACE },
        }),
      ).rejects.toThrow("boom");
      expect(mqttClient.publish).not.toHaveBeenCalled();
    });
  });

  describe("updateShow - single active show enforcement", () => {
    it("resets all other active shows to LISTED with one update when this show becomes active", async () => {
      tx.show.findUnique.mockResolvedValue({
        id: 1,
        showState: ShowState.LISTED,
      });
      tx.show.update.mockResolvedValue({ id: 1, showState: ShowState.RACE });
      tx.show.updateManyAndReturn.mockResolvedValue([
        { id: 2, showState: ShowState.LISTED },
        { id: 3, showState: ShowState.LISTED },
      ]);

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.RACE },
      });

      expect(tx.show.updateManyAndReturn).toHaveBeenCalledTimes(1);
      expect(tx.show.updateManyAndReturn).toHaveBeenCalledWith({
        where: {
          id: { not: 1 },
          showState: { notIn: [ShowState.LISTED, ShowState.SHOW_FINISHED] },
        },
        data: { showState: ShowState.LISTED },
      });
      expect(mqttClient.publish).toHaveBeenCalledWith(
        "ShowStateChange",
        JSON.stringify({ showId: "2", state: ShowState.LISTED }),
      );
      expect(mqttClient.publish).toHaveBeenCalledWith(
        "ShowStateChange",
        JSON.stringify({ showId: "3", state: ShowState.LISTED }),
      );
    });

    it.each([ShowState.LISTED, ShowState.SHOW_FINISHED])(
      "does not reset other shows when this show is set to %s",
      async (inactiveState) => {
        tx.show.findUnique.mockResolvedValue({
          id: 1,
          showState: ShowState.RACE,
        });
        tx.show.update.mockResolvedValue({ id: 1, showState: inactiveState });

        await service.updateShow({
          where: { id: 1 },
          data: { showState: inactiveState },
        });

        expect(tx.show.updateManyAndReturn).not.toHaveBeenCalled();
      },
    );

    it("publishes nothing extra when there are no other active shows", async () => {
      tx.show.findUnique.mockResolvedValue({
        id: 1,
        showState: ShowState.LISTED,
      });
      tx.show.update.mockResolvedValue({ id: 1, showState: ShowState.RACE });

      await service.updateShow({
        where: { id: 1 },
        data: { showState: ShowState.RACE },
      });

      expect(mqttClient.publish).toHaveBeenCalledTimes(1);
    });
  });
});
