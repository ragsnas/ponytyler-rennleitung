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
    ConfigModule.forRoot({}),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
