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
    races: ImportRaceReport[];
}
export interface ImportReport {
    shows: ImportShowReport[];
}
export declare class ImportService {
    private readonly showService;
    private readonly raceService;
    constructor(showService: ShowService, raceService: RaceService);
    import(importData: ShowWithRaces[]): Promise<ImportReport>;
    private handleRaces;
    private handleRace;
    private racesSimilar;
    private racesEqual;
    private showSimilar;
    private showEqual;
}
