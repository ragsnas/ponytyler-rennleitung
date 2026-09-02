import { Body, Controller, Post } from '@nestjs/common';
import { ImportReport, ImportService, ShowWithRaces } from './import.service';

@Controller('import')
export class ImportController {
    
      constructor(
        private readonly importService: ImportService
      ) {}
    
    
    @Post()
    async import(@Body() importData: ShowWithRaces[]): Promise<ImportReport> {
        return this.importService.import(importData)
    }
}
