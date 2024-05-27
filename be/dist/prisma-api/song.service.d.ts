import { PrismaService } from './prisma.service';
import { Prisma, Song } from '@prisma/client';
export declare class SongService {
    private prisma;
    constructor(prisma: PrismaService);
    song(SongWhereUniqueInput: Prisma.SongWhereUniqueInput): Promise<Song | null>;
    songs(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.SongWhereUniqueInput;
        where?: Prisma.SongWhereInput;
        orderBy?: Prisma.SongOrderByWithRelationInput | Prisma.SongOrderByWithRelationInput[];
    }): Promise<Song[]>;
    createSong(data: Prisma.SongCreateInput): Promise<Song>;
    updateSong(params: {
        where: Prisma.SongWhereUniqueInput;
        data: Prisma.SongUpdateInput;
    }): Promise<Song>;
    deleteSong(where: Prisma.SongWhereUniqueInput): Promise<Song>;
    syncWithSingleSourceOfTruth(): Promise<boolean>;
}
