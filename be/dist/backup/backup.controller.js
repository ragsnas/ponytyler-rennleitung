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
exports.BackupController = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const platform_express_1 = require("@nestjs/platform-express");
const db_backup_service_1 = require("../cron/db-backup/db-backup.service");
const isDir_1 = require("../utils/isDir");
let BackupController = class BackupController {
    constructor(dbBackupService) {
        this.dbBackupService = dbBackupService;
        this.prismaFolder = "prisma";
        if (!(0, isDir_1.isDir)(`prisma/backups`) && (0, isDir_1.isDir)(`/home/ponytyler/ponytyler-rennleitung/be/prisma/backups`)) {
            this.prismaFolder = `/home/ponytyler/ponytyler-rennleitung/be/prisma`;
        }
    }
    downloadBackup() {
        const file = (0, fs_1.createReadStream)(`${this.prismaFolder}/rl.db`);
        return new common_1.StreamableFile(file);
    }
    async downloadBackupPossible() {
        const fileExists = (0, fs_1.existsSync)(`${this.prismaFolder}/rl.db`);
        if (!fileExists) {
            throw new common_1.NotFoundException(`Database for Backup not found.`);
        }
        return true;
    }
    uploadBackup(file) {
        const backupFileName = this.dbBackupService.getDestinationPath(new Date());
        console.log(`Creating Backup before overwriting Database. Backup Filename:`, backupFileName);
        (0, fs_1.copyFileSync)("prisma/rl.db", backupFileName);
        (0, fs_1.copyFileSync)(file.path, "prisma/rl.db");
    }
};
exports.BackupController = BackupController;
__decorate([
    (0, common_1.Get)("download"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", common_1.StreamableFile)
], BackupController.prototype, "downloadBackup", null);
__decorate([
    (0, common_1.Get)("download-possible"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "downloadBackupPossible", null);
__decorate([
    (0, common_1.Post)("upload"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "uploadBackup", null);
exports.BackupController = BackupController = __decorate([
    (0, common_1.Controller)("api/backup"),
    __metadata("design:paramtypes", [db_backup_service_1.DbBackupService])
], BackupController);
//# sourceMappingURL=backup.controller.js.map