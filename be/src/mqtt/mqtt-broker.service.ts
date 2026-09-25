import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Aedes, AedesPublishPacket, Client, Subscription } from "aedes";
import { createServer as createTcpServer, Server } from "net";
import { createServer as createWsCapableServer } from "aedes-server-factory";
import { Server as HttpServer } from "http";
import { Race, RaceState, Show, ShowState } from "@prisma/client";
import { RaceService } from "../prisma-api/race.service";
import { ShowService } from "../prisma-api/show.service";
import mqtt from "mqtt";
import * as os from "os";

type BikeStatusMessage = {
  pulsecount: number;
  sequenz: number;
  timestamp: number;
};

interface BikeState {
  finished: boolean;
  finishObservedAtSequenz: number | undefined;
  mostRecentStatus: BikeStatusMessage;
  won: boolean | undefined;
}

type BikeId = "1" | "2";

const MAX_BIKE_ADVANCE = 120; // 5 milliseconds
const ADDITIONAL_SEQUENCE_STORAGE = 4;
const DEFAULT_MQTT_PORT = 3001;
const DEFAULT_MQTT_WS_PORT = 3002;

const BIKE_STATUS_TOPIC = /^Bike\/[1-2]{1}$/i;
const BIKE_CMD_TOPIC = /^Bike\/[1-2]{1}\/cmd$/i;

function initialBikeState(): BikeState {
  return {
    finished: false,
    finishObservedAtSequenz: undefined,
    won: undefined,
    mostRecentStatus: { pulsecount: 0, sequenz: 0, timestamp: 0 },
  };
}

/**
 * Hosts an embedded MQTT broker (Aedes) inside the NestJS process so bike
 * sensors / the show control hardware can publish race telemetry directly
 * to the backend without a separate broker process. See src/mqtt/README.md.
 *
 * Alongside the plain TCP listener, it also exposes the same broker over
 * MQTT-over-WebSocket so browser clients (e.g. the "MQTT Broker" page in
 * the Angular frontend) can subscribe without a native TCP socket.
 */
