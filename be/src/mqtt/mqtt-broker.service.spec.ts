import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { ShowState } from "@prisma/client";
import * as mqtt from "mqtt";
import { MqttBrokerService } from "./mqtt-broker.service";
import { RaceService } from "../prisma-api/race.service";
import { ShowService } from "../prisma-api/show.service";
import { RaceState } from "../race/race-state.enum";

const TEST_MQTT_PORT = 18830;
const TEST_MQTT_WS_PORT = 18831;

describe("MqttBrokerService", () => {
  let service: MqttBrokerService;
  let raceService: { currentRace: jest.Mock; updateRace: jest.Mock };
  let showService: { currentShow: jest.Mock; updateShow: jest.Mock };

  beforeEach(async () => {
    raceService = {
      currentRace: jest.fn(),
      updateRace: jest.fn().mockResolvedValue(undefined),
    };
    showService = {
      currentShow: jest.fn().mockResolvedValue({ id: 7 }),
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

function waitForEvent(
  client: mqtt.MqttClient,
  event: "connect",
): Promise<void> {
  return new Promise((resolve, reject) => {
    client.once(event, () => resolve());
    client.once("error", reject);
  });
}
