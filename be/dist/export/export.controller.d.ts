import { ExportService } from "./export.service";
import { DatabaseExport } from "./export.types";
export declare class ExportController {
    private readonly exportService;
    constructor(exportService: ExportService);
    exportDatabase(): Promise<DatabaseExport>;
}
