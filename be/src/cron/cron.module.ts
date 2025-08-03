import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { HttpModule } from "@nestjs/axios";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";
import { SongSyncService } from "./song-sync/song-sync.service";
import { DbBackupService } from "./db-backup/db-backup.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaApiModule,
    HttpModule,
  ],
  providers: [SongSyncService, DbBackupService],
  exports: [DbBackupService]
})
export class CronModule {
}
