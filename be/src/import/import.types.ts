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
    encoreSongs: number;
  };
  /** File name of the snapshot of the previous database taken before the import. */
  snapshot: string;
}
