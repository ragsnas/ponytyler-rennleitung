import { Module } from "@nestjs/common";
import { ShowService } from "./show.service";
import { RaceService } from "./race.service";
import { SongService } from "./song.service";
import { PrismaService } from "./prisma.service";
import { ShiftsService } from "./shifts.service";

@Module({
  imports: [],
  providers: [PrismaService, RaceService, ShowService, ShiftsService, SongService],
  exports: [PrismaService, RaceService, ShowService, ShiftsService, SongService],
})
export class PrismaApiModule {}
