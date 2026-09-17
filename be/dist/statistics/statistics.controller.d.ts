import { StatsService } from "../prisma-api/stats.service";
export declare class StatisticsController {
    private readonly statsService;
    constructor(statsService: StatsService);
    mostPlayedSongs(): Promise<import("../prisma-api/stats.service").SongPlayCount[]>;
    mostWishedSongs(): Promise<import("../prisma-api/stats.service").SongPlayCount[]>;
    neverWishedSongs(): Promise<import("../prisma-api/stats.service").Song[]>;
    whichBikeWonMost(): Promise<import("../prisma-api/stats.service").BikeWonCount[]>;
}
