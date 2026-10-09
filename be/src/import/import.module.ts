import { Module } from "@nestjs/common";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";
import { ImportController } from "./import.controller";
import { ImportService } from "./import.service";

@Module({
  imports: [PrismaApiModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
