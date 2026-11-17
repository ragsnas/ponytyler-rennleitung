import { Module } from "@nestjs/common";
import { RaceController } from "./race.controller";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";
import { RaceControlService } from "./race-control.service";

@Module({
  imports: [PrismaApiModule],
  controllers: [RaceController],
  providers: [RaceControlService],
})
export class RaceModule {}
