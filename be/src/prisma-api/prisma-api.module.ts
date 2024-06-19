import { Module } from "@nestjs/common";
import { ShowService } from "./show.service";
import { RaceService } from "./race.service";
import { SongService } from "./song.service";
import { PrismaService } from "./prisma.service";

@Module({
  imports: [],
  providers: [PrismaService, RaceService, ShowService, SongService],
  exports: [PrismaService, RaceService, ShowService, SongService],
})
export class PrismaApiModule {}
