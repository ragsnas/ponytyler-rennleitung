"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsbSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsbSyncService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const usb_1 = require("usb");
let UsbSyncService = UsbSyncService_1 = class UsbSyncService {
    constructor() {
        this.logger = new common_1.Logger(UsbSyncService_1.name);
    }
    async handleCron() {
        const devices = (0, usb_1.getDeviceList)();
        if (devices.length > 0) {
            for (const device of devices) {
                this.logger.log("USB Device found: ", JSON.stringify(device));
            }
        }
    }
};
exports.UsbSyncService = UsbSyncService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_SECOND),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsbSyncService.prototype, "handleCron", null);
exports.UsbSyncService = UsbSyncService = UsbSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UsbSyncService);
//# sourceMappingURL=usb-sync.service.js.map