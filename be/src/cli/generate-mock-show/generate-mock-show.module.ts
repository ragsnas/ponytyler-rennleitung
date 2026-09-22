import { Module } from "@nestjs/common";
import { PrismaApiModule } from "../../prisma-api/prisma-api.module";
import { CronModule } from "../../cron/cron.module";
import { GenerateMockShowCommand } from "./generate-mock-show.command";

@Module({
  imports: [PrismaApiModule, CronModule],
  providers: [GenerateMockShowCommand],
})
export class GenerateMockShowModule {}
