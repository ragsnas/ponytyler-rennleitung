import { Module } from "@nestjs/common";
import { PrismaApiModule } from "src/prisma-api/prisma-api.module";
import { ShiftsController } from "./shifts.controller";

@Module({
  imports: [PrismaApiModule],
  controllers: [ShiftsController],
})
export class ShiftsModule {}
