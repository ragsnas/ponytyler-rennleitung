export declare class DbBackupService {
    private readonly logger;
    private prismaFolder;
    private backupFolder;
    constructor();
    hourly(): Promise<void>;
    private createBackup;
    getDestinationPath(backupDate: Date): string;
    private createDirIfNotExists;
    private hashFile;
    private isBackupNecessary;
    private getLastBackupFileFilename;
}
