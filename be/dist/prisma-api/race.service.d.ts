import { PrismaService } from "./prisma.service";
import { Prisma, Race } from "@prisma/client";
export declare class RaceService {
    private prisma;
    constructor(prisma: PrismaService);
    race(raceWhereUniqueInput: Prisma.RaceWhereUniqueInput): Promise<Race | null>;
    raceWithSongs(raceId: string): Promise<Race | null>;
    upcomingRaceWithSongs(): Promise<{
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
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    }>;
    upcomingRacesWithSongs(): Promise<({
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
        person1: string | null;
        song1Id: number | null;
        person2: string | null;
        song2Id: number | null;
        bikeWon: number;
    })[]>;
    races(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.RaceWhereUniqueInput;
        where?: Prisma.RaceWhereInput;
        orderBy?: Prisma.RaceOrderByWithRelationInput;
    }): Promise<Race[]>;
    createRace(data: Prisma.RaceUncheckedCreateInput): Promise<Race>;
    updateRace(params: {
        where: Prisma.RaceWhereUniqueInput;
        data: Prisma.RaceUncheckedUpdateInput;
    }): Promise<Race>;
    repairOrder(showId: string): Promise<any[]>;
    moveRacePosition(params: {
        raceToMoveId: string;
        upOrDown: string;
    }): Promise<[{
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
    private calculateRaceState;
    deleteRace(where: Prisma.RaceWhereUniqueInput): Promise<Race>;
}
