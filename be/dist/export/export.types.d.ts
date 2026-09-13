import { Race, Shift, ShiftRole, Show, Song } from "@prisma/client";
export type ExportedUser = {
    id: number;
    name: string;
};
export declare const DATABASE_EXPORT_FORMAT_VERSION = 1;
export interface DatabaseExport {
    formatVersion: typeof DATABASE_EXPORT_FORMAT_VERSION;
    exportedAt: string;
    shows: Show[];
    shifts: Shift[];
    shiftRoles: ShiftRole[];
    songs: Song[];
    races: Race[];
    users: ExportedUser[];
}
