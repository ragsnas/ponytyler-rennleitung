import { Module } from "@nestjs/common";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";
import { ShiftsController } from "./shifts.controller";

@Module({
  imports: [PrismaApiModule],
  controllers: [ShiftsController],
})
export class ShiftsModule {}
