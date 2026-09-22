"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MqttBrokerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttBrokerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const aedes_1 = require("aedes");
const net_1 = require("net");
const aedes_server_factory_1 = require("aedes-server-factory");
const client_1 = require("@prisma/client");
const race_service_1 = require("../prisma-api/race.service");
const show_service_1 = require("../prisma-api/show.service");
const mqtt_1 = require("mqtt");
const os_1 = require("os");
const MAX_BIKE_ADVANCE = 120;
const ADDITIONAL_SEQUENCE_STORAGE = 4;
const DEFAULT_MQTT_PORT = 3001;
const DEFAULT_MQTT_WS_PORT = 3002;
const BIKE_STATUS_TOPIC = /^Bike\/[1-2]{1}$/i;
const BIKE_CMD_TOPIC = /^Bike\/[1-2]{1}\/cmd$/i;
function initialBikeState() {
    return {
        finished: false,
        finishObservedAtSequenz: undefined,
        won: undefined,
        mostRecentStatus: { pulsecount: 0, sequenz: 0, timestamp: 0 },
    };
}
let MqttBrokerService = MqttBrokerService_1 = class MqttBrokerService {
    constructor(configService, raceService, showService) {
        this.configService = configService;
        this.raceService = raceService;
        this.showService = showService;
        this.logger = new common_1.Logger(MqttBrokerService_1.name);
        this.utf16Decoder = new TextDecoder("UTF-8");
        this.bikeState = new Map([
            ["1", initialBikeState()],
            ["2", initialBikeState()],
        ]);
        this.bikeStates = new Map([
            ["1", []],
            ["2", []],
        ]);
    }
    async onApplicationBootstrap() {
        const port = Number(this.configService.get("MQTT_PORT") ?? DEFAULT_MQTT_PORT);
        const wsPort = Number(this.configService.get("MQTT_WS_PORT") ?? DEFAULT_MQTT_WS_PORT);
        this.broker = await aedes_1.Aedes.createBroker();
        this.server = (0, net_1.createServer)(this.broker.handle);
        this.wsServer = (0, aedes_server_factory_1.createServer)(this.broker, {
            ws: true,
        });
        this.registerBrokerListeners(this.broker);
        await new Promise((resolve) => this.server.listen(port, resolve));
        this.logger.log(`🚀 MQTT Broker started and listening on port ${port}`);
        await new Promise((resolve) => this.wsServer.listen(wsPort, resolve));
        this.logger.log(`🚀 MQTT-over-WebSocket listening on port ${wsPort}`);
        const mqttUri = `mqtt://${os_1.default.hostname()}:${port}`;
        this.client = mqtt_1.default.connect(mqttUri, {
            clientId: "mqtt-broker-itself",
        });
    }
    async onModuleDestroy() {
        if (this.server) {
            await new Promise((resolve) => this.server.close(() => resolve()));
        }
        if (this.wsServer) {
            await new Promise((resolve) => this.wsServer.close(() => resolve()));
        }
        if (this.broker) {
            await new Promise((resolve) => this.broker.close(() => resolve()));
        }
        this.logger.log("MQTT Broker stopped");
    }
    registerBrokerListeners(broker) {
        broker.on("client", (client) => {
            this.logger.log(`🔗 Client Connected: ${client ? client.id : "unknown"}`);
        });
        broker.on("subscribe", (subscriptions, client) => {
            this.logger.log(`📝 Client ${client ? client.id : "unknown"} subscribed to: ${subscriptions.map((s) => s.topic).join(", ")}`);
        });
        broker.on("publish", (packet, client) => {
            this.handlePublish(packet, client);
        });
    }
    handlePublish(packet, client) {
        const payloadText = typeof packet.payload === "string"
            ? packet.payload
            : this.utf16Decoder.decode(packet.payload);
        let payloadObject = undefined;
        try {
            payloadObject = JSON.parse(payloadText);
        }
        catch {
            this.logger.log(`📝 Client ${client ? client.id : "unknown"} published unparsable payload: ${payloadText}`);
        }
        const topic = packet.topic;
        if (payloadObject && BIKE_STATUS_TOPIC.test(topic)) {
            const bikeId = topic.substr(5);
            if (this.isBikeStatusPayload(payloadObject)) {
                this.handleBikeStatus(bikeId, payloadObject);
            }
        }
        else if (payloadObject && BIKE_CMD_TOPIC.test(topic)) {
            const bikeId = topic.substr(5);
            this.logger.log(`📝 Client ${client ? client.id : "unknown"} published command for Bike ${bikeId}: ${payloadText}`);
        }
        else {
            this.logger.log(`📝 Client ${client ? client.id : "unknown"} published unrecognizable message [topic=${topic}]: ${payloadText}`);
        }
    }
    handleBikeStatus(bikeId, payloadObject) {
        if (payloadObject.pulsecount <= MAX_BIKE_ADVANCE) {
            this.addBikeState(bikeId, payloadObject);
            return;
        }
        let thisBikeState = this.bikeState.get(bikeId);
        if (!thisBikeState.finished) {
            this.logger.log(`🏁 Bike ${bikeId} finished: ${JSON.stringify(payloadObject)}`);
            thisBikeState = this.updatePartialBikeState(bikeId, {
                finishObservedAtSequenz: payloadObject.sequenz,
                finished: true,
            });
        }
        const maxSequenzToRecord = thisBikeState.finishObservedAtSequenz + ADDITIONAL_SEQUENCE_STORAGE;
        if (payloadObject.sequenz < maxSequenzToRecord) {
            this.logger.log(`📝 Adding additional state (seq ${maxSequenzToRecord}) for Bike ${bikeId}`);
            this.addBikeState(bikeId, payloadObject);
            return;
        }
        if (thisBikeState.won) {
            return;
        }
        const otherId = bikeId === "1" ? "2" : "1";
        const otherBikeState = this.bikeState.get(otherId);
        if (otherBikeState.won) {
            return;
        }
        this.logger.log(`Analyzing Bike ${bikeId}:`);
        if (!otherBikeState.finished ||
            otherBikeState.mostRecentStatus.timestamp >
                thisBikeState.mostRecentStatus.timestamp) {
            this.updatePartialBikeState(bikeId, { won: true });
            void this.markCurrentRaceAsWonBy(bikeId);
            const bikeWonTopic = `Bike/${bikeId}/won`;
            if (this.client) {
                this.client.publish(bikeWonTopic, '', { qos: 1 }, (err) => {
                    if (err) {
                        console.error("❌ Failed to publish:", err);
                    }
                    else {
                        console.log(`🚀 Message sent to ${bikeWonTopic}`);
                    }
                });
            }
            this.logger.log(`🏆 Bike ${bikeId === "1" ? "1️⃣" : "2️⃣"} won! 🎉`);
        }
    }
    async markCurrentRaceAsWonBy(bikeId) {
        try {
            const show = await this.showService.currentShow();
            const race = await this.raceService.currentRace(show.id);
            if (!race) {
                this.logger.warn(`No current race found while marking Bike ${bikeId} as winner`);
                return;
            }
            await this.raceService.updateRace({
                where: { id: race.id },
                data: {
                    showId: race.showId,
                    bikeWon: Number(bikeId),
                    raceState: client_1.RaceState.RACED,
                    raced: true,
                },
            });
            await this.showService.updateShow({
                where: { id: race.showId },
                data: { showState: client_1.ShowState.RACE_FINISHED },
            });
        }
        catch (error) {
            this.logger.error(`Failed to persist win for Bike ${bikeId}: ${error}`);
        }
    }
    isBikeStatusPayload(payloadObject) {
        const hasOwn = Object.prototype.hasOwnProperty;
        return (hasOwn.call(payloadObject, "pulsecount") &&
            hasOwn.call(payloadObject, "timestamp") &&
            hasOwn.call(payloadObject, "sequenz"));
    }
    updatePartialBikeState(bikeId, element) {
        this.logger.log(`📝 updatePartialBikeState for Bike ${bikeId}: ${JSON.stringify(element)}`);
        const updated = {
            ...this.bikeState.get(bikeId),
            ...element,
        };
        this.bikeState.set(bikeId, updated);
        return updated;
    }
    addBikeState(bikeId, bikeStatusMessage) {
        const bikeStatusMessages = this.bikeStates.get(bikeId) || [];
        const bikeStateForThisBike = this.bikeState.get(bikeId) || initialBikeState();
        bikeStatusMessages.push(bikeStatusMessage);
        if ((!bikeStateForThisBike.finished &&
            bikeStatusMessage.sequenz >
                bikeStateForThisBike.mostRecentStatus?.sequenz) ||
            (bikeStateForThisBike.finished &&
                bikeStatusMessage.pulsecount > MAX_BIKE_ADVANCE &&
                bikeStatusMessage.sequenz <
                    bikeStateForThisBike.mostRecentStatus?.sequenz)) {
            this.updatePartialBikeState(bikeId, {
                mostRecentStatus: bikeStatusMessage,
            });
        }
        this.bikeStates.set(bikeId, bikeStatusMessages);
        this.bikeState.set(bikeId, bikeStateForThisBike);
    }
};
exports.MqttBrokerService = MqttBrokerService;
exports.MqttBrokerService = MqttBrokerService = MqttBrokerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        race_service_1.RaceService,
        show_service_1.ShowService])
], MqttBrokerService);
//# sourceMappingURL=mqtt-broker.service.js.map