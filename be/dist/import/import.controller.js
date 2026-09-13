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
exports.ImportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const import_service_1 = require("./import.service");
let ImportController = class ImportController {
    constructor(importService) {
        this.importService = importService;
    }
    async importDatabase(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded. Send the export JSON as multipart form field "file".');
        }
        let parsed;
        try {
            parsed = JSON.parse(file.buffer.toString("utf-8"));
        }
        catch (e) {
            throw new common_1.BadRequestException("Uploaded file is not valid JSON.");
        }
        return this.importService.importDatabase(parsed);
    }
};
exports.ImportController = ImportController;
__decorate([
    (0, common_1.Post)("database"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "importDatabase", null);
exports.ImportController = ImportController = __decorate([
    (0, common_1.Controller)("api/import"),
    __metadata("design:paramtypes", [import_service_1.ImportService])
], ImportController);
//# sourceMappingURL=import.controller.js.map