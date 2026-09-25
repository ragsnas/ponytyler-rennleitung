import { NotFoundException, StreamableFile } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { copyFileSync, createReadStream, existsSync } from "fs";
import { BackupController } from "./backup.controller";
import { DbBackupService } from "../cron/db-backup/db-backup.service";
import { isDir } from "../utils/isDir";

jest.mock("fs");
jest.mock("../utils/isDir");

describe("BackupController", () => {
  let controller: BackupController;
  let getDestinationPathMock: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    (isDir as jest.Mock).mockReturnValue(false);
    getDestinationPathMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackupController],
      providers: [
        {
          provide: DbBackupService,
          useValue: { getDestinationPath: getDestinationPathMock },
        },
      ],
    }).compile();

    controller = module.get(BackupController);
  });

  describe("downloadBackup", () => {
    it("streams the local database file", () => {
      const fakeStream = {} as any;
      (createReadStream as jest.Mock).mockReturnValue(fakeStream);

      const result = controller.downloadBackup();

      expect(createReadStream).toHaveBeenCalledWith("prisma/rl.db");
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });

  describe("downloadBackupPossible", () => {
    it("resolves true when the database file exists", async () => {
      (existsSync as jest.Mock).mockReturnValue(true);

      await expect(controller.downloadBackupPossible()).resolves.toBe(true);
      expect(existsSync).toHaveBeenCalledWith("prisma/rl.db");
    });

    it("throws NotFoundException when the database file doesn't exist", async () => {
      (existsSync as jest.Mock).mockReturnValue(false);

      await expect(controller.downloadBackupPossible()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("uploadBackup", () => {
    it("backs up the current db before overwriting it with the uploaded file", () => {
      getDestinationPathMock.mockReturnValue("prisma/backups/2024/03/05");
      const file = { path: "/tmp/upload123" } as Express.Multer.File;

      controller.uploadBackup(file);

      expect(copyFileSync).toHaveBeenNthCalledWith(
        1,
        "prisma/rl.db",
        "prisma/backups/2024/03/05",
      );
      expect(copyFileSync).toHaveBeenNthCalledWith(
        2,
        "/tmp/upload123",
        "prisma/rl.db",
      );
    });
  });
});
