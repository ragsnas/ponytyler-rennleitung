import { mostPlayedSongs, mostWishedSongs, neverWishedSongs } from "@prisma/client/sql";
import { PrismaService } from "./prisma.service";
export declare class StatsService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly logger;
    mostPlayedSongs(): import(".prisma/client").Prisma.PrismaPromise<mostPlayedSongs.Result[]>;
    mostWishedSongs(): import(".prisma/client").Prisma.PrismaPromise<mostWishedSongs.Result[]>;
    neverWishedSongs(): import(".prisma/client").Prisma.PrismaPromise<neverWishedSongs.Result[]>;
}
