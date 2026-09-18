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
exports.EncoreSongService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
let EncoreSongService = class EncoreSongService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async encoreSongsForShow(showId) {
        return this.prisma.encoreSong.findMany({
            where: { showId },
            include: { song: true },
            orderBy: { order: "asc" },
        });
    }
    async createEncoreSong(data) {
        const showId = Number(data.showId);
        const highestOrderEncoreSong = await this.prisma.encoreSong.findMany({
            where: { showId },
            orderBy: { order: "desc" },
            take: 1,
        });
        return this.prisma.encoreSong.create({
            data: {
                showId,
                songId: Number(data.songId),
                order: highestOrderEncoreSong.length > 0
                    ? Number(highestOrderEncoreSong[0].order) + 1
                    : 0,
            },
            include: { song: true },
        });
    }
};
exports.EncoreSongService = EncoreSongService;
exports.EncoreSongService = EncoreSongService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EncoreSongService);
//# sourceMappingURL=encore-song.service.js.map