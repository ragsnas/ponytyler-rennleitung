import { Controller, Get } from "@nestjs/common";

@Controller('statistics')
export class StatisticsController {
  constructor() {}

  @Get("most-played-songs")
  mostPlayedSongs() {
    return ''
  }

}
