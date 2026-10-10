import { mkdtemp, readFile, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { ConfigService } from "@nestjs/config";
import { ExportService } from "../export/export.service";
import { ImportSnapshotService } from "./import-snapshot.service";

describe("ImportSnapshotService", () => {
  let dir: string;
  const exported = { formatVersion: 2, shows: [{ id: 1 }] };
  const exportService = {
    exportDatabase: jest.fn().mockResolvedValue(exported),
  } as unknown as ExportService;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "import-snapshot-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  function service(configured: string | undefined) {
    const config = { get: () => configured } as unknown as ConfigService;
    return new ImportSnapshotService(exportService, config);
  }

  it("writes the current export to a timestamped pre-import file in the configured directory", async () => {
    const path = await service(dir).save();

    expect(path.startsWith(dir)).toBe(true);
    expect(path).toMatch(/pre-import-.*\.json$/);
    expect(JSON.parse(await readFile(path, "utf-8"))).toEqual(exported);
  });

  it("creates the directory when it does not exist yet", async () => {
    const nested = join(dir, "a", "b");

    await service(nested).save();

    expect(await readdir(nested)).toHaveLength(1);
  });

  it("falls back to a directory below the system temp dir when none is configured", async () => {
    const path = await service(undefined).save();
    try {
      expect(path.startsWith(tmpdir())).toBe(true);
    } finally {
      await rm(path, { force: true });
    }
  });

  it("does not overwrite an earlier snapshot taken in the same millisecond", async () => {
    const sut = service(dir);
    jest
      .spyOn(Date.prototype, "toISOString")
      .mockReturnValue("2026-01-01T00:00:00.000Z");
    try {
      await sut.save();
      await sut.save();
    } finally {
      jest.restoreAllMocks();
    }

    expect(await readdir(dir)).toHaveLength(2);
  });
});
