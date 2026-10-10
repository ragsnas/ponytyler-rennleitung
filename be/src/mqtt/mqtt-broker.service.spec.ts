import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { createServer, Server } from "net";
import { ConfigService } from "@nestjs/config";
import { RaceState, ShowState } from "@prisma/client";
import * as mqtt from "mqtt";
import { MqttBrokerService } from "./mqtt-broker.service";
import { RaceService } from "../prisma-api/race.service";
import { ShowService } from "../prisma-api/show.service";

const TEST_MQTT_PORT = 18830;
const TEST_MQTT_WS_PORT = 18831;

describe("MqttBrokerService", () => {
  let service: MqttBrokerService;
  let raceService: { currentRace: jest.Mock; updateRace: jest.Mock };
  let showService: { getCurrentShow: jest.Mock; updateShow: jest.Mock };

  beforeEach(async () => {
    raceService = {
      currentRace: jest.fn(),
      updateRace: jest.fn().mockResolvedValue(undefined),
    };
    showService = {
      getCurrentShow: jest.fn().mockResolvedValue({ id: 7 }),
      updateShow: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MqttBrokerService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === "MQTT_PORT"
                ? TEST_MQTT_PORT
                : key === "MQTT_WS_PORT"
                  ? TEST_MQTT_WS_PORT
                  : undefined,
          },
        },
        { provide: RaceService, useValue: raceService },
        { provide: ShowService, useValue: showService },
      ],
    }).compile();

    service = module.get(MqttBrokerService);
    await service.onApplicationBootstrap();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it("delivers messages published over the plain TCP listener to subscribers connected over WebSocket", async () => {
    const subscriber = mqtt.connect(`ws://localhost:${TEST_MQTT_WS_PORT}`);
    const publisher = mqtt.connect(`mqtt://localhost:${TEST_MQTT_PORT}`);
    const subscriberConnected = waitForEvent(subscriber, "connect");
    const publisherConnected = waitForEvent(publisher, "connect");

    try {
      await Promise.all([subscriberConnected, publisherConnected]);

      const receivedMessage = new Promise<{ topic: string; payload: string }>(
        (resolve) => {
          subscriber.on("message", (topic, payload) =>
            resolve({ topic, payload: payload.toString() }),
          );
        },
      );

      await new Promise<void>((resolve, reject) => {
        subscriber.subscribe("#", (err) => (err ? reject(err) : resolve()));
      });

      publisher.publish(
        "Bike/1",
        JSON.stringify({ pulsecount: 1, sequenz: 1, timestamp: 1 }),
      );

      const message = await receivedMessage;
      expect(message.topic).toBe("Bike/1");
      expect(JSON.parse(message.payload)).toEqual({
        pulsecount: 1,
        sequenz: 1,
        timestamp: 1,
      });
    } finally {
      subscriber.end(true);
      publisher.end(true);
    }
  });

  it("marks the current race as RACED for the winning bike and the show as RACE_FINISHED once a bike wins", async () => {
    raceService.currentRace.mockResolvedValue({ id: 42, showId: 7 });
    const showUpdated = new Promise<void>((resolve) => {
      showService.updateShow.mockImplementation(async () => {
        resolve();
      });
    });

    const publisher = mqtt.connect(`mqtt://localhost:${TEST_MQTT_PORT}`);
    try {
      await waitForEvent(publisher, "connect");

      publisher.publish(
        "Bike/1",
        JSON.stringify({ pulsecount: 121, sequenz: 10, timestamp: 1000 }),
      );
      publisher.publish(
        "Bike/1",
        JSON.stringify({ pulsecount: 125, sequenz: 14, timestamp: 1010 }),
      );

      await showUpdated;

      expect(raceService.currentRace).toHaveBeenCalled();
      expect(raceService.updateRace).toHaveBeenCalledWith({
        where: { id: 42 },
        data: {
          showId: 7,
          bikeWon: 1,
          raceFinishedAt: expect.any(String),
          raceState: RaceState.RACED,
          raced: true,
        },
      });
      expect(showService.updateShow).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { showState: ShowState.RACE_FINISHED },
      });
    } finally {
      publisher.end(true);
    }
  });

  it("detects the winner of the next race once its RaceStateChange to WAITING_TO_RACE arrives", async () => {
    raceService.currentRace
      .mockResolvedValueOnce({ id: 42, showId: 7 })
      .mockResolvedValueOnce({ id: 43, showId: 7 });
    const racesWon: number[] = [];
    const bothRacesDecided = new Promise<void>((resolve) => {
      raceService.updateRace.mockImplementation(
        async (args: { data: { bikeWon: number } }) => {
          racesWon.push(args.data.bikeWon);
          if (racesWon.length === 2) {
            resolve();
          }
        },
      );
    });

    const publisher = mqtt.connect(`mqtt://localhost:${TEST_MQTT_PORT}`);
    try {
      await waitForEvent(publisher, "connect");

      // race 1: bike 1 wins
      publisher.publish(
        "Bike/1",
        JSON.stringify({ pulsecount: 121, sequenz: 10, timestamp: 1000 }),
      );
      await waitUntil(() => racesWon.length === 1);

      // race 2: the countdown starts, then bike 2 wins
      publisher.publish(
        "RaceStateChange",
        JSON.stringify({ raceId: "43", state: RaceState.WAITING_TO_RACE }),
      );
      publisher.publish(
        "Bike/2",
        JSON.stringify({ pulsecount: 121, sequenz: 3, timestamp: 300 }),
      );

      await bothRacesDecided;

      expect(racesWon).toEqual([1, 2]);
    } finally {
      publisher.end(true);
    }
  }, 15000);

  it("logs a RaceStateChange payload as text, not as a logger context object", async () => {
    const logSpy = jest.spyOn(Logger.prototype, "log");
    const publisher = mqtt.connect(`mqtt://localhost:${TEST_MQTT_PORT}`);
    try {
      await waitForEvent(publisher, "connect");

      publisher.publish(
        "RaceStateChange",
        JSON.stringify({ raceId: "43", state: RaceState.LISTED }),
      );
      await waitUntil(() =>
        logSpy.mock.calls.some(([message]) =>
          String(message).includes("RaceStateChange"),
        ),
      );

      const withContext = logSpy.mock.calls.filter(
        ([, context]) => typeof context === "object",
      );
      expect(withContext).toEqual([]);
      const line = logSpy.mock.calls
        .map(([message]) => String(message))
        .find((message) => message.includes("RaceStateChange"));
      expect(line).toContain(RaceState.LISTED);
    } finally {
      logSpy.mockRestore();
      publisher.end(true);
    }
  });

  it("does not decide a winner after the module has been destroyed", async () => {
    raceService.currentRace.mockResolvedValue({ id: 42, showId: 7 });
    const publisher = mqtt.connect(`mqtt://localhost:${TEST_MQTT_PORT}`);
    try {
      await waitForEvent(publisher, "connect");
      await new Promise<void>((resolve, reject) => {
        publisher.subscribe("Bike/1", (err) => (err ? reject(err) : resolve()));
      });
      const received = new Promise<void>((resolve) =>
        publisher.once("message", () => resolve()),
      );
      publisher.publish(
        "Bike/1",
        JSON.stringify({ pulsecount: 121, sequenz: 10, timestamp: 1000 }),
      );
      await received;

      await service.onModuleDestroy();
      await new Promise((resolve) => setTimeout(resolve, 1300));

      expect(raceService.currentRace).not.toHaveBeenCalled();
    } finally {
      publisher.end(true);
    }
  }, 10000);

  it("does not fail the broker when no current race can be found for a winning bike", async () => {
    raceService.currentRace.mockResolvedValue(null);
    const currentRaceLookedUp = new Promise<void>((resolve) => {
      raceService.currentRace.mockImplementation(async () => {
        resolve();
        return null;
      });
    });

    const publisher = mqtt.connect(`mqtt://localhost:${TEST_MQTT_PORT}`);
    try {
      await waitForEvent(publisher, "connect");

      publisher.publish(
        "Bike/1",
        JSON.stringify({ pulsecount: 121, sequenz: 10, timestamp: 1000 }),
      );
      publisher.publish(
        "Bike/1",
        JSON.stringify({ pulsecount: 125, sequenz: 14, timestamp: 1010 }),
      );

      await currentRaceLookedUp;

      expect(raceService.updateRace).not.toHaveBeenCalled();
      expect(showService.updateShow).not.toHaveBeenCalled();
    } finally {
      publisher.end(true);
    }
  });
});

