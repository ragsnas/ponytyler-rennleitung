import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MqttBrokerService } from "./mqtt-broker.service";

@Module({
  imports: [ConfigModule],
  providers: [MqttBrokerService],
  exports: [MqttBrokerService],
})
export class MqttModule {}
