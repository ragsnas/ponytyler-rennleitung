export declare class DbBackupService {
    private readonly logger;
    private prismaFolder;
    private backupFolder;
    constructor();
    hourly(): Promise<void>;
    private createBackup;
    private getDestinationPath;
    private createDirIfNotExists;
    private isBackupNecessary;
    private getLastBackupFileFilename;
}
