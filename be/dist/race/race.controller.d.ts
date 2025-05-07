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
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    }>;
    findRacesForShow(showId: string, raced: string): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    }[]>;
    findAllRacesForShow(showId: string): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    }[]>;
    findRaces(): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    }[]>;
    calculateAverageRacesPerHour(): import("rxjs").Observable<number>;
    findUpcomingRaceWithSongs(): Promise<{
        song1: {
            name: string;
            id: number;
            artist: string;
            selectable: boolean;
            deleted: boolean;
            origin: string;
        };
        song2: {
            name: string;
            id: number;
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
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    }>;
    findUpcomingRacesWithSongs(): Promise<({
        song1: {
            name: string;
            id: number;
            artist: string;
            selectable: boolean;
            deleted: boolean;
            origin: string;
        };
        song2: {
            name: string;
            id: number;
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
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    })[]>;
    findOne(id: string): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    }>;
    findOneWithSongs(id: string): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    }>;
    moveRaceUpOrDown(id: string, upOrDown: string): Promise<[{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    }, {
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    }]>;
    update(id: string, data: Prisma.RaceUncheckedUpdateInput): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    }>;
    remove(id: string): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
        raceState: string;
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    }>;
}
