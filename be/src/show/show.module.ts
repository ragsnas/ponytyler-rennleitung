import { Module } from "@nestjs/common";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";
import { ShowController } from "./show.controller";

@Module({
  imports: [PrismaApiModule],
  controllers: [ShowController],
})
export class ShowModule {}
