"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateMockShowModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_api_module_1 = require("../../prisma-api/prisma-api.module");
const cron_module_1 = require("../../cron/cron.module");
const generate_mock_show_command_1 = require("./generate-mock-show.command");
let GenerateMockShowModule = class GenerateMockShowModule {
};
exports.GenerateMockShowModule = GenerateMockShowModule;
exports.GenerateMockShowModule = GenerateMockShowModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule.forRoot({}), prisma_api_module_1.PrismaApiModule, cron_module_1.CronModule],
        providers: [generate_mock_show_command_1.GenerateMockShowCommand],
    })
], GenerateMockShowModule);
//# sourceMappingURL=generate-mock-show.module.js.map