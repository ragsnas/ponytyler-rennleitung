import { Controller, Get, Header } from "@nestjs/common";
import { ExportService } from "./export.service";
import { DatabaseExport } from "./export.types";

@Controller("api/export")
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get("database")
  @Header(
    "Content-Disposition",
    'attachment; filename="ponytyler-db-export.json"',
  )
  async exportDatabase(): Promise<DatabaseExport> {
    return this.exportService.exportDatabase();
  }
}
