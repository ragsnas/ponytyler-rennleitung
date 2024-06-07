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
exports.RaceController = exports.RaceState = void 0;
const common_1 = require("@nestjs/common");
const race_service_1 = require("../prisma-api/race.service");
const show_service_1 = require("../prisma-api/show.service");
const client_1 = require("@prisma/client");
const rxjs_1 = require("rxjs");
var RaceState;
(function (RaceState) {
    RaceState["WAITING_FOR_OPPONENT"] = "WAITING_FOR_OPPONENT";
    RaceState["WAITING_TO_RACE"] = "WAITING_TO_RACE";
    RaceState["CANCELED"] = "CANCELED";
    RaceState["RACED"] = "RACED";
})(RaceState || (exports.RaceState = RaceState = {}));
let RaceController = class RaceController {
    constructor(raceService, showService) {
        this.raceService = raceService;
        this.showService = showService;
    }
    create(data) {
        return this.raceService.createRace(data);
    }
    findRacesForShow(showId, raced) {
        return this.raceService.races({
            where: {
                showId: Number(showId),
                raceState: raced ? { equals: RaceState.RACED } : { not: { equals: RaceState.RACED } }
            },
            orderBy: { orderNumber: raced ? 'desc' : 'asc' },
        });
    }
    findAllRacesForShow(showId) {
        return this.raceService.races({
            where: {
                showId: Number(showId)
            },
            orderBy: { orderNumber: 'asc' },
        });
    }
    findRaces() {
        return this.raceService.races({});
    }
    calculateAverageRacesPerHour() {
        return (0, rxjs_1.combineLatest)([
            this.raceService.races({
                where: {
                    raceState: { equals: RaceState.RACED },
                    show: { finished: { equals: true } }
                },
            }),
            this.showService.shows({
                where: {
                    finished: { equals: true }
                },
            })
        ]).pipe((0, rxjs_1.map)(([races, shows]) => {
            const numberOfRaces = races
                .map(race => race.bikeWon === 3 ? 2 : 1)
                .reduce((accumulator, currentValue) => accumulator + currentValue) || 0;
            const totalTime = shows
                .map(show => show.duration)
                .reduce((accumulator, currentValue) => accumulator + currentValue) || 0;
            return Math.round(numberOfRaces / (totalTime / 60));
        }));
    }
    findUpcomingRaceWithSongs() {
        return this.raceService.upcomingRaceWithSongs();
    }
    findOne(id) {
        return this.raceService.race({ id: Number(id) });
    }
    findOneWithSongs(id) {
        return this.raceService.raceWithSongs(id);
    }
    update(id, data) {
        return this.raceService.updateRace({ where: { id: Number(id) }, data });
    }
    remove(id) {
        return this.raceService.deleteRace({ id: Number(id) });
    }
};
exports.RaceController = RaceController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RaceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('for-show/:showId'),
    __param(0, (0, common_1.Param)('showId')),
    __param(1, (0, common_1.Query)('raced')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RaceController.prototype, "findRacesForShow", null);
__decorate([
    (0, common_1.Get)('for-show/:showId/all'),
    __param(0, (0, common_1.Param)('showId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RaceController.prototype, "findAllRacesForShow", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RaceController.prototype, "findRaces", null);
__decorate([
    (0, common_1.Get)('average-races-per-hour'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RaceController.prototype, "calculateAverageRacesPerHour", null);
__decorate([
    (0, common_1.Get)('upcoming-with-songs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RaceController.prototype, "findUpcomingRaceWithSongs", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RaceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/with-songs'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RaceController.prototype, "findOneWithSongs", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RaceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RaceController.prototype, "remove", null);
exports.RaceController = RaceController = __decorate([
    (0, common_1.Controller)('api/race'),
    __metadata("design:paramtypes", [race_service_1.RaceService,
        show_service_1.ShowService])
], RaceController);
//# sourceMappingURL=race.controller.js.map