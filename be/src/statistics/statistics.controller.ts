import { Controller, Get } from "@nestjs/common";
import { StatsService } from "../prisma-api/stats.service";

@Controller('api/statistics')
export class StatisticsController {
  constructor(private readonly statsService: StatsService) {}

  @Get("most-played-songs")
  async mostPlayedSongs() {
    return await this.statsService.mostPlayedSongs()
  }
}
