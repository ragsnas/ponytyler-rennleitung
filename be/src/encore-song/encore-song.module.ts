import { Module } from "@nestjs/common";
import { EncoreSongController } from "./encore-song.controller";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";

@Module({
  imports: [PrismaApiModule],
  controllers: [EncoreSongController],
})
export class EncoreSongModule {}
