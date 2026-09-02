import { PrismaService } from "./prisma.service";
import { Show, Prisma } from "@prisma/client";
export declare class ShowService {
    private prisma;
    constructor(prisma: PrismaService);
    show(ShowWhereUniqueInput: Prisma.ShowWhereUniqueInput): Promise<Show | null>;
    shows(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.ShowWhereUniqueInput;
        where?: Prisma.ShowWhereInput;
        orderBy?: Prisma.ShowOrderByWithRelationInput;
    }): Promise<Show[]>;
    showsOrderedByActiveAndDate(): Promise<Show[]>;
    createShow(data: Prisma.ShowCreateInput): Promise<Show>;
    updateShow(params: {
        where: Prisma.ShowWhereUniqueInput;
        data: Prisma.ShowUpdateInput;
    }): Promise<Show>;
    deleteShowWithRacesAndShifts(id: string): Promise<[Prisma.BatchPayload, Prisma.BatchPayload, Prisma.BatchPayload, {
        id: number;
        name: string;
        date: Date | null;
        actualStartTime: Date | null;
        duration: number | null;
        finished: boolean;
        active: boolean;
    }]>;
    allShowsWithRaces(): Prisma.PrismaPromise<({
        races: {
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
        }[];
        shifts: {
            id: number;
            showId: number;
            duration: number | null;
            order: number;
            shiftStarted: Date | null;
            shiftFinished: Date | null;
        }[];
    } & {
        id: number;
        name: string;
        date: Date | null;
        actualStartTime: Date | null;
        duration: number | null;
        finished: boolean;
        active: boolean;
    })[]>;
}
