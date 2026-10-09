import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";
import { SongSyncService } from "./song-sync/song-sync.service";
import { DbBackupService } from "./db-backup/db-backup.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaApiModule,
    HttpModule,
    ConfigModule,
  ],
  providers: [SongSyncService, DbBackupService],
  exports: [SongSyncService, DbBackupService],
})
export class CronModule {}
