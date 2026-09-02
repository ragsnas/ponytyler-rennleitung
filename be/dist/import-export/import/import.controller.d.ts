import { ImportReport, ImportService, ShowWithRaces } from './import.service';
export declare class ImportController {
    private readonly importService;
    constructor(importService: ImportService);
    import(importData: ShowWithRaces[]): Promise<ImportReport>;
}
