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
exports.ShowService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
let ShowService = class ShowService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async show(ShowWhereUniqueInput) {
        return this.prisma.show.findUnique({
            where: ShowWhereUniqueInput,
        });
    }
    async shows(params) {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.show.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
    }
    async showsOrderedByActiveAndDate() {
        return this.prisma.show.findMany({
            orderBy: [{ active: "desc" }, { date: "desc" }],
        });
    }
    async createShow(data) {
        return this.prisma.show.create({
            data,
        });
    }
    async updateShow(params) {
        const { where, data } = params;
        return this.prisma.show.update({
            data,
            where,
        });
    }
    async deleteShowWithRacesAndShifts(id) {
        const deleteRaces = this.prisma.race.deleteMany({
            where: {
                showId: Number(id),
            },
        });
        const relatedShifts = await this.prisma.shift.findMany({
            where: {
                showId: Number(id)
            }
        });
        const deleteShiftsRoles = this.prisma.shiftRole.deleteMany({
            where: {
                shiftId: {
                    in: relatedShifts.map(shift => shift.id)
                },
            },
        });
        const deleteShifts = this.prisma.shift.deleteMany({
            where: {
                id: {
                    in: relatedShifts.map(shift => shift.id)
                },
            },
        });
        const deleteShow = this.prisma.show.delete({
            where: {
                id: Number(id),
            },
        });
        return this.prisma.$transaction([deleteRaces, deleteShifts, deleteShiftsRoles, deleteShow]);
    }
};
exports.ShowService = ShowService;
exports.ShowService = ShowService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShowService);
//# sourceMappingURL=show.service.js.map