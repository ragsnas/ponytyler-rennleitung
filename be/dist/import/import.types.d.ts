export interface DatabaseImportSummary {
    formatVersion: number;
    importedAt: string;
    imported: {
        shows: number;
        shifts: number;
        shiftRoles: number;
        songs: number;
        races: number;
        users: number;
    };
}
