import { SongService } from "../prisma-api/song.service";
import { Prisma } from "@prisma/client";
export declare class SongController {
    private readonly songService;
    constructor(songService: SongService);
    create(data: Prisma.SongCreateInput): Promise<Song>;
    findAll(): Promise<Song[]>;
    findAllSelectable(): Promise<Song[]>;
    findOne(id: string): Promise<any>;
    search(text: string): Promise<Song[]>;
    syncWithSingleSourceOfTruth(): Promise<boolean>;
    update(id: string, data: Prisma.SongUpdateInput): Promise<Song>;
    remove(id: string): Promise<Song>;
}
