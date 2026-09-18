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
exports.EncoreSongController = void 0;
const common_1 = require("@nestjs/common");
const encore_song_service_1 = require("../prisma-api/encore-song.service");
let EncoreSongController = class EncoreSongController {
    constructor(encoreSongService) {
        this.encoreSongService = encoreSongService;
    }
    create(data) {
        return this.encoreSongService.createEncoreSong(data);
    }
    findForShow(showId) {
        return this.encoreSongService.encoreSongsForShow(Number(showId));
    }
};
exports.EncoreSongController = EncoreSongController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EncoreSongController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("for-show/:showId"),
    __param(0, (0, common_1.Param)("showId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EncoreSongController.prototype, "findForShow", null);
exports.EncoreSongController = EncoreSongController = __decorate([
    (0, common_1.Controller)("api/encore-song"),
    __metadata("design:paramtypes", [encore_song_service_1.EncoreSongService])
], EncoreSongController);
//# sourceMappingURL=encore-song.controller.js.map