import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { getDeviceList, usb } from "usb";

@Injectable()
export class UsbSyncService {
  private readonly logger = new Logger(UsbSyncService.name);

  constructor(
  ) {}

  @Cron(CronExpression.EVERY_SECOND)
  async handleCron() {
    const devices: usb.Device[] = getDeviceList();

    if(devices.length > 0) {
      for (const device of devices) {
        this.logger.log("USB Device found: ", JSON.stringify(device));
      }
    }
  }

}
