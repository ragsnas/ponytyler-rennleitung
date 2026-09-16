import { StatsService } from "../prisma-api/stats.service";
export declare class StatisticsController {
    private readonly statsService;
    constructor(statsService: StatsService);
    mostPlayedSongs(): Promise<import("../prisma-api/stats.service").SongPlayCount[]>;
    mostWishedSongs(): Promise<any[]>;
    neverWishedSongs(): Promise<any[]>;
    whichBikeWonMost(): Promise<any>;
}
