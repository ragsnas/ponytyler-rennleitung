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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsController = void 0;
const common_1 = require("@nestjs/common");
const stats_service_1 = require("../prisma-api/stats.service");
let StatisticsController = class StatisticsController {
    constructor(statsService) {
        this.statsService = statsService;
    }
    async mostPlayedSongs() {
        return await this.statsService.mostPlayedSongs();
    }
    async mostWishedSongs() {
        return await this.statsService.mostWishedSongs();
    }
    async neverWishedSongs() {
        return await this.statsService.neverWishedSongs();
    }
    async whichBikeWonMost() {
        return await this.statsService.whichBikeWonMost();
    }
};
exports.StatisticsController = StatisticsController;
__decorate([
    (0, common_1.Get)("most-played-songs"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "mostPlayedSongs", null);
__decorate([
    (0, common_1.Get)("most-wished-songs"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "mostWishedSongs", null);
__decorate([
    (0, common_1.Get)("never-wished-songs"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "neverWishedSongs", null);
__decorate([
    (0, common_1.Get)("which-bike-won-most"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "whichBikeWonMost", null);
exports.StatisticsController = StatisticsController = __decorate([
    (0, common_1.Controller)('api/statistics'),
    __metadata("design:paramtypes", [stats_service_1.StatsService])
], StatisticsController);
//# sourceMappingURL=statistics.controller.js.map