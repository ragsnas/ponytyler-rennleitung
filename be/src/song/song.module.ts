import { Module } from "@nestjs/common";
import { SongController } from "./song.controller";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";
import { CronModule } from "../cron/cron.module";

@Module({
  imports: [PrismaApiModule, CronModule],
  controllers: [SongController],
})
export class SongModule {}
