import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ShowService } from "./show.service";
import { RaceService } from "./race.service";
import { SongService } from "./song.service";
import { PrismaService } from "./prisma.service";
import { ShiftsService } from "./shifts.service";
import { StatsService } from "./stats.service";
import { EncoreSongService } from "./encore-song.service";

@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    RaceService,
    ShowService,
    ShiftsService,
    SongService,
    StatsService,
    EncoreSongService,
  ],
  exports: [
    PrismaService,
    RaceService,
    ShowService,
    ShiftsService,
    SongService,
    StatsService,
    EncoreSongService,
  ],
})
export class PrismaApiModule {}
