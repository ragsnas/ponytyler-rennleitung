import { Injectable, Logger } from "@nestjs/common";
import { mostPlayedSongs } from "@prisma/client/sql";
import { PrismaService } from "./prisma.service";

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  private readonly logger = new Logger(StatsService.name);

  async mostPlayedSongs() {
    const mostPlayedSongsList = await this.prisma.$queryRawTyped(mostPlayedSongs());
    this.logger.log(`mostPlayedSongsList:`, mostPlayedSongsList);

    return mostPlayedSongsList;
  }
}