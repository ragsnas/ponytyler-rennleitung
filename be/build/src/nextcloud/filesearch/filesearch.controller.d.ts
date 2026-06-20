import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
export declare class FilesearchController {
    private configService;
    private readonly httpService;
    constructor(configService: ConfigService, httpService: HttpService);
    getVideos(): Promise<void>;
}
