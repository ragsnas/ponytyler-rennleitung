import { PrismaService } from "../prisma-api/prisma.service";
import { DatabaseImportSummary } from "./import.types";
export declare class ImportService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    importDatabase(raw: unknown): Promise<DatabaseImportSummary>;
    private validate;
}
