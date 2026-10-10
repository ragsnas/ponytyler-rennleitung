import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { EncoreSong } from "@prisma/client";

/** First key of the advisory lock taken per show when adding an encore song. */
const ENCORE_LOCK_NAMESPACE = 3;

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
    return this.prisma.$transaction(async (tx) => {
      // serialise concurrent adds to this show so two encore songs cannot get
      // the same order ((showId, order) is unique)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ENCORE_LOCK_NAMESPACE}::int, ${showId}::int)`;
      const { _max } = await tx.encoreSong.aggregate({
        where: { showId },
        _max: { order: true },
      });
      return tx.encoreSong.create({
        data: {
          showId,
          songId: Number(data.songId),
          order: (_max.order ?? -1) + 1,
        },
        include: { song: true },
      });
    });
  }
}
