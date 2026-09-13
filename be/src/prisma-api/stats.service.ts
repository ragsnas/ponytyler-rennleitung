import { Injectable, Logger } from "@nestjs/common";
// import { mostPlayedSongs, mostWishedSongs, neverWishedSongs, whichBikeWonMost } from "@prisma/client/sql";
import { PrismaService } from "./prisma.service";

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  private readonly logger = new Logger(StatsService.name);

  mostPlayedSongs() {
    // TODO: Implement once Prisma SQL functions are defined in schema
    return Promise.resolve([]);
  }

  mostWishedSongs() {
    // TODO: Implement once Prisma SQL functions are defined in schema
    return Promise.resolve([]);
  }

  neverWishedSongs() {
    // TODO: Implement once Prisma SQL functions are defined in schema
    return Promise.resolve([]);
  }

  whichBikeWonMost() {
    // TODO: Implement once Prisma SQL functions are defined in schema
    return Promise.resolve(null);
  }
}