@Injectable()
export class MqttBrokerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(MqttBrokerService.name);
  private readonly utf16Decoder = new TextDecoder("UTF-8");

  private broker: Aedes | undefined;
  private server: Server | undefined;
  private wsServer: HttpServer | undefined;
  private client: mqtt.MqttClient | undefined;

  private readonly bikeState: Map<BikeId, BikeState> = new Map([
    ["1", initialBikeState()],
    ["2", initialBikeState()],
  ]);
  private readonly bikeStates: Map<BikeId, BikeStatusMessage[]> = new Map([
    ["1", []],
    ["2", []],
  ]);

  constructor(
    private readonly configService: ConfigService,
    private readonly raceService: RaceService,
    private readonly showService: ShowService,
  ) {}

  async onApplicationBootstrap() {
    const port = Number(
      this.configService.get("MQTT_PORT") ?? DEFAULT_MQTT_PORT,
    );
    const wsPort = Number(
      this.configService.get("MQTT_WS_PORT") ?? DEFAULT_MQTT_WS_PORT,
    );

    this.broker = await Aedes.createBroker();
    this.server = createTcpServer(this.broker.handle);
    this.wsServer = createWsCapableServer(this.broker, {
      ws: true,
    }) as HttpServer;
    this.registerBrokerListeners(this.broker);

    await new Promise<void>((resolve) => this.server!.listen(port, resolve));
    this.logger.log(`🚀 MQTT Broker started and listening on port ${port}`);

    await new Promise<void>((resolve) =>
      this.wsServer!.listen(wsPort, resolve),
    );
    this.logger.log(`🚀 MQTT-over-WebSocket listening on port ${wsPort}`);

    const mqttUri = `mqtt://${os.hostname()}:${port}`;
    this.client = mqtt.connect(mqttUri, {
      clientId: "mqtt-broker-itself",
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await new Promise<void>((resolve) => this.client!.end(true, {}, () => resolve()));
    }
    if (this.server) {
      await new Promise<void>((resolve) => this.server!.close(() => resolve()));
    }
    if (this.wsServer) {
      await new Promise<void>((resolve) =>
        this.wsServer!.close(() => resolve()),
      );
    }
    if (this.broker) {
      await new Promise<void>((resolve) => this.broker!.close(() => resolve()));
    }
    this.logger.log("MQTT Broker stopped");
  }

  private registerBrokerListeners(broker: Aedes) {
    broker.on("client", (client: Client) => {
      this.logger.log(`🔗 Client Connected: ${client ? client.id : "unknown"}`);
    });

    broker.on("subscribe", (subscriptions: Subscription[], client: Client) => {
      this.logger.log(
        `📝 Client ${client ? client.id : "unknown"} subscribed to: ${subscriptions.map((s) => s.topic).join(", ")}`,
      );
    });

    broker.on(
      "publish",
      (packet: AedesPublishPacket, client: Client | null) => {
        this.handlePublish(packet, client);
      },
    );
  }

  private handlePublish(packet: AedesPublishPacket, client: Client | null) {
    const payloadText =
      typeof packet.payload === "string"
        ? packet.payload
        : this.utf16Decoder.decode(packet.payload);
    let payloadObject: any = undefined;
    try {
      payloadObject = JSON.parse(payloadText);
    } catch {
      this.logger.log(
        `📝 Client ${client ? client.id : "unknown"} published unparsable payload: ${payloadText}`,
      );
    }

    const topic = packet.topic;
    if (payloadObject && BIKE_STATUS_TOPIC.test(topic)) {
      const bikeId = topic.substr(5) as BikeId;
      if (this.isBikeStatusPayload(payloadObject)) {
        this.handleBikeStatus(bikeId, payloadObject as BikeStatusMessage);
      }
    } else if (payloadObject && BIKE_CMD_TOPIC.test(topic)) {
      const bikeId = topic.substr(5);
      this.logger.log(
        `📝 Client ${client ? client.id : "unknown"} published command for Bike ${bikeId}: ${payloadText}`,
      );
    } else {
      this.logger.log(
        `📝 Client ${client ? client.id : "unknown"} published unrecognizable message [topic=${topic}]: ${payloadText}`,
      );
    }
  }

  private handleBikeStatus(bikeId: BikeId, payloadObject: BikeStatusMessage) {
    if (payloadObject.pulsecount <= MAX_BIKE_ADVANCE) {
      this.addBikeState(bikeId, payloadObject);
      return;
    }

    let thisBikeState = this.bikeState.get(bikeId)!;
    if (!thisBikeState.finished) {
      this.logger.log(
        `🏁 Bike ${bikeId} finished: ${JSON.stringify(payloadObject)}`,
      );
      thisBikeState = this.updatePartialBikeState(bikeId, {
        finishObservedAtSequenz: payloadObject.sequenz,
        finished: true,
      });
    }

    const maxSequenzToRecord =
      thisBikeState.finishObservedAtSequenz! + ADDITIONAL_SEQUENCE_STORAGE;
    if (payloadObject.sequenz < maxSequenzToRecord) {
      this.logger.log(
        `📝 Adding additional state (seq ${maxSequenzToRecord}) for Bike ${bikeId}`,
      );
      this.addBikeState(bikeId, payloadObject);
      return;
    }

    if (thisBikeState.won) {
      return;
    }
    const otherId: BikeId = bikeId === "1" ? "2" : "1";
    const otherBikeState = this.bikeState.get(otherId)!;
    if (otherBikeState.won) {
      return;
    }

    this.logger.log(`Analyzing Bike ${bikeId}:`);
    if (
      !otherBikeState.finished ||
      otherBikeState.mostRecentStatus.timestamp >
        thisBikeState.mostRecentStatus.timestamp
    ) {
      this.updatePartialBikeState(bikeId, { won: true });
      void this.markCurrentRaceAsWonBy(bikeId);
      // @TODO: send mqtt message about bike win
      const bikeWonTopic = `Bike/${bikeId}/won`;
      if (this.client) {
        this.client.publish(
          bikeWonTopic,
          '',
          { qos: 1 },
          (err) => {
            if (err) {
              console.error("❌ Failed to publish:", err);
            } else {
              console.log(`🚀 Message sent to ${bikeWonTopic}`);
            }
          });
      }
      this.logger.log(`🏆 Bike ${bikeId === "1" ? "1️⃣" : "2️⃣"} won! 🎉`);
    }
  }

  private async markCurrentRaceAsWonBy(bikeId: BikeId): Promise<void> {
    try {
      const show: Show = await this.showService.currentShow();
      const race: Race = await this.raceService.currentRace(show.id);
      if (!race) {
        this.logger.warn(
          `No current race found while marking Bike ${bikeId} as winner`,
        );
        return;
      }

      await this.raceService.updateRace({
        where: { id: race.id },
        data: {
          showId: race.showId,
          bikeWon: Number(bikeId),
          raceState: RaceState.RACED,
          raced: true,
        },
      });

      await this.showService.updateShow({
        where: { id: race.showId },
        data: { showState: ShowState.RACE_FINISHED },
      });
    } catch (error) {
      this.logger.error(`Failed to persist win for Bike ${bikeId}: ${error}`);
    }
  }

  private isBikeStatusPayload(
    payloadObject: object,
  ): payloadObject is BikeStatusMessage {
    const hasOwn = Object.prototype.hasOwnProperty;
    return (
      hasOwn.call(payloadObject, "pulsecount") &&
      hasOwn.call(payloadObject, "timestamp") &&
      hasOwn.call(payloadObject, "sequenz")
    );
  }

  private updatePartialBikeState(
    bikeId: BikeId,
    element: Partial<BikeState>,
  ): BikeState {
    this.logger.log(
      `📝 updatePartialBikeState for Bike ${bikeId}: ${JSON.stringify(element)}`,
    );
    const updated: BikeState = {
      ...this.bikeState.get(bikeId),
      ...element,
    } as BikeState;
    this.bikeState.set(bikeId, updated);
    return updated;
  }

  private addBikeState(bikeId: BikeId, bikeStatusMessage: BikeStatusMessage) {
    const bikeStatusMessages = this.bikeStates.get(bikeId) || [];
    const bikeStateForThisBike: BikeState =
      this.bikeState.get(bikeId) || initialBikeState();
    bikeStatusMessages.push(bikeStatusMessage);
    if (
      (!bikeStateForThisBike.finished &&
        bikeStatusMessage.sequenz >
          bikeStateForThisBike.mostRecentStatus?.sequenz) ||
      (bikeStateForThisBike.finished &&
        bikeStatusMessage.pulsecount > MAX_BIKE_ADVANCE &&
        bikeStatusMessage.sequenz <
          bikeStateForThisBike.mostRecentStatus?.sequenz)
    ) {
      this.updatePartialBikeState(bikeId, {
        mostRecentStatus: bikeStatusMessage,
      });
    }
    this.bikeStates.set(bikeId, bikeStatusMessages);
    this.bikeState.set(bikeId, bikeStateForThisBike);
  }
}
