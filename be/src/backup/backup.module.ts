import { Module } from "@nestjs/common";
import { BackupController } from "./backup.controller";
import { CronModule } from "../cron/cron.module";

@Module({
  controllers: [BackupController],
  imports: [CronModule],
})
export class BackupModule {
}
