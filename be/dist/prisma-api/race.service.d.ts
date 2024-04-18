import { PrismaService } from './prisma.service';
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
        raceState: string;
        person1: string;
        song1Id: number;
        person2: string;
        song2Id: number;
        bikeWon: number;
    }>;
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
    deleteRace(where: Prisma.RaceWhereUniqueInput): Promise<Race>;
}
