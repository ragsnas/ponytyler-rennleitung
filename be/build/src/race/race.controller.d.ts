import { RaceService } from "../prisma-api/race.service";
import { ShowService } from "../prisma-api/show.service";
import { Prisma } from "@prisma/client";
export declare enum RaceState {
    WAITING_FOR_OPPONENT = "WAITING_FOR_OPPONENT",
    WAITING_TO_RACE = "WAITING_TO_RACE",
    CANCELED = "CANCELED",
    RACED = "RACED"
}
export declare class RaceController {
    private readonly raceService;
    private readonly showService;
    constructor(raceService: RaceService, showService: ShowService);
    create(data: Prisma.RaceUncheckedCreateInput): Promise<Race>;
    findRacesForShow(showId: string, raced: string): Promise<Race[]>;
    findAllRacesForShow(showId: string): Promise<Race[]>;
    findRaces(): Promise<Race[]>;
    calculateAverageRacesPerHour(): import("rxjs").Observable<number>;
    findUpcomingRaceWithSongs(): Promise<any>;
    findUpcomingRacesWithSongs(): Promise<any>;
    findOne(id: string): Promise<any>;
    findOneWithSongs(id: string): Promise<any>;
    moveRaceUpOrDown(id: string, upOrDown: string): Promise<any>;
    update(id: string, data: Prisma.RaceUncheckedUpdateInput): Promise<Race>;
    remove(id: string): Promise<Race>;
}
