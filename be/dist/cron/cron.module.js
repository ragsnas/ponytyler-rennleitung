"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const axios_1 = require("@nestjs/axios");
const prisma_api_module_1 = require("../prisma-api/prisma-api.module");
const song_sync_service_1 = require("./song-sync/song-sync.service");
let CronModule = class CronModule {
};
exports.CronModule = CronModule;
exports.CronModule = CronModule = __decorate([
    (0, common_1.Module)({
        imports: [schedule_1.ScheduleModule.forRoot(), prisma_api_module_1.PrismaApiModule, axios_1.HttpModule],
        providers: [song_sync_service_1.SongSyncService],
    })
], CronModule);
//# sourceMappingURL=cron.module.js.map