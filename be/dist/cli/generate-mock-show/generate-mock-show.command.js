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
var GenerateMockShowCommand_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateMockShowCommand = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const race_service_1 = require("../../prisma-api/race.service");
const show_service_1 = require("../../prisma-api/show.service");
const song_service_1 = require("../../prisma-api/song.service");
const song_sync_service_1 = require("../../cron/song-sync/song-sync.service");
const random_name_util_1 = require("./random-name.util");
const RACE_COUNT = 20;
const MAX_SHOW_TITLE_ATTEMPTS = 10;
let GenerateMockShowCommand = GenerateMockShowCommand_1 = class GenerateMockShowCommand {
    constructor(songSyncService, songService, showService, raceService) {
        this.songSyncService = songSyncService;
        this.songService = songService;
        this.showService = showService;
        this.raceService = raceService;
        this.logger = new common_1.Logger(GenerateMockShowCommand_1.name);
    }
    async run() {
        await this.syncSongs();
        const show = await this.createShowWithRandomTitle();
        this.logger.log(`Created show "${show.name}" (#${show.id})`);
        const songs = await this.songService.songs({
            where: { deleted: false, selectable: true },
        });
        if (songs.length < 2) {
            throw new Error(`Need at least 2 selectable songs to create races, found ${songs.length}.`);
        }
        for (let i = 0; i < RACE_COUNT; i++) {
            const [song1, song2] = this.pickTwoDistinctSongs(songs);
            const [person1, person2] = this.pickTwoDistinctPersonNames();
            const race = await this.raceService.createRace({
                showId: show.id,
                person1,
                song1Id: song1.id,
                person2,
                song2Id: song2.id,
                orderNumber: 0,
            });
            this.logger.log(`Created race #${race.id}: ${race.person1} vs ${race.person2}`);
        }
        this.logger.log(`Done: created show "${show.name}" with ${RACE_COUNT} races.`);
    }
    async syncSongs() {
        try {
            await this.songSyncService.triggerSync();
        }
        catch (error) {
            this.logger.warn(`Song sync could not be triggered, continuing with existing songs: ${error}`);
        }
        try {
            await this.songSyncService.updateSelectability();
        }
        catch (error) {
            this.logger.warn(`Updating song selectability failed: ${error}`);
        }
    }
    async createShowWithRandomTitle() {
        let lastError;
        for (let attempt = 0; attempt < MAX_SHOW_TITLE_ATTEMPTS; attempt++) {
            const name = (0, random_name_util_1.generateShowTitle)();
            try {
                return await this.showService.createShow({
                    name,
                    date: new Date(),
                    showState: client_1.ShowState.BEFORE_SHOW,
                });
            }
            catch (error) {
                if (!this.isUniqueConstraintError(error)) {
                    throw error;
                }
                lastError = error;
            }
        }
        this.logger.error("Last show title collision:", lastError);
        throw new Error(`Could not generate a unique show title after ${MAX_SHOW_TITLE_ATTEMPTS} attempts.`);
    }
    isUniqueConstraintError(error) {
        return (typeof error === "object" &&
            error !== null &&
            error.code === "P2002");
    }
    pickTwoDistinctSongs(songs) {
        const first = songs[Math.floor(Math.random() * songs.length)];
        let second = first;
        while (second.id === first.id) {
            second = songs[Math.floor(Math.random() * songs.length)];
        }
        return [first, second];
    }
    pickTwoDistinctPersonNames() {
        const first = (0, random_name_util_1.generatePersonName)();
        let second = (0, random_name_util_1.generatePersonName)();
        while (second === first) {
            second = (0, random_name_util_1.generatePersonName)();
        }
        return [first, second];
    }
};
exports.GenerateMockShowCommand = GenerateMockShowCommand;
exports.GenerateMockShowCommand = GenerateMockShowCommand = GenerateMockShowCommand_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [song_sync_service_1.SongSyncService,
        song_service_1.SongService,
        show_service_1.ShowService,
        race_service_1.RaceService])
], GenerateMockShowCommand);
//# sourceMappingURL=generate-mock-show.command.js.map