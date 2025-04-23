import { mostPlayedSongs } from "@prisma/client/sql";
import { PrismaService } from "./prisma.service";
export declare class StatsService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly logger;
    mostPlayedSongs(): Promise<mostPlayedSongs.Result[]>;
}
