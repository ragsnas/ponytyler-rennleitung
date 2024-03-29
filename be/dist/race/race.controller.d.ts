import { RaceService } from 'src/prisma-api/race.service';
import { Prisma } from '@prisma/client';
export declare class RaceController {
    private readonly raceService;
    constructor(raceService: RaceService);
    create(data: Prisma.RaceUncheckedCreateInput): Promise<{
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
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
        person1: string;
        song1Id: number;
        person2: string;
        song2Id: number;
        bikeWon: number;
    }[]>;
    findUpcomingRaceWithSongs(): Promise<{
        song1: {
            id: number;
            name: string;
            artist: string;
            selectable: boolean;
            deleted: boolean;
        };
        song2: {
            id: number;
            name: string;
            artist: string;
            selectable: boolean;
            deleted: boolean;
        };
    } & {
        id: number;
        showId: number;
        orderNumber: number;
        createdAt: Date;
        raced: boolean;
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
        person1: string;
        song1Id: number;
        person2: string;
        song2Id: number;
        bikeWon: number;
    }>;
}
