import { existsSync, mkdirSync, readdirSync, readFileSync, copyFileSync } from "fs";
import { DbBackupService } from "./db-backup.service";
import { isDir } from "../../utils/isDir";

jest.mock("fs");
jest.mock("../../utils/isDir");

describe("DbBackupService", () => {
  let service: DbBackupService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DbBackupService();
  });

  describe("getDestinationPath", () => {
    it("returns the year/month/day path under prisma/backups and creates every missing directory", () => {
      (existsSync as jest.Mock).mockReturnValue(false);

      const result = service.getDestinationPath(new Date(2024, 2, 5));

      expect(result).toBe("prisma/backups/2024/03/05");
      expect(mkdirSync).toHaveBeenCalledWith("prisma/backups/2024");
      expect(mkdirSync).toHaveBeenCalledWith("prisma/backups/2024/03");
      expect(mkdirSync).toHaveBeenCalledWith("prisma/backups/2024/03/05");
      expect(mkdirSync).toHaveBeenCalledTimes(3);
    });

    it("only creates directories that don't already exist", () => {
      (existsSync as jest.Mock).mockImplementation(
        (path: string) =>
          path === "prisma/backups/2024" || path === "prisma/backups/2024/03",
      );

      const result = service.getDestinationPath(new Date(2024, 2, 5));

      expect(result).toBe("prisma/backups/2024/03/05");
      expect(mkdirSync).toHaveBeenCalledTimes(1);
      expect(mkdirSync).toHaveBeenCalledWith("prisma/backups/2024/03/05");
    });
  });

  describe("hourly", () => {
    beforeEach(() => {
      (isDir as jest.Mock).mockReturnValue(true);
    });

    it("creates a backup when there is no prior backup to compare against", async () => {
      (readdirSync as jest.Mock).mockReturnValueOnce([]);
      (existsSync as jest.Mock).mockReturnValue(true);

      await service.hourly();

      expect(copyFileSync).toHaveBeenCalledWith(
        "prisma/rl.db",
        "prisma/backups/most_recent_backup.db",
      );
      expect(copyFileSync).toHaveBeenCalledTimes(2);
    });

    it("skips the backup when the current db matches the most recent backup's hash", async () => {
      (readdirSync as jest.Mock)
        .mockReturnValueOnce(["2024"])
        .mockReturnValueOnce(["03"])
        .mockReturnValueOnce(["05"])
        .mockReturnValueOnce(["12-30.db"]);
      (readFileSync as jest.Mock).mockReturnValue("same-content");

      await service.hourly();

      expect(readFileSync).toHaveBeenNthCalledWith(1, "prisma/rl.db");
      expect(readFileSync).toHaveBeenNthCalledWith(
        2,
        "prisma/backups/2024/03/05/12-30.db",
      );
      expect(copyFileSync).not.toHaveBeenCalled();
    });

    it("creates a backup when the current db differs from the most recent backup's hash", async () => {
      (readdirSync as jest.Mock)
        .mockReturnValueOnce(["2024"])
        .mockReturnValueOnce(["03"])
        .mockReturnValueOnce(["05"])
        .mockReturnValueOnce(["12-30.db"]);
      (readFileSync as jest.Mock)
        .mockReturnValueOnce("current-content")
        .mockReturnValueOnce("old-content");
      (existsSync as jest.Mock).mockReturnValue(true);

      await service.hourly();

      expect(copyFileSync).toHaveBeenCalledTimes(2);
    });
  });
});
