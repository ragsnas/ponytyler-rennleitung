import { HttpService } from "@nestjs/axios";
import { SongService } from "../../prisma-api/song.service";
export declare class SongSyncService {
    private readonly httpService;
    private readonly songService;
    constructor(httpService: HttpService, songService: SongService);
    private readonly logger;
    handleCron(): Promise<void>;
    private cleanSongname;
    private songToString;
}
