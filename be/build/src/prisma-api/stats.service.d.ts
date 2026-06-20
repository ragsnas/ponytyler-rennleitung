import { PrismaService } from "./prisma.service";
export declare class StatsService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly logger;
    mostPlayedSongs(): any;
    mostWishedSongs(): any;
    neverWishedSongs(): any;
    whichBikeWonMost(): any;
}
