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
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma-api/prisma.service");
const export_types_1 = require("./export.types");
let ExportService = class ExportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exportDatabase() {
        const [shows, shifts, shiftRoles, songs, races, users] = await Promise.all([
            this.prisma.show.findMany({ orderBy: { id: "asc" } }),
            this.prisma.shift.findMany({ orderBy: { id: "asc" } }),
            this.prisma.shiftRole.findMany({ orderBy: { id: "asc" } }),
            this.prisma.song.findMany({ orderBy: { id: "asc" } }),
            this.prisma.race.findMany({ orderBy: { id: "asc" } }),
            this.prisma.user.findMany({
                orderBy: { id: "asc" },
                select: { id: true, name: true },
            }),
        ]);
        return {
            formatVersion: export_types_1.DATABASE_EXPORT_FORMAT_VERSION,
            exportedAt: new Date().toISOString(),
            shows,
            shifts,
            shiftRoles,
            songs,
            races,
            users,
        };
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportService);
//# sourceMappingURL=export.service.js.map