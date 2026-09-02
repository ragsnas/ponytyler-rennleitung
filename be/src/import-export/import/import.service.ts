import { Injectable } from '@nestjs/common';
import { Race, Show } from '@prisma/client';
import { RaceService } from 'src/prisma-api/race.service';
import { ShowService } from 'src/prisma-api/show.service';

export interface ShowWithRaces extends Show {
    races: Race[];
}
export interface ImportRaceReport {
    race?: Race;
    raceImport: Race;
    duplicate?: boolean;
}
export interface ImportShowReport {
    show?: Show;
    importShow: Show;
    duplicate?: boolean;
    races: ImportRaceReport[]
}
export interface ImportReport {
    shows: ImportShowReport[]
}

@Injectable()
export class ImportService {

    constructor(
        private readonly showService: ShowService,
        private readonly raceService: RaceService
    ) {}

    async import(importData: ShowWithRaces[]): Promise<ImportReport> {
        let showCreationPromises: Promise<Show>[] = [];
        let raceCreationPromises: Promise<Race>[] = [];
        let importReport: ImportReport = {shows: []};
        const currentShows = await this.showService.allShowsWithRaces();
        importData.forEach(importShow => {
            const importShowReport: ImportShowReport = {
                importShow: importShow,
                races: []
            }
            const matchingExistingShow = currentShows.find(showEntry => 
                this.showSimilar(showEntry, importShow));
            if (!matchingExistingShow) {
                const {id , races, ...showToCreate} = importShow;
                const newShow: Promise<Show> = this.showService.createShow(showToCreate);
                newShow
                    .then(createdShow => {
                        this.handleRaces(
                            importShow.races,
                            {...createdShow, races: []},
                            importShowReport,
                            raceCreationPromises
                    )
                })
                showCreationPromises.push(newShow);
            } else {
                if (this.showEqual(matchingExistingShow, importShow)) {
                    importShowReport.duplicate = true;
                } else {
                    importShowReport.show = matchingExistingShow;
                }
                this.handleRaces(
                    importShow.races,
                    matchingExistingShow,
                    importShowReport,
                    raceCreationPromises
                )
            }   
            importReport.shows.push(importShowReport);
        });
        await Promise.all(
            [...raceCreationPromises]
        )

        return importReport;
    }

    private handleRaces(races: Race[], matchingExistingShow: ShowWithRaces, importShowReport: ImportShowReport, raceCreationPromises: Promise<Race>[]) {
        races.forEach(importRace => {            
                    importShowReport.races.push(
                        this.handleRace(
                            importRace,
                            matchingExistingShow,
                            raceCreationPromises)
                    );
                })
    }

    private handleRace(importRace: Race, matchingExistingShow: ShowWithRaces, raceCreationPromises: Promise<Race>[]): ImportRaceReport {
        let importRaceReport: ImportRaceReport = {
                        raceImport: importRace
                    }
                    const matchingRace = matchingExistingShow.races.find(raceEntry => 
                        this.racesSimilar(raceEntry, importRace)
                    )
        if(matchingRace && this.racesEqual(matchingRace, importRace)) {
            importRaceReport.duplicate = true;
        } else if (matchingRace) {
            importRaceReport.race = matchingRace;
        } else {
            const newRace: Promise<Race> = this.raceService.createRace({
                ...importRace,
                showId: matchingExistingShow.id,
            })
            raceCreationPromises.push(newRace);
        }

        return importRaceReport;
    }

    private racesSimilar(race1: Race, race2: Race): boolean {
        return (race1.person1 === race2.person1
        || race1.person2 === race2.person2)
        && race1.createdAt === race2.createdAt
    }

    private racesEqual(race1: Race, race2: Race): boolean {
        return race1.person1 === race2.person1
        && race1.person2 === race2.person2
        && race1.createdAt === race2.createdAt
        && race1.song1Id === race2.song1Id
        && race1.song2Id === race2.song2Id
        && race1.raceState === race2.raceState
        && race1.bikeWon === race2.bikeWon
        && race1.orderNumber === race2.orderNumber
        && race1.raced === race2.raced
    }

    private showSimilar(show1: Show, show2: Show): boolean {
        return show1.name === show2.name 
        && show1.date === show2.date;
    }

    private showEqual(show1: Show, show2: Show): boolean {
        return show1.active === show2.active
        && show1.actualStartTime === show2.actualStartTime
        && show1.date === show2.date
        && show1.duration === show2.duration
        && show1.name === show2.name
    }
}
