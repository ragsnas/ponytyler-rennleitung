export declare class DbBackupService {
    private readonly logger;
    private baseFolder;
    constructor();
    hourly(): Promise<void>;
    private createBackup;
    private getDestinationPath;
    private createDirIfNotExists;
    private isBackupNecessary;
    private getLastBackupFileFilename;
}
