"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StatsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("./prisma.service");
let StatsService = StatsService_1 = class StatsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(StatsService_1.name);
    }
    mostPlayedSongs() {
        return this.prisma.$queryRaw(client_1.Prisma.sql `
      SELECT
        s.artist, s.name, stats."totalCount" AS "totalCount"
      FROM "Song" s
        INNER JOIN (
          SELECT
            (COALESCE(s1."songId", s2."songId")) AS "songId",
            (COALESCE(s1."countSong1",0)+COALESCE(s2."countSong2",0)) AS "totalCount"
          FROM (
            SELECT
              r."song1Id" AS "songId",
              COUNT(r."song1Id")::int AS "countSong1"
            FROM "Race" r
            WHERE r.raced = true
            GROUP BY r."song1Id"
          ) AS s1
          LEFT OUTER JOIN (
            SELECT
              r."song2Id" AS "songId",
              COUNT(r."song2Id")::int AS "countSong2"
            FROM "Race" r
            WHERE r.raced = true
            GROUP BY r."song2Id"
          ) AS s2 ON (s1."songId" = s2."songId")
        ) as stats ON (s.id = stats."songId")
      ORDER BY stats."totalCount" DESC
    `);
    }
    mostWishedSongs() {
        return this.prisma.$queryRaw(client_1.Prisma.sql `
      SELECT
        s.artist, s.name, stats."totalCount" AS "totalCount"
      FROM "Song" s
        INNER JOIN (
          SELECT
            (COALESCE(s1."songId", s2."songId")) AS "songId",
            (COALESCE(s1."countSong1",0)+COALESCE(s2."countSong2",0)) AS "totalCount"
          FROM (
            SELECT
              r."song1Id" AS "songId",
              COUNT(r."song1Id")::int AS "countSong1"
            FROM "Race" r
            GROUP BY r."song1Id"
          ) AS s1
          LEFT OUTER JOIN (
            SELECT
              r."song2Id" AS "songId",
              COUNT(r."song2Id")::int AS "countSong2"
            FROM "Race" r
            GROUP BY r."song2Id"
          ) AS s2 ON (s1."songId" = s2."songId")
        ) as stats ON (s.id = stats."songId")
      ORDER BY stats."totalCount" DESC
    `);
    }
    neverWishedSongs() {
        return this.prisma.$queryRaw(client_1.Prisma.sql `
      SELECT
        s.artist, s.name
      FROM "Song" s
        LEFT JOIN (
          SELECT
            (COALESCE(s1."songId", s2."songId")) AS "songId",
            (COALESCE(s1."countSong1",0)+COALESCE(s2."countSong2",0)) AS "totalCount"
          FROM (
            SELECT
              r."song1Id" AS "songId",
              COUNT(r."song1Id")::int AS "countSong1"
            FROM "Race" r
            GROUP BY r."song1Id"
          ) AS s1
          LEFT OUTER JOIN (
            SELECT
              r."song2Id" AS "songId",
              COUNT(r."song2Id")::int AS "countSong2"
            FROM "Race" r
            GROUP BY r."song2Id"
          ) AS s2 ON (s1."songId" = s2."songId")
        ) as stats ON (s.id = stats."songId")
      WHERE s.selectable = true AND s.deleted = false AND stats."totalCount" IS NULL
    `);
    }
    whichBikeWonMost() {
        return this.prisma.$queryRaw(client_1.Prisma.sql `
      SELECT
        COUNT(r."bikeWon")::int as "timesWon", r."bikeWon"
      FROM "Race" r
      GROUP BY r."bikeWon"
      ORDER BY "timesWon" DESC
    `);
    }
};
exports.StatsService = StatsService;
exports.StatsService = StatsService = StatsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StatsService);
//# sourceMappingURL=stats.service.js.map