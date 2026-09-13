import { OnApplicationBootstrap, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
export declare class MqttBrokerService implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly utf16Decoder;
    private broker;
    private server;
    private readonly bikeState;
    private readonly bikeStates;
    constructor(configService: ConfigService);
    onApplicationBootstrap(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private registerBrokerListeners;
    private handlePublish;
    private handleBikeStatus;
    private isBikeStatusPayload;
    private updatePartialBikeState;
    private addBikeState;
}
