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
var ImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma-api/prisma.service");
const export_types_1 = require("../export/export.types");
const REQUIRED_ARRAY_KEYS = ["shows", "shifts", "shiftRoles", "songs", "races", "users"];
const TABLES_CHILD_TO_PARENT = ["ShiftRole", "Race", "Shift", "Show", "Song", "User"];
let ImportService = ImportService_1 = class ImportService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ImportService_1.name);
    }
    async importDatabase(raw) {
        const data = this.validate(raw);
        await this.prisma.$transaction(async (tx) => {
            await tx.shiftRole.deleteMany();
            await tx.race.deleteMany();
            await tx.shift.deleteMany();
            await tx.show.deleteMany();
            await tx.song.deleteMany();
            await tx.user.deleteMany();
            if (data.shows.length)
                await tx.show.createMany({ data: data.shows });
            if (data.songs.length)
                await tx.song.createMany({ data: data.songs });
            if (data.users.length)
                await tx.user.createMany({ data: data.users });
            if (data.shifts.length)
                await tx.shift.createMany({ data: data.shifts });
            if (data.races.length)
                await tx.race.createMany({ data: data.races });
            if (data.shiftRoles.length)
                await tx.shiftRole.createMany({ data: data.shiftRoles });
            for (const table of TABLES_CHILD_TO_PARENT) {
                await tx.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`);
            }
        });
        this.logger.log(`Imported database export (formatVersion ${data.formatVersion})`);
        return {
            formatVersion: data.formatVersion,
            importedAt: new Date().toISOString(),
            imported: {
                shows: data.shows.length,
                shifts: data.shifts.length,
                shiftRoles: data.shiftRoles.length,
                songs: data.songs.length,
                races: data.races.length,
                users: data.users.length,
            },
        };
    }
    validate(raw) {
        if (!raw || typeof raw !== "object") {
            throw new common_1.BadRequestException("Import file is not a valid JSON object.");
        }
        const data = raw;
        if (data.formatVersion !== export_types_1.DATABASE_EXPORT_FORMAT_VERSION) {
            throw new common_1.BadRequestException(`Unsupported export formatVersion "${data.formatVersion}". This backend can only import formatVersion ${export_types_1.DATABASE_EXPORT_FORMAT_VERSION}.`);
        }
        for (const key of REQUIRED_ARRAY_KEYS) {
            if (!Array.isArray(data[key])) {
                throw new common_1.BadRequestException(`Import file is missing the "${key}" array.`);
            }
        }
        return data;
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = ImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ImportService);
//# sourceMappingURL=import.service.js.map