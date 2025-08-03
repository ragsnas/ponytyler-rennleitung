import { Controller, Get } from "@nestjs/common";
import { StatsService } from "../prisma-api/stats.service";

@Controller('api/statistics')
export class StatisticsController {
  constructor(private readonly statsService: StatsService) {}

  @Get("most-played-songs")
  async mostPlayedSongs() {
    return await this.statsService.mostPlayedSongs()
  }

  @Get("most-wished-songs")
  async mostWishedSongs() {
    return await this.statsService.mostWishedSongs()
  }

  @Get("never-wished-songs")
  async neverWishedSongs() {
    return await this.statsService.neverWishedSongs()
  }
  @Get("which-bike-won-most")
  async whichBikeWonMost() {
    return await this.statsService.whichBikeWonMost()
  }
}
