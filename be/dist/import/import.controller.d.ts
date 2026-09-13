import { ImportService } from "./import.service";
import { DatabaseImportSummary } from "./import.types";
export declare class ImportController {
    private readonly importService;
    constructor(importService: ImportService);
    importDatabase(file: Express.Multer.File): Promise<DatabaseImportSummary>;
}
