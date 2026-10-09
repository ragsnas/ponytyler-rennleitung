import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";

export interface SongPlayCount {
  artist: string;
  name: string;
  totalCount: number;
}

export interface Song {
  artist: string;
  name: string;
}

export interface BikeWonCount {
  bikeWon: number;
  timesWon: number;
}

const DEFAULT_RANKING_LIMIT = 100;

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  private readonly logger = new Logger(StatsService.name);

  /**
   * Every time a song was picked, from either position of a race: one row per
   * pick. All ranking queries are built on this so song 1 and song 2 picks
   * are always counted together.
   */
  private static readonly PICKS = Prisma.sql`
    picks AS (
      SELECT r."song1Id" AS "songId", r.raced FROM "Race" r WHERE r."song1Id" IS NOT NULL
      UNION ALL
      SELECT r."song2Id" AS "songId", r.raced FROM "Race" r WHERE r."song2Id" IS NOT NULL
    )
  `;

  /** Songs ranked by how often they were raced; at most `limit` rows. */
  mostPlayedSongs(limit = DEFAULT_RANKING_LIMIT) {
    return this.prisma.$queryRaw<SongPlayCount[]>(Prisma.sql`
      WITH ${StatsService.PICKS}
      SELECT s.artist, s.name, COUNT(*)::int AS "totalCount"
      FROM picks p
        INNER JOIN "Song" s ON s.id = p."songId"
      WHERE p.raced = true
      GROUP BY s.id, s.artist, s.name
      ORDER BY "totalCount" DESC, s.artist, s.name
      LIMIT ${limit}
    `);
  }

  /** Songs ranked by how often they were picked (raced or not); at most `limit` rows. */
  mostWishedSongs(limit = DEFAULT_RANKING_LIMIT) {
    return this.prisma.$queryRaw<SongPlayCount[]>(Prisma.sql`
      WITH ${StatsService.PICKS}
      SELECT s.artist, s.name, COUNT(*)::int AS "totalCount"
      FROM picks p
        INNER JOIN "Song" s ON s.id = p."songId"
      GROUP BY s.id, s.artist, s.name
      ORDER BY "totalCount" DESC, s.artist, s.name
      LIMIT ${limit}
    `);
  }

  /** Selectable songs nobody has ever picked, in either position. */
  neverWishedSongs() {
    return this.prisma.$queryRaw<Song[]>(Prisma.sql`
      WITH ${StatsService.PICKS}
      SELECT s.artist, s.name
      FROM "Song" s
      WHERE s.selectable = true
        AND s.deleted = false
        AND NOT EXISTS (SELECT 1 FROM picks p WHERE p."songId" = s.id)
      ORDER BY s.artist, s.name
    `);
  }

  whichBikeWonMost() {
    return this.prisma.$queryRaw<BikeWonCount[]>(Prisma.sql`
      SELECT
        COUNT(r."bikeWon")::int as "timesWon", r."bikeWon"
      FROM "Race" r
      GROUP BY r."bikeWon"
      ORDER BY "timesWon" DESC
    `);
  }
}
