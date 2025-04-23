import { Module } from "@nestjs/common";
import { ShowService } from "./show.service";
import { RaceService } from "./race.service";
import { SongService } from "./song.service";
import { PrismaService } from "./prisma.service";
import { ShiftsService } from "./shifts.service";
import { StatsService } from "./stats.service";

@Module({
  imports: [],
  providers: [
    PrismaService,
    RaceService,
    ShowService,
    ShiftsService,
    SongService,
    StatsService],
  exports: [
    PrismaService,
    RaceService,
    ShowService,
    ShiftsService,
    SongService,
    StatsService],
})
export class PrismaApiModule {
}
