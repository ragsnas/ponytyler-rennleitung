import { Controller, Get } from '@nestjs/common';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(
    private readonly exportService: ExportService
  ) {}

    @Get()
    exportAllData() {
        return this.exportService.allShowsWithRaces();
    }
}
