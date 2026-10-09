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
import {
  BikeId,
  BikeRaceTracker,
  BikeStatusMessage,
  Winner,
} from "./bike-race-tracker";

const DEFAULT_MQTT_PORT = 3001;
const DEFAULT_MQTT_WS_PORT = 3002;

const BIKE_STATUS_TOPIC = /^Bike\/[1-2]{1}$/i;
const BIKE_CMD_TOPIC = /^Bike\/[1-2]{1}\/cmd$/i;
const RACE_STATE_CHANGE_TOPIC = /^RaceStateChange$/i;
const RACE_START_STATES: string[] = [
  RaceState.WAITING_TO_RACE,
  RaceState.RACING,
];
const SHOW_STATE_CHANGE_TOPIC = /^ShowStateChange$/i;

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

  private readonly raceTracker = new BikeRaceTracker({
    onWinner: (winner) => this.announceWinner(winner),
    log: (message) => this.logger.log(message),
  });

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
    this.wsServer = createWsCapableServer(this.drainingHandler(this.broker), {
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

  /**
   * aedes reads each 'readable' event with a single `conn.read(null)` and never
   * drains the rest. Since Node 26 that call returns only the first buffered
   * chunk, so when `ws` delivers several frames in one tick (e.g. an MQTT packet
   * split across WebSocket frames) the remaining data is never read, no further
   * 'readable' event fires, and the client hangs. Make `read(null)` return
   * everything that is buffered, as it did before.
   */
  private drainingHandler(broker: Aedes): Aedes {
    const handle: Aedes["handle"] = (conn, req) => {
      const read = conn.read.bind(conn);
      conn.read = (size?: number | null) => {
        if (size !== null && size !== undefined) {
          return read(size);
        }
        const chunks: Buffer[] = [];
        let chunk: Buffer | null;
        while ((chunk = read()) !== null) {
          chunks.push(chunk);
        }
        return chunks.length > 0 ? Buffer.concat(chunks) : null;
      };
      return broker.handle(conn, req);
    };
    return { handle } as Aedes;
  }

  async onModuleDestroy() {
    this.raceTracker.reset();
    if (this.client) {
      await new Promise<void>((resolve) =>
        this.client!.end(true, {}, () => resolve()),
      );
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
      const bikeId = topic.substring(5);
      this.logger.log(
        `📝 Client ${client ? client.id : "unknown"} published command for Bike ${bikeId}: ${payloadText}`,
      );
    } else if (payloadObject && RACE_STATE_CHANGE_TOPIC.test(topic)) {
      this.logger.log(`📝 RaceStateChange:`, payloadObject);
      if (RACE_START_STATES.includes(payloadObject.state)) {
        // a new race is about to start: forget the finish flags of the last one
        this.raceTracker.reset();
      }
    } else if (payloadObject && SHOW_STATE_CHANGE_TOPIC.test(topic)) {
      this.logger.log(`📝 ShowStateChange:`, payloadObject);
    } else {
      this.logger.log(
        `📝 Client ${client ? client.id : "unknown"} published unrecognizable message [topic=${topic}]: ${payloadText}`,
      );
    }
  }

  private handleBikeStatus(bikeId: BikeId, payloadObject: BikeStatusMessage) {
    this.raceTracker.handleStatus(bikeId, payloadObject);
  }

  private announceWinner(winner: Winner) {
    this.logger.log(`Analyzed finish: winner is ${winner}`);
    void this.markCurrentRaceAsWonBy(winner);

    const bikeWonTopic = `Bike/${winner}/won`;
    if (this.client) {
      this.client.publish(bikeWonTopic, "", { qos: 1 }, (err) => {
        if (err) {
          this.logger.error(`❌ Failed to publish ${bikeWonTopic}: ${err}`);
        } else {
          this.logger.log(`🚀 Message sent to ${bikeWonTopic}`);
        }
      });
    }
    this.logger.log(
      winner === "3"
        ? `🏆 Both bikes won! 🎉`
        : `🏆 Bike ${winner === "1" ? "1️⃣" : "2️⃣"} won! 🎉`,
    );
  }

  private async markCurrentRaceAsWonBy(bikeId: Winner): Promise<void> {
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
          raceFinishedAt: new Date().toISOString(),
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
}
