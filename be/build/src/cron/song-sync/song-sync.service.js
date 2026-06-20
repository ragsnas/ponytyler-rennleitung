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
var SongSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SongSyncService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const axios_1 = require("@nestjs/axios");
const song_service_1 = require("../../prisma-api/song.service");
const rxjs_1 = require("rxjs");
let SongSyncService = SongSyncService_1 = class SongSyncService {
    constructor(httpService, songService) {
        this.httpService = httpService;
        this.songService = songService;
        this.logger = new common_1.Logger(SongSyncService_1.name);
    }
    async handleCron() {
        this.logger.log("Running Song Sync Cron-Job.");
        let songsFromCloud = undefined;
        try {
            songsFromCloud = await (0, rxjs_1.firstValueFrom)(this.httpService.get("https://songlist.ponytyler.de/api/index.php"));
        }
        catch (e) {
            this.logger.error(`could not receive songs from cloud: `, e);
        }
        const localSongs = await this.songService.songs({});
        if (songsFromCloud && localSongs) {
            songsFromCloud.data.forEach((song) => {
                const fullCloudSongName = `${song.artist} - ${song.title}`;
                if (!localSongs.some((localSong) => this.cleanSongname(this.songToString(localSong)) ===
                    this.cleanSongname(fullCloudSongName))) {
                    this.logger.log("Need to create Song:" + JSON.stringify(song));
                    this.songService
                        .createSong({
                        name: song.title,
                        artist: song.artist,
                        selectable: true,
                        deleted: false,
                        origin: song_service_1.Origin.FROM_CLOUD_SYNC,
                    })
                        .then((song) => {
                        this.logger.log("Song Created:" + JSON.stringify(song));
                    });
                }
            });
        }
    }
    cleanSongname(name) {
        return name.replace("[PT]", "").replace("[PTHQ]", "").toLowerCase().trim();
    }
    songToString(song) {
        return `${song.artist} - ${song.name}`;
    }
};
exports.SongSyncService = SongSyncService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SongSyncService.prototype, "handleCron", null);
exports.SongSyncService = SongSyncService = SongSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        song_service_1.SongService])
], SongSyncService);
//# sourceMappingURL=song-sync.service.js.map