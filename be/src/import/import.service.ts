import { basename } from "path";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma-api/prisma.service";
import {
  DatabaseExport,
  SUPPORTED_IMPORT_FORMAT_VERSIONS,
} from "../export/export.types";
import { ImportSnapshotService } from "./import-snapshot.service";
import { DatabaseImportSummary } from "./import.types";
import { validateRows, ValidatedRows } from "./import.validation";

/** The default 5 s interactive-transaction timeout is too short for a big import. */
export const IMPORT_TRANSACTION_TIMEOUT_MS = 120_000;
export const IMPORT_TRANSACTION_MAX_WAIT_MS = 10_000;

const REQUIRED_ARRAY_KEYS = [
  "shows",
  "shifts",
  "shiftRoles",
  "songs",
  "races",
  "users",
] as const;

/** Added in formatVersion 2; a version 1 file is imported without them. */
const ENCORE_SONGS_SINCE_VERSION = 2;

/**
 * The database names of the tables whose `id` sequence needs resetting after
 * a bulk import with explicit ids (see the loop in importDatabase below).
 * Constants, so they are safe to inline into the SQL.
 */
const TABLES_WITH_SEQUENCE = [
  "ShiftRole",
  "Race",
  "Shift",
  "Show",
  "Song",
  "User",
  "encore_songs",
] as const;

type ImportData = ValidatedRows & { formatVersion: number };

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly snapshots: ImportSnapshotService,
  ) {}

  async importDatabase(raw: unknown): Promise<DatabaseImportSummary> {
    const data = this.validate(raw);

    // Keep a copy of what is about to be replaced; if this fails nothing has
    // been touched yet and the import is aborted.
    const snapshotPath = await this.snapshots.save();
    this.logger.log(`Saved snapshot of the current database: ${snapshotPath}`);

    await this.prisma.$transaction(
      async (tx) => {
        // The export carries no passwords, so keep the ones of users that
        // exist before and after the import instead of nulling them.
        const passwordsByName = new Map(
          (
            await tx.user.findMany({
              where: { password: { not: null } },
              select: { name: true, password: true },
            })
          ).map((user) => [user.name, user.password]),
        );

        // Wipe children before parents so foreign key constraints don't block the delete.
        await tx.encoreSong.deleteMany();
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
        if (data.users.length) {
          await tx.user.createMany({
            data: data.users.map((user) => {
              const password = passwordsByName.get(user.name);
              return password ? { ...user, password } : user;
            }),
          });
        }
        if (data.shifts.length)
          await tx.shift.createMany({ data: data.shifts });
        if (data.races.length) await tx.race.createMany({ data: data.races });
        if (data.shiftRoles.length)
          await tx.shiftRole.createMany({ data: data.shiftRoles });
        if (data.encoreSongs.length)
          await tx.encoreSong.createMany({ data: data.encoreSongs });

        for (const table of TABLES_WITH_SEQUENCE) {
          // Bulk-inserting rows with explicit `id`s bypasses each table's
          // autoincrement sequence, so the next plain `create()` after import
          // would try to reuse an id that's already taken. Fast-forward the
          // sequence to (max id) + 1 for every imported table.
          const quoted = Prisma.raw(`"${table}"`);
          await tx.$executeRaw(
            Prisma.sql`SELECT setval(pg_get_serial_sequence('${quoted}', 'id'), COALESCE((SELECT MAX(id) FROM ${quoted}), 0) + 1, false)`,
          );
        }
      },
      {
        timeout: IMPORT_TRANSACTION_TIMEOUT_MS,
        maxWait: IMPORT_TRANSACTION_MAX_WAIT_MS,
      },
    );

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
        encoreSongs: data.encoreSongs.length,
      },
      snapshot: basename(snapshotPath),
    };
  }

  private validate(raw: unknown): ImportData {
    if (!raw || typeof raw !== "object") {
      throw new BadRequestException("Import file is not a valid JSON object.");
    }

    const data = raw as Partial<DatabaseExport>;

    if (!SUPPORTED_IMPORT_FORMAT_VERSIONS.includes(data.formatVersion)) {
      throw new BadRequestException(
        `Unsupported export formatVersion "${data.formatVersion}". This backend can only import formatVersion ${SUPPORTED_IMPORT_FORMAT_VERSIONS.join(" or ")}.`,
      );
    }

    const requiredKeys: string[] = [...REQUIRED_ARRAY_KEYS];
    if (data.formatVersion >= ENCORE_SONGS_SINCE_VERSION) {
      requiredKeys.push("encoreSongs");
    }
    for (const key of requiredKeys) {
      if (!Array.isArray((data as Record<string, unknown>)[key])) {
        throw new BadRequestException(
          `Import file is missing the "${key}" array.`,
        );
      }
    }

    const rows = validateRows({
      ...data,
      encoreSongs: data.encoreSongs ?? [],
    });
    return { ...rows, formatVersion: data.formatVersion };
  }
}
