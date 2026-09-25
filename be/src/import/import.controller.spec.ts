import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ImportController } from "./import.controller";
import { ImportService } from "./import.service";

describe("ImportController", () => {
  let controller: ImportController;
  let importDatabaseMock: jest.Mock;

  beforeEach(async () => {
    importDatabaseMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportController],
      providers: [
        {
          provide: ImportService,
          useValue: { importDatabase: importDatabaseMock },
        },
      ],
    }).compile();

    controller = module.get(ImportController);
  });

  it("throws a BadRequestException when no file is uploaded", async () => {
    await expect(
      controller.importDatabase(undefined as unknown as Express.Multer.File),
    ).rejects.toThrow(BadRequestException);

    expect(importDatabaseMock).not.toHaveBeenCalled();
  });

  it("throws a BadRequestException when the uploaded file is not valid JSON", async () => {
    const file = {
      buffer: Buffer.from("not json"),
    } as Express.Multer.File;

    await expect(controller.importDatabase(file)).rejects.toThrow(
      BadRequestException,
    );

    expect(importDatabaseMock).not.toHaveBeenCalled();
  });

  it("parses the uploaded JSON and delegates to the ImportService", async () => {
    const payload = { formatVersion: 1, shows: [] };
    const file = {
      buffer: Buffer.from(JSON.stringify(payload)),
    } as Express.Multer.File;
    const summary = { formatVersion: 1, importedAt: "now", imported: {} };
    importDatabaseMock.mockResolvedValue(summary);

    const result = await controller.importDatabase(file);

    expect(importDatabaseMock).toHaveBeenCalledWith(payload);
    expect(result).toBe(summary);
  });
});
