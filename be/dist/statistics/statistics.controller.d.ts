import { StatsService } from "../prisma-api/stats.service";
export declare class StatisticsController {
    private readonly statsService;
    constructor(statsService: StatsService);
    mostPlayedSongs(): Promise<import(".prisma/client/sql").mostPlayedSongs.Result[]>;
    mostWishedSongs(): Promise<import(".prisma/client/sql").mostWishedSongs.Result[]>;
    neverWishedSongs(): Promise<import(".prisma/client/sql").neverWishedSongs.Result[]>;
    whichBikeWonMost(): Promise<import(".prisma/client/sql").whichBikeWonMost.Result[]>;
}
