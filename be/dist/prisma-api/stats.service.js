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
var StatsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const common_1 = require("@nestjs/common");
const sql_1 = require("@prisma/client/sql");
const prisma_service_1 = require("./prisma.service");
let StatsService = StatsService_1 = class StatsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(StatsService_1.name);
    }
    mostPlayedSongs() {
        return this.prisma.$queryRawTyped((0, sql_1.mostPlayedSongs)());
    }
    mostWishedSongs() {
        return this.prisma.$queryRawTyped((0, sql_1.mostWishedSongs)());
    }
    neverWishedSongs() {
        return this.prisma.$queryRawTyped((0, sql_1.neverWishedSongs)());
    }
};
exports.StatsService = StatsService;
exports.StatsService = StatsService = StatsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StatsService);
//# sourceMappingURL=stats.service.js.map