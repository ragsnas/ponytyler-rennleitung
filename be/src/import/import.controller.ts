import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ImportService } from "./import.service";
import { DatabaseImportSummary } from "./import.types";

@Controller("api/import")
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post("database")
  @UseInterceptors(FileInterceptor("file"))
  async importDatabase(@UploadedFile() file: Express.Multer.File): Promise<DatabaseImportSummary> {
    if (!file) {
      throw new BadRequestException('No file uploaded. Send the export JSON as multipart form field "file".');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(file.buffer.toString("utf-8"));
    } catch (e) {
      throw new BadRequestException("Uploaded file is not valid JSON.");
    }

    return this.importService.importDatabase(parsed);
  }
}
