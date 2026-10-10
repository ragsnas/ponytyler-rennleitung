import { EncoreSong, Race, Shift, ShiftRole, Show, Song } from "@prisma/client";

/**
 * A user row with the password stripped out — the export is a JSON file
 * that ends up on disk / in someone's downloads, so credentials never go in.
 */
export type ExportedUser = {
  id: number;
  name: string;
};

/**
 * The current version of the database export format. Bump this whenever the
 * shape below changes so consumers (and README.md in this folder) can tell
 * exports apart.
 *
 * - 1: shows, shifts, shiftRoles, songs, races, users
 * - 2: adds encoreSongs
 */
export const DATABASE_EXPORT_FORMAT_VERSION = 2;

/** Versions the import still understands (1 = no encore songs). */
export const SUPPORTED_IMPORT_FORMAT_VERSIONS: readonly number[] = [1, 2];

export interface DatabaseExport {
  formatVersion: typeof DATABASE_EXPORT_FORMAT_VERSION;
  exportedAt: string;
  shows: Show[];
  shifts: Shift[];
  shiftRoles: ShiftRole[];
  songs: Song[];
  races: Race[];
  users: ExportedUser[];
  encoreSongs: EncoreSong[];
}
