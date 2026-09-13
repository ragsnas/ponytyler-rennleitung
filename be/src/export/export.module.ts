import { Module } from "@nestjs/common";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";

@Module({
  imports: [PrismaApiModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
