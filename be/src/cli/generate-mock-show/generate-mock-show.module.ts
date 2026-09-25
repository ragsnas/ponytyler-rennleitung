import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaApiModule } from "../../prisma-api/prisma-api.module";
import { CronModule } from "../../cron/cron.module";
import { GenerateMockShowCommand } from "./generate-mock-show.command";

@Module({
  imports: [ConfigModule.forRoot({}), PrismaApiModule, CronModule],
  providers: [GenerateMockShowCommand],
})
export class GenerateMockShowModule {}
