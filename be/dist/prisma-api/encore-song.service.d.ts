import { PrismaService } from "./prisma.service";
import { EncoreSong } from "@prisma/client";
export interface CreateEncoreSongInput {
    showId: number | string;
    songId: number | string;
}
export declare class EncoreSongService {
    private prisma;
    constructor(prisma: PrismaService);
    encoreSongsForShow(showId: number): Promise<EncoreSong[]>;
    createEncoreSong(data: CreateEncoreSongInput): Promise<EncoreSong>;
}
