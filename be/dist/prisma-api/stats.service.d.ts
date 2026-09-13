import { PrismaService } from "./prisma.service";
export declare class StatsService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly logger;
    mostPlayedSongs(): Promise<any[]>;
    mostWishedSongs(): Promise<any[]>;
    neverWishedSongs(): Promise<any[]>;
    whichBikeWonMost(): Promise<any>;
}
