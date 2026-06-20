import { PrismaService } from "./prisma.service";
import { Prisma, Race } from "@prisma/client";
export declare class RaceService {
    private prisma;
    constructor(prisma: PrismaService);
    race(raceWhereUniqueInput: Prisma.RaceWhereUniqueInput): Promise<Race | null>;
    raceWithSongs(raceId: string): Promise<Race | null>;
    upcomingRaceWithSongs(): Promise<any>;
    upcomingRacesWithSongs(): Promise<any>;
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
    repairOrder(showId: string): Promise<any>;
    moveRacePosition(params: {
        raceToMoveId: string;
        upOrDown: string;
    }): Promise<any>;
    private calculateRaceState;
    deleteRace(where: Prisma.RaceWhereUniqueInput): Promise<Race>;
}
