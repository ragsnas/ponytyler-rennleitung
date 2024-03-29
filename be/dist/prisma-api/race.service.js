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
exports.RaceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
let RaceService = class RaceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async race(raceWhereUniqueInput) {
        return this.prisma.race.findUnique({
            where: raceWhereUniqueInput,
        });
    }
    async raceWithSongs(raceId) {
        return this.prisma.race.findUnique({
            where: { id: Number(raceId) },
            include: { song1: true, song2: true },
        });
    }
    async upcomingRaceWithSongs() {
        console.log(`upcomingRaceWithSongs Called`);
        const show = await this.prisma.show.findFirst({
            where: { active: true },
            orderBy: { date: 'desc' },
            take: 1
        });
        console.log(`Found current show:`, show);
        return this.prisma.race.findFirst({
            where: { showId: Number(show.id), raced: false },
            include: { song1: true, song2: true },
            orderBy: { orderNumber: 'asc' }
        });
    }
    async races(params) {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.race.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: { song1: true, song2: true },
        });
    }
    async createRace(data) {
        const highestOrderNumberRace = await this.races({
            where: { showId: Number(data.showId) },
            orderBy: { orderNumber: 'desc' },
        });
        return this.prisma.race.create({
            data: {
                person1: data.person1,
                song1Id: Number(data.song1Id),
                person2: data.person2,
                song2Id: Number(data.song2Id),
                showId: Number(data.showId),
                createdAt: data.createdAt || new Date(),
                orderNumber: highestOrderNumberRace.length > 0
                    ? Number(highestOrderNumberRace[0].orderNumber) + 1
                    : 0,
            },
        });
    }
    async updateRace(params) {
        const { where, data } = params;
        return this.prisma.race.update({
            data: {
                person1: data.person1,
                song1: { connect: { id: Number(data.song1Id) } },
                person2: data.person2,
                song2: { connect: { id: Number(data.song2Id) } },
                createdAt: data.createdAt,
                orderNumber: data.orderNumber,
                raced: data.raced,
                bikeWon: data.bikeWon,
                show: {
                    connect: {
                        id: Number(data.showId),
                    },
                },
            },
            where,
        });
    }
    async deleteRace(where) {
        return this.prisma.race.delete({
            where,
        });
    }
};
exports.RaceService = RaceService;
exports.RaceService = RaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RaceService);
//# sourceMappingURL=race.service.js.map