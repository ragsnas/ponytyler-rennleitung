import { CreateEncoreSongInput, EncoreSongService } from "../prisma-api/encore-song.service";
export declare class EncoreSongController {
    private readonly encoreSongService;
    constructor(encoreSongService: EncoreSongService);
    create(data: CreateEncoreSongInput): Promise<{
        id: number;
        showId: number;
        order: number;
        songId: number;
    }>;
    findForShow(showId: string): Promise<{
        id: number;
        showId: number;
        order: number;
        songId: number;
    }[]>;
}
