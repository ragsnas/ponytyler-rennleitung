import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import * as mqtt from "mqtt";
import { MqttBrokerService } from "./mqtt-broker.service";

const TEST_MQTT_PORT = 18830;
const TEST_MQTT_WS_PORT = 18831;

describe("MqttBrokerService", () => {
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
                ? TEST_MQTT_PORT
                : key === "MQTT_WS_PORT"
                  ? TEST_MQTT_WS_PORT
                  : undefined,
          },
        },
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
