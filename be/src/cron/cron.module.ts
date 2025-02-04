import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { HttpModule } from "@nestjs/axios";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";
import { SongSyncService } from "./song-sync/song-sync.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaApiModule,
    HttpModule,
  ],
  providers: [SongSyncService],
})
export class CronModule {
}
