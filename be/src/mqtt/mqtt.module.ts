import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";
import { MqttBrokerService } from "./mqtt-broker.service";

@Module({
  imports: [ConfigModule, PrismaApiModule],
  providers: [MqttBrokerService],
  exports: [MqttBrokerService],
})
export class MqttModule {}
