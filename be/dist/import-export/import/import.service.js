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
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const race_service_1 = require("../../prisma-api/race.service");
const show_service_1 = require("../../prisma-api/show.service");
let ImportService = class ImportService {
    constructor(showService, raceService) {
        this.showService = showService;
        this.raceService = raceService;
    }
    async import(importData) {
        let showCreationPromises = [];
        let raceCreationPromises = [];
        let importReport = { shows: [] };
        const currentShows = await this.showService.allShowsWithRaces();
        importData.forEach(importShow => {
            let showToCreate = undefined;
            const importShowReport = {
                importShow: importShow,
                races: []
            };
            const matchingExistingShow = currentShows.find(showEntry => this.showSimilar(showEntry, importShow));
            if (!matchingExistingShow) {
                const { id, races, ...showToCreate } = importShow;
                const newShow = this.showService.createShow(showToCreate);
                newShow
                    .then(createdShow => {
                    this.handleRaces(importShow.races, { ...createdShow, races: [] }, importShowReport, raceCreationPromises);
                });
                showCreationPromises.push(newShow);
            }
            else {
                if (this.showEqual(matchingExistingShow, importShow)) {
                    importShowReport.duplicate = true;
                }
                else {
                    importShowReport.show = matchingExistingShow;
                }
                this.handleRaces(importShow.races, matchingExistingShow, importShowReport, raceCreationPromises);
            }
            importReport.shows.push(importShowReport);
        });
        await Promise.all([...raceCreationPromises]);
        return importReport;
    }
    handleRaces(races, matchingExistingShow, importShowReport, raceCreationPromises) {
        races.forEach(importRace => {
            importShowReport.races.push(this.handleRace(importRace, matchingExistingShow, raceCreationPromises));
        });
    }
    handleRace(importRace, matchingExistingShow, raceCreationPromises) {
        let importRaceReport = {
            raceImport: importRace
        };
        const matchingRace = matchingExistingShow.races.find(raceEntry => this.racesSimilar(raceEntry, importRace));
        if (matchingRace && this.racesEqual(matchingRace, importRace)) {
            importRaceReport.duplicate = true;
        }
        else if (matchingRace) {
            importRaceReport.race = matchingRace;
        }
        else {
            const newRace = this.raceService.createRace({
                ...importRace,
                showId: matchingExistingShow.id,
            });
            raceCreationPromises.push(newRace);
        }
        return importRaceReport;
    }
    racesSimilar(race1, race2) {
        return (race1.person1 === race2.person1
            || race1.person2 === race2.person2)
            && race1.createdAt === race2.createdAt;
    }
    racesEqual(race1, race2) {
        return race1.person1 === race2.person1
            && race1.person2 === race2.person2
            && race1.createdAt === race2.createdAt
            && race1.song1Id === race2.song1Id
            && race1.song2Id === race2.song2Id
            && race1.raceState === race2.raceState
            && race1.bikeWon === race2.bikeWon
            && race1.orderNumber === race2.orderNumber
            && race1.raced === race2.raced;
    }
    showSimilar(show1, show2) {
        return show1.name === show2.name
            && show1.date === show2.date;
    }
    showEqual(show1, show2) {
        return show1.active === show2.active
            && show1.actualStartTime === show2.actualStartTime
            && show1.date === show2.date
            && show1.duration === show2.duration
            && show1.name === show2.name;
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [show_service_1.ShowService,
        race_service_1.RaceService])
], ImportService);
//# sourceMappingURL=import.service.js.map