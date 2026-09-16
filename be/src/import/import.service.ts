import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma-api/prisma.service";
import {
  DatabaseExport,
  DATABASE_EXPORT_FORMAT_VERSION,
} from "../export/export.types";
import { DatabaseImportSummary } from "./import.types";

const REQUIRED_ARRAY_KEYS = [
  "shows",
  "shifts",
  "shiftRoles",
  "songs",
  "races",
  "users",
] as const;

/**
 * Every table this import touches, in the order their rows must be deleted
 * (children before parents) — see prisma/schema.prisma for the foreign keys
 * this respects. Also the list of `id` sequences that need resetting after
 * a bulk import with explicit ids (see the loop in importDatabase below).
 */
const TABLES_CHILD_TO_PARENT = [
  "ShiftRole",
  "Race",
  "Shift",
  "Show",
  "Song",
  "User",
] as const;

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importDatabase(raw: unknown): Promise<DatabaseImportSummary> {
    const data = this.validate(raw);

    await this.prisma.$transaction(async (tx) => {
      // Wipe children before parents so foreign key constraints don't block the delete.
      await tx.shiftRole.deleteMany();
      await tx.race.deleteMany();
      await tx.shift.deleteMany();
      await tx.show.deleteMany();
      await tx.song.deleteMany();
      await tx.user.deleteMany();

      // Recreate parents before children, preserving the original ids so
      // every foreign key in the export still resolves.
      if (data.shows.length) await tx.show.createMany({ data: data.shows });
      if (data.songs.length) await tx.song.createMany({ data: data.songs });
      if (data.users.length) await tx.user.createMany({ data: data.users });
      if (data.shifts.length) await tx.shift.createMany({ data: data.shifts });
      if (data.races.length) await tx.race.createMany({ data: data.races });
      if (data.shiftRoles.length)
        await tx.shiftRole.createMany({ data: data.shiftRoles });

      for (const table of TABLES_CHILD_TO_PARENT) {
        // Bulk-inserting rows with explicit `id`s bypasses each table's
        // autoincrement sequence, so the next plain `create()` after import
        // would try to reuse an id that's already taken. Fast-forward the
        // sequence to (max id) + 1 for every imported table.
        await tx.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`,
        );
      }
    });

    this.logger.log(
      `Imported database export (formatVersion ${data.formatVersion})`,
    );

    return {
      formatVersion: data.formatVersion,
      importedAt: new Date().toISOString(),
      imported: {
        shows: data.shows.length,
        shifts: data.shifts.length,
        shiftRoles: data.shiftRoles.length,
        songs: data.songs.length,
        races: data.races.length,
        users: data.users.length,
      },
    };
  }

  private validate(raw: unknown): DatabaseExport {
    if (!raw || typeof raw !== "object") {
      throw new BadRequestException("Import file is not a valid JSON object.");
    }

    const data = raw as Partial<DatabaseExport>;

    if (data.formatVersion !== DATABASE_EXPORT_FORMAT_VERSION) {
      throw new BadRequestException(
        `Unsupported export formatVersion "${data.formatVersion}". This backend can only import formatVersion ${DATABASE_EXPORT_FORMAT_VERSION}.`,
      );
    }

    for (const key of REQUIRED_ARRAY_KEYS) {
      if (!Array.isArray(data[key])) {
        throw new BadRequestException(
          `Import file is missing the "${key}" array.`,
        );
      }
    }

    return data as DatabaseExport;
  }
}
