import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ExportModule } from "../export/export.module";
import { ImportSnapshotService } from "./import-snapshot.service";
import { PrismaApiModule } from "../prisma-api/prisma-api.module";
import { ImportController } from "./import.controller";
import { ImportService } from "./import.service";

@Module({
  imports: [PrismaApiModule, ExportModule, ConfigModule],
  controllers: [ImportController],
  providers: [ImportService, ImportSnapshotService],
})
export class ImportModule {}
