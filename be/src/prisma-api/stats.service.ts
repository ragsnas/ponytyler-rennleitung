import { Injectable, Logger } from "@nestjs/common";
import { mostPlayedSongs, mostWishedSongs, neverWishedSongs } from "@prisma/client/sql";
import { PrismaService } from "./prisma.service";

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  private readonly logger = new Logger(StatsService.name);

  mostPlayedSongs() {
    return this.prisma.$queryRawTyped(mostPlayedSongs());
  }

  mostWishedSongs() {
    return this.prisma.$queryRawTyped(mostWishedSongs());
  }

  neverWishedSongs() {
    return this.prisma.$queryRawTyped(neverWishedSongs());
  }
}