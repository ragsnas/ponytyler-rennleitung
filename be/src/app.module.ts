import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RaceModule } from "./race/race.module";
import { ShowModule } from "./show/show.module";
import { SongModule } from "./song/song.module";
import { CronModule } from "./cron/cron.module";
import { NextcloudModule } from "./nextcloud/nextcloud.module";
import { ConfigModule } from "@nestjs/config";
import { ShiftsModule } from "./shifts/shifts.module";
import { UserModule } from "./user/user.module";
import { StatisticsModule } from "./statistics/statistics.module";
import { BackupModule } from "./backup/backup.module";
import { MqttModule } from "./mqtt/mqtt.module";
import { ExportModule } from "./export/export.module";
import { ImportModule } from "./import/import.module";
import { EncoreSongModule } from "./encore-song/encore-song.module";

@Module({
  imports: [
    BackupModule,
    RaceModule,
    SongModule,
    ShowModule,
    ShiftsModule,
    StatisticsModule,
    UserModule,
    CronModule,
    NextcloudModule,
    MqttModule,
    ExportModule,
    ImportModule,
    EncoreSongModule,
    ConfigModule.forRoot({}),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
