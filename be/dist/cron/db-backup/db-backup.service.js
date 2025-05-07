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
var DbBackupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbBackupService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const fs_1 = require("fs");
const ts_md5_1 = require("ts-md5");
const pad_1 = require("../../utils/pad");
const isDir_1 = require("../../utils/isDir");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
let DbBackupService = DbBackupService_1 = class DbBackupService {
    constructor() {
        this.logger = new common_1.Logger(DbBackupService_1.name);
        this.baseFolder = "";
    }
    async hourly() {
        if (!(0, isDir_1.isDir)(`prisma/backups`) && (0, isDir_1.isDir)(`/home/ponytyler/ponytyler-rennleitung/be/prisma/backups`)) {
            this.baseFolder = `/home/ponytyler/ponytyler-rennleitung/be`;
        }
        this.logger.log("Running DB Backup Cron-Job.");
        if (!this.isBackupNecessary()) {
            this.logger.log('No changes since last Backup.');
        }
        else {
            this.createBackup();
        }
    }
    createBackup() {
        const backupDate = new Date();
        const backupFileName = `${(0, pad_1.pad)(backupDate.getHours())}-${(0, pad_1.pad)(Math.round(backupDate.getMinutes() / 15) * 15)}.db`;
        const destinationPath = this.getDestinationPath(backupDate);
        this.logger.log(`Copying prisma/rl.db to ${destinationPath}/${backupFileName}`);
        (0, fs_1.copyFileSync)(`${this.baseFolder}/prisma/rl.db`, `${destinationPath}/${backupFileName}`);
        (0, fs_1.copyFileSync)(`${this.baseFolder}/prisma/rl.db`, `prisma/backups/most_recent_backup.db`);
    }
    getDestinationPath(backupDate) {
        const backupFilePathYear = `${this.baseFolder}/prisma/backups/${(0, pad_1.pad)(backupDate.getFullYear())}`;
        this.createDirIfNotExists(backupFilePathYear);
        const backupFilePathMonth = `${backupFilePathYear}/${(0, pad_1.pad)(backupDate.getMonth())}`;
        this.createDirIfNotExists(backupFilePathMonth);
        const backupFilePathDay = `${backupFilePathMonth}/${(0, pad_1.pad)(backupDate.getDate())}`;
        this.createDirIfNotExists(backupFilePathDay);
        const destinationPath = backupFilePathDay;
        return destinationPath;
    }
    createDirIfNotExists(backupFilePathDay) {
        if (!(0, fs_1.existsSync)(backupFilePathDay)) {
            this.logger.debug(`creating path ${backupFilePathDay}`);
            (0, fs_1.mkdirSync)(backupFilePathDay);
        }
    }
    isBackupNecessary() {
        const lastBackupFileFilename = this.getLastBackupFileFilename();
        if (lastBackupFileFilename) {
            const currentDbFileHash = ts_md5_1.Md5.hashStr((0, fs_1.readFileSync)(`${this.baseFolder}/prisma/rl.db`).toString());
            const lastBackupFileFilenameHash = ts_md5_1.Md5.hashStr((0, fs_1.readFileSync)(lastBackupFileFilename).toString());
            if (currentDbFileHash === lastBackupFileFilenameHash) {
                return false;
            }
        }
        return true;
    }
    getLastBackupFileFilename() {
        const directory = `${this.baseFolder}/prisma/backups`;
        const backupDirectoryContent = (0, fs_1.readdirSync)(directory)
            .sort()
            .reverse()
            .filter(name => (0, shared_utils_1.isNumber)(Number(name)))
            .filter(name => (0, isDir_1.isDir)(`${directory}/${name}`));
        if (backupDirectoryContent) {
            const yearFolder = backupDirectoryContent[0];
            const backupDirectoryYearContent = (0, fs_1.readdirSync)(`${directory}/${yearFolder}`)
                .sort()
                .reverse()
                .filter(name => (0, shared_utils_1.isNumber)(Number(name)))
                .filter(name => (0, isDir_1.isDir)(`${directory}/${yearFolder}/` + name));
            if (backupDirectoryYearContent && backupDirectoryYearContent.length > 0) {
                const monthFolder = backupDirectoryYearContent[0];
                const backupDirectoryMonthContent = (0, fs_1.readdirSync)(`${directory}/${yearFolder}/${monthFolder}`)
                    .sort()
                    .reverse()
                    .filter(name => (0, shared_utils_1.isNumber)(Number(name)))
                    .filter(name => (0, isDir_1.isDir)(`${directory}/${yearFolder}//${monthFolder}/` + name));
                if (backupDirectoryMonthContent && backupDirectoryMonthContent.length > 0) {
                    const filePatternRegex = /^(\d){2}-(\d){2}\.db$/;
                    const dayFolder = backupDirectoryMonthContent[0];
                    const backupDirectoryDayContent = (0, fs_1.readdirSync)(`${directory}/${yearFolder}/${monthFolder}/${dayFolder}`)
                        .filter(name => filePatternRegex.test(name))
                        .sort()
                        .reverse();
                    if (backupDirectoryDayContent && backupDirectoryDayContent.length > 0) {
                        const newestFile = backupDirectoryDayContent[0];
                        return `${directory}/${yearFolder}/${monthFolder}/${dayFolder}/${newestFile}`;
                    }
                }
            }
        }
        return undefined;
    }
};
exports.DbBackupService = DbBackupService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DbBackupService.prototype, "hourly", null);
exports.DbBackupService = DbBackupService = DbBackupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DbBackupService);
//# sourceMappingURL=db-backup.service.js.map