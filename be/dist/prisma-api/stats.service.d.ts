import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
export interface SongPlayCount {
    artist: string;
    name: string;
    totalCount: number;
}
export declare class StatsService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly logger;
    mostPlayedSongs(): Prisma.PrismaPromise<SongPlayCount[]>;
    mostWishedSongs(): Promise<any[]>;
    neverWishedSongs(): Promise<any[]>;
    whichBikeWonMost(): Promise<any>;
}
