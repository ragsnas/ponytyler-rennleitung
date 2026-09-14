import { Module } from "@nestjs/common";
import { SongController } from "./song.controller";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";

@Module({
  imports: [PrismaApiModule],
  controllers: [SongController],
})
export class SongModule {}
