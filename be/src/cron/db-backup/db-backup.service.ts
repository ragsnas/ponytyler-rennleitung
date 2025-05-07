import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "fs";
import { Md5 } from "ts-md5";
import { pad } from "../../utils/pad";
import { isDir } from "../../utils/isDir";
import { isNumber } from "@nestjs/common/utils/shared.utils";

@Injectable()
export class DbBackupService {
  private readonly logger = new Logger(DbBackupService.name);
  private prismaFolder = "prisma";
  private backupFolder = "prisma/backups";

  constructor() {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async hourly() {
    if(!isDir(`prisma/backups`) && isDir(`/home/ponytyler/ponytyler-rennleitung/be/prisma/backups`)) {
      this.prismaFolder = `/home/ponytyler/ponytyler-rennleitung/be/prisma`
      this.backupFolder = `/home/ponytyler/rl-db-backups`
    }
    this.logger.log("Running DB Backup Cron-Job.");
    if(!this.isBackupNecessary()) {
      this.logger.log('No changes since last Backup.');
    } else {
      this.createBackup();
    }
  }

  private createBackup() {
    const backupDate = new Date();
    const backupFileName = `${pad(backupDate.getHours())}-${pad(Math.round(backupDate.getMinutes() / 15) * 15)}.db`;
    const destinationPath = this.getDestinationPath(backupDate);

    // make actual backup
    this.logger.log(`Copying prisma/rl.db to ${destinationPath}/${backupFileName}`);
    copyFileSync(`${this.prismaFolder}/rl.db`, `${destinationPath}/${backupFileName}`);
    copyFileSync(`${this.prismaFolder}/rl.db`, `${this.backupFolder}/most_recent_backup.db`);
  }

  private getDestinationPath(backupDate: Date) {
    const backupFilePathYear = `${this.backupFolder}/${pad(backupDate.getFullYear())}`;
    this.createDirIfNotExists(backupFilePathYear);
    const backupFilePathMonth = `${backupFilePathYear}/${pad(backupDate.getMonth())}`;
    this.createDirIfNotExists(backupFilePathMonth);
    const backupFilePathDay = `${backupFilePathMonth}/${pad(backupDate.getDate())}`;
    this.createDirIfNotExists(backupFilePathDay);
    const destinationPath = backupFilePathDay;
    return destinationPath;
  }

  private createDirIfNotExists(backupFilePathDay: string) {
    if (!existsSync(backupFilePathDay)) {
      this.logger.debug(`creating path ${backupFilePathDay}`);
      mkdirSync(backupFilePathDay);
    }
  }

  private isBackupNecessary(): boolean {
    const lastBackupFileFilename = this.getLastBackupFileFilename();

    if(lastBackupFileFilename) {
      const currentDbFileHash = Md5.hashStr(readFileSync(`${this.prismaFolder}/rl.db`).toString());
      const lastBackupFileFilenameHash = Md5.hashStr(readFileSync(lastBackupFileFilename).toString());
      if(currentDbFileHash === lastBackupFileFilenameHash) {
        return false;
      }
    }

    return true;

  }


  private getLastBackupFileFilename() {
    const directory = `${this.backupFolder}`;
    const backupDirectoryContent = readdirSync(directory)
      .sort()
      .reverse()
      .filter(name => !!name)
      .filter(name => isNumber(Number(name)))
      .filter(name => isDir(`${directory}/${name}`));

    if(backupDirectoryContent) {
      const yearFolder = backupDirectoryContent[0];
      const backupDirectoryYearContent = readdirSync(`${directory}/${yearFolder}`)
        .sort()
        .reverse()
        .filter(name => isNumber(Number(name)))
        .filter(name => isDir(`${directory}/${yearFolder}/` + name));

      if(backupDirectoryYearContent && backupDirectoryYearContent.length > 0) {
        const monthFolder = backupDirectoryYearContent[0];
        const backupDirectoryMonthContent = readdirSync(`${directory}/${yearFolder}/${monthFolder}`)
          .sort()
          .reverse()
          .filter(name => isNumber(Number(name)))
          .filter(name => isDir(`${directory}/${yearFolder}//${monthFolder}/` + name));

        if(backupDirectoryMonthContent && backupDirectoryMonthContent.length > 0) {
          const filePatternRegex = /^(\d){2}-(\d){2}\.db$/;
          const dayFolder = backupDirectoryMonthContent[0];
          const backupDirectoryDayContent = readdirSync(`${directory}/${yearFolder}/${monthFolder}/${dayFolder}`)
            .filter(name => filePatternRegex.test(name))
            .sort()
            .reverse()

          if(backupDirectoryDayContent && backupDirectoryDayContent.length > 0) {
            const newestFile = backupDirectoryDayContent[0];
            return `${directory}/${yearFolder}/${monthFolder}/${dayFolder}/${newestFile}`;
          }
        }
      }
    }

    return undefined;
  }
}
