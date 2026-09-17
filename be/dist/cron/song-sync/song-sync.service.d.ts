import { HttpService } from "@nestjs/axios";
import { SongService } from "../../prisma-api/song.service";
export declare class SongSyncService {
    private readonly httpService;
    private readonly songService;
    private readonly logger;
    private syncInProgress;
    constructor(httpService: HttpService, songService: SongService);
    handleCron(): Promise<void>;
    triggerSync(): Promise<void>;
    private runSync;
    updateSelectability(): Promise<void>;
    private cleanSongname;
    private parseSonglistPage;
    private decodeHtmlEntities;
    private songToString;
}
