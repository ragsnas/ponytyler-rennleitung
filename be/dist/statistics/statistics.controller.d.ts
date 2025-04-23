import { StatsService } from "../prisma-api/stats.service";
export declare class StatisticsController {
    private readonly statsService;
    constructor(statsService: StatsService);
    mostPlayedSongs(): Promise<import(".prisma/client/sql").mostPlayedSongs.Result[]>;
}
