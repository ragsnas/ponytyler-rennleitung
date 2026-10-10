import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { ExportService } from "../export/export.service";

/**
 * Writes the current database (as an export, so without passwords) to disk
 * before an import wipes it — the transaction protects against a *failed*
 * import, the snapshot against importing the wrong file.
 */
@Injectable()
export class ImportSnapshotService {
  constructor(
    private readonly exportService: ExportService,
    private readonly configService: ConfigService,
  ) {}

  /** Returns the path of the written snapshot file. */
  async save(): Promise<string> {
    const directory =
      this.configService.get<string>("IMPORT_SNAPSHOT_DIR") ||
      join(tmpdir(), "ponytyler-import-snapshots");
    await mkdir(directory, { recursive: true });

    const snapshot = await this.exportService.exportDatabase();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    for (let attempt = 0; ; attempt++) {
      const suffix = attempt === 0 ? "" : `-${attempt}`;
      const path = join(directory, `pre-import-${stamp}${suffix}.json`);
      try {
        // "wx": never overwrite an earlier snapshot
        await writeFile(path, JSON.stringify(snapshot, null, 2), {
          flag: "wx",
        });
        return path;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
          throw error;
        }
      }
    }
  }
}
