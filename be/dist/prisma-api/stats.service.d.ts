import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
export interface SongPlayCount {
    artist: string;
    name: string;
    totalCount: number;
}
export interface Song {
    artist: string;
    name: string;
}
export interface BikeWonCount {
    bikeWon: number;
    timesWon: number;
}
export declare class StatsService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly logger;
    mostPlayedSongs(): Prisma.PrismaPromise<SongPlayCount[]>;
    mostWishedSongs(): Prisma.PrismaPromise<SongPlayCount[]>;
    neverWishedSongs(): Prisma.PrismaPromise<Song[]>;
    whichBikeWonMost(): Prisma.PrismaPromise<BikeWonCount[]>;
}
