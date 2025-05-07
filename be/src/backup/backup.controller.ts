import { Controller, Get, StreamableFile } from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";

@Controller("api/backup")
export class BackupController {

  @Get("download")
  downloadBackup(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'prisma/rl.db'));
    return new StreamableFile(file);
  }

}
