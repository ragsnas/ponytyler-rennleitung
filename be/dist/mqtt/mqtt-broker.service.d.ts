import { OnApplicationBootstrap, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RaceService } from "../prisma-api/race.service";
import { ShowService } from "../prisma-api/show.service";
export declare class MqttBrokerService implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly configService;
    private readonly raceService;
    private readonly showService;
    private readonly logger;
    private readonly utf16Decoder;
    private broker;
    private server;
    private wsServer;
    private client;
    private readonly bikeState;
    private readonly bikeStates;
    constructor(configService: ConfigService, raceService: RaceService, showService: ShowService);
    onApplicationBootstrap(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private registerBrokerListeners;
    private handlePublish;
    private handleBikeStatus;
    private markCurrentRaceAsWonBy;
    private isBikeStatusPayload;
    private updatePartialBikeState;
    private addBikeState;
}
