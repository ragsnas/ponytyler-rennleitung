"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaApiModule = void 0;
const common_1 = require("@nestjs/common");
const show_service_1 = require("./show.service");
const race_service_1 = require("./race.service");
const song_service_1 = require("./song.service");
const prisma_service_1 = require("./prisma.service");
let PrismaApiModule = class PrismaApiModule {
};
exports.PrismaApiModule = PrismaApiModule;
exports.PrismaApiModule = PrismaApiModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        providers: [prisma_service_1.PrismaService, race_service_1.RaceService, show_service_1.ShowService, song_service_1.SongService],
        exports: [prisma_service_1.PrismaService, race_service_1.RaceService, show_service_1.ShowService, song_service_1.SongService],
    })
], PrismaApiModule);
//# sourceMappingURL=prisma-api.module.js.map