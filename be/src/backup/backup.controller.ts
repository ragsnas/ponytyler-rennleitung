import {
  Controller,
  Get,
  NotFoundException,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { copyFileSync, createReadStream, existsSync } from "fs";
import { join } from "path";
import { FileInterceptor } from "@nestjs/platform-express";
import { DbBackupService } from "../cron/db-backup/db-backup.service";
import * as process from "node:process";
import { isDir } from "../utils/isDir";

@Controller("api/backup")
export class BackupController {

  private prismaFolder = "prisma";

  constructor(private dbBackupService: DbBackupService) {
    if(!isDir(`prisma/backups`) && isDir(`/home/ponytyler/ponytyler-rennleitung/be/prisma/backups`)) {
      this.prismaFolder = `/home/ponytyler/ponytyler-rennleitung/be/prisma`
    }
  }

  @Get("download")
  downloadBackup(): StreamableFile {
    const file = createReadStream(`${this.prismaFolder}/rl.db`);
    return new StreamableFile(file);
  }

  @Get("download-possible")
  async downloadBackupPossible() {
    const fileExists = existsSync(`${this.prismaFolder}/rl.db`);
    if(!fileExists) {
      throw new NotFoundException(`Database for Backup not found.`);
    }
    return true;
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  uploadBackup(@UploadedFile() file: Express.Multer.File) {
    const backupFileName = this.dbBackupService.getDestinationPath(new Date());
    console.log(`Creating Backup before overwriting Database. Backup Filename:`, backupFileName);
    copyFileSync("prisma/rl.db", backupFileName);
    copyFileSync(file.path, "prisma/rl.db");
  }
}
