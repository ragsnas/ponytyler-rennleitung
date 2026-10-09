import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { EncoreSong } from "@prisma/client";

export interface CreateEncoreSongInput {
  showId: number | string;
  songId: number | string;
}

@Injectable()
export class EncoreSongService {
  constructor(private prisma: PrismaService) {}

  async encoreSongsForShow(showId: number): Promise<EncoreSong[]> {
    return this.prisma.encoreSong.findMany({
      where: { showId },
      include: { song: true },
      orderBy: { order: "asc" },
    });
  }

  async createEncoreSong(data: CreateEncoreSongInput): Promise<EncoreSong> {
    const showId = Number(data.showId);
    const highestOrderEncoreSong: EncoreSong[] =
      await this.prisma.encoreSong.findMany({
        where: { showId },
        orderBy: { order: "desc" },
        take: 1,
      });
    return this.prisma.encoreSong.create({
      data: {
        showId,
        songId: Number(data.songId),
        order:
          highestOrderEncoreSong.length > 0
            ? Number(highestOrderEncoreSong[0].order) + 1
            : 0,
      },
      include: { song: true },
    });
  }
}
