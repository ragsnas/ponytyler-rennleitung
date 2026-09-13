import { PrismaService } from "../prisma-api/prisma.service";
import { DatabaseExport } from "./export.types";
export declare class ExportService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    exportDatabase(): Promise<DatabaseExport>;
}
