import { Module } from "@nestjs/common";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";
import { StatisticsController } from "./statistics.controller";

@Module({
  imports: [PrismaApiModule],
  controllers: [StatisticsController],
})
export class StatisticsModule {}
