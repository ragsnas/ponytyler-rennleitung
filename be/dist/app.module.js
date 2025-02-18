"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const race_module_1 = require("./race/race.module");
const show_module_1 = require("./show/show.module");
const song_module_1 = require("./song/song.module");
const cron_module_1 = require("./cron/cron.module");
const nextcloud_module_1 = require("./nextcloud/nextcloud.module");
const config_1 = require("@nestjs/config");
const shifts_module_1 = require("./shifts/shifts.module");
const user_module_1 = require("./user/user.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            race_module_1.RaceModule,
            song_module_1.SongModule,
            show_module_1.ShowModule,
            shifts_module_1.ShiftsModule,
            user_module_1.UserModule,
            cron_module_1.CronModule,
            nextcloud_module_1.NextcloudModule,
            config_1.ConfigModule.forRoot({}),
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map