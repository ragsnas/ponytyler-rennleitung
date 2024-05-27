import { SongService } from '../prisma-api/song.service';
import { Prisma } from '@prisma/client';
export declare class SongController {
    private readonly songService;
    constructor(songService: SongService);
    create(data: Prisma.SongCreateInput): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
    }>;
    findAll(): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
    }[]>;
    findAllSelectable(): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
    }>;
    search(text: string): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
    }[]>;
    syncWithSingleSourceOfTruth(): Promise<boolean>;
    update(id: string, data: Prisma.SongUpdateInput): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
    }>;
    remove(id: string): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
    }>;
}
