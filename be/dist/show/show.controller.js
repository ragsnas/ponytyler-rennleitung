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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowController = void 0;
const common_1 = require("@nestjs/common");
const show_service_1 = require("../prisma-api/show.service");
const client_1 = require("@prisma/client");
let ShowController = class ShowController {
    constructor(showService) {
        this.showService = showService;
    }
    async getShows() {
        return this.showService.shows({
            orderBy: { date: { sort: "desc" } },
        });
    }
    async getAllShows() {
        return this.showService.showsOrderedByActiveAndDate();
    }
    async getCurrentShow() {
        const shows = await this.showService.shows({
            orderBy: { date: { sort: "desc" } },
            where: { active: true },
        });
        if (shows.length > 0) {
            return shows.pop();
        }
        else {
            throw new common_1.NotFoundException("No current shows");
        }
    }
    async getCurrentShows() {
        return this.showService.shows({
            orderBy: { date: { sort: "desc" } },
            where: { active: true },
        });
    }
    async getOldShows() {
        return this.showService.shows({
            orderBy: { date: { sort: "desc" } },
            where: { active: false },
        });
    }
    async getPostById(id) {
        return this.showService.show({ id: Number(id) });
    }
    async createShow(showData) {
        return this.showService.createShow({
            ...showData,
            date: showData.date || new Date(),
        });
    }
    async updateShow(id, showData) {
        return this.showService.updateShow({
            data: showData,
            where: { id: Number(id) },
        });
    }
    async deleteShowById(id) {
        return this.showService.deleteShowWithRaces(id);
    }
};
exports.ShowController = ShowController;
__decorate([
    (0, common_1.Get)(""),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShowController.prototype, "getShows", null);
__decorate([
    (0, common_1.Get)("shows"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShowController.prototype, "getAllShows", null);
__decorate([
    (0, common_1.Get)("current-show"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShowController.prototype, "getCurrentShow", null);
__decorate([
    (0, common_1.Get)("current-shows"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShowController.prototype, "getCurrentShows", null);
__decorate([
    (0, common_1.Get)("old-shows"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShowController.prototype, "getOldShows", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShowController.prototype, "getPostById", null);
__decorate([
    (0, common_1.Post)(""),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShowController.prototype, "createShow", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShowController.prototype, "updateShow", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShowController.prototype, "deleteShowById", null);
exports.ShowController = ShowController = __decorate([
    (0, common_1.Controller)("api/show"),
    __metadata("design:paramtypes", [show_service_1.ShowService])
], ShowController);
//# sourceMappingURL=show.controller.js.map