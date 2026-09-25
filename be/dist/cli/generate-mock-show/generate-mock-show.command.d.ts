import { RaceService } from "../../prisma-api/race.service";
import { ShowService } from "../../prisma-api/show.service";
import { SongService } from "../../prisma-api/song.service";
import { SongSyncService } from "../../cron/song-sync/song-sync.service";
export declare class GenerateMockShowCommand {
    private readonly songSyncService;
    private readonly songService;
    private readonly showService;
    private readonly raceService;
    private readonly logger;
    constructor(songSyncService: SongSyncService, songService: SongService, showService: ShowService, raceService: RaceService);
    run(): Promise<void>;
    private createShowWithRandomTitle;
    private isUniqueConstraintError;
    private pickTwoDistinctSongs;
    private pickTwoDistinctPersonNames;
}
