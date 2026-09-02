import { Module } from '@nestjs/common';
import { ExportController } from './export/export.controller';
import { ImportController } from './import/import.controller';
import { ImportService } from './import/import.service';
import { ExportService } from './export/export.service';
import { PrismaApiModule } from 'src/prisma-api/prisma-api.module';

@Module({
  controllers: [ExportController, ImportController],
  providers: [ImportService, ExportService],
  imports: [PrismaApiModule]
})
export class ImportExportModule {}
