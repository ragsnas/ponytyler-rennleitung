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
exports.SongService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
let SongService = class SongService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async song(SongWhereUniqueInput) {
        return this.prisma.song.findUnique({
            where: SongWhereUniqueInput,
        });
    }
    async songs(params) {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.song.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
    }
    async createSong(data) {
        return this.prisma.song.create({
            data,
        });
    }
    async updateSong(params) {
        const { where, data } = params;
        return this.prisma.song.update({
            data,
            where,
        });
    }
    async deleteSong(where) {
        return this.prisma.song.delete({
            where,
        });
    }
};
exports.SongService = SongService;
exports.SongService = SongService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SongService);
//# sourceMappingURL=song.service.js.map