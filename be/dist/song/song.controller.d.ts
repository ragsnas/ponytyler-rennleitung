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
        origin: string;
    }>;
    findAll(): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
        origin: string;
    }[]>;
    findAllSelectable(): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
        origin: string;
    }[]>;
    findOne(id: string): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
        origin: string;
    }>;
    search(text: string): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
        origin: string;
    }[]>;
    syncWithSingleSourceOfTruth(): Promise<boolean>;
    update(id: string, data: Prisma.SongUpdateInput): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
        origin: string;
    }>;
    remove(id: string): Promise<{
        id: number;
        name: string;
        artist: string;
        selectable: boolean;
        deleted: boolean;
        origin: string;
    }>;
}
