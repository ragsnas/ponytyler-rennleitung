import { HttpService } from "@nestjs/axios";
import { SongService } from "../../prisma-api/song.service";
export declare class SongSyncService {
    private readonly httpService;
    private readonly songService;
    private readonly logger;
    constructor(httpService: HttpService, songService: SongService);
    handleCron(): Promise<void>;
    private cleanSongname;
    private songToString;
}
