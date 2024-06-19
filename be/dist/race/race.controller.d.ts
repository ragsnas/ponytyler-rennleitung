import { RaceService } from "src/prisma-api/race.service";
import { ShowService } from "src/prisma-api/show.service";
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
    create(data: Prisma.RaceUncheckedCreateInput): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string;
        song1Id: number;
        person2: string;
        song2Id: number;
        bikeWon: number;
    }>;
    findRacesForShow(showId: string, raced: string): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string;
        song1Id: number;
        person2: string;
        song2Id: number;
        bikeWon: number;
    }[]>;
    findAllRacesForShow(showId: string): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string;
        song1Id: number;
        person2: string;
        song2Id: number;
        bikeWon: number;
    }[]>;
    findRaces(): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string;
        song1Id: number;
        person2: string;
        song2Id: number;
        bikeWon: number;
    }[]>;
    calculateAverageRacesPerHour(): import("rxjs").Observable<number>;
    findUpcomingRaceWithSongs(): Promise<{
        song1: {
            id: number;
            name: string;
            artist: string;
            selectable: boolean;
            deleted: boolean;
            origin: string;
        };
        song2: {
            id: number;
            name: string;
            artist: string;
            selectable: boolean;
            deleted: boolean;
            origin: string;
        };
    } & {
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string;
        song1Id: number;
        person2: string;
        song2Id: number;
        bikeWon: number;
    }>;
    findOne(id: string): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string;
        song1Id: number;
        person2: string;
        song2Id: number;
        bikeWon: number;
    }>;
    findOneWithSongs(id: string): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string;
        song1Id: number;
        person2: string;
        song2Id: number;
        bikeWon: number;
    }>;
    update(id: string, data: Prisma.RaceUncheckedUpdateInput): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string;
        song1Id: number;
        person2: string;
        song2Id: number;
        bikeWon: number;
    }>;
    remove(id: string): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string;
        song1Id: number;
        person2: string;
        song2Id: number;
        bikeWon: number;
    }>;
}