describe("MqttBrokerService startup failures", () => {
  const PORT = 18840;
  const WS_PORT = 18841;
  let blocker: Server | undefined;
  let service: MqttBrokerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MqttBrokerService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === "MQTT_PORT"
                ? PORT
                : key === "MQTT_WS_PORT"
                  ? WS_PORT
                  : undefined,
          },
        },
        { provide: RaceService, useValue: {} },
        { provide: ShowService, useValue: {} },
      ],
    }).compile();
    service = module.get(MqttBrokerService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
    await new Promise<void>((resolve) =>
      blocker ? blocker.close(() => resolve()) : resolve(),
    );
    blocker = undefined;
  });

  function occupy(port: number): Promise<void> {
    blocker = createServer();
    return new Promise((resolve) => blocker!.listen(port, resolve));
  }

  it("rejects the bootstrap instead of hanging when the TCP port is already in use", async () => {
    await occupy(PORT);

    await expect(service.onApplicationBootstrap()).rejects.toMatchObject({
      code: "EADDRINUSE",
    });
  });

  it("rejects the bootstrap when the WebSocket port is already in use and releases the TCP port again", async () => {
    await occupy(WS_PORT);

    await expect(service.onApplicationBootstrap()).rejects.toMatchObject({
      code: "EADDRINUSE",
    });

    // the TCP listener started before the failure must not stay behind
    await service.onModuleDestroy();
    await expect(occupyAndRelease(PORT)).resolves.toBeUndefined();
  });
});

function occupyAndRelease(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(port, () => probe.close(() => resolve()));
  });
}

function waitForEvent(
  client: mqtt.MqttClient,
  event: "connect",
): Promise<void> {
  return new Promise((resolve, reject) => {
    client.once(event, () => resolve());
    client.once("error", reject);
  });
}

async function waitUntil(condition: () => boolean, timeoutMs = 5000) {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("timed out waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
