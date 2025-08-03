import { StreamableFile } from "@nestjs/common";
import { DbBackupService } from "../cron/db-backup/db-backup.service";
export declare class BackupController {
    private dbBackupService;
    private prismaFolder;
    constructor(dbBackupService: DbBackupService);
    downloadBackup(): StreamableFile;
    downloadBackupPossible(): Promise<boolean>;
    uploadBackup(file: Express.Multer.File): void;
}
