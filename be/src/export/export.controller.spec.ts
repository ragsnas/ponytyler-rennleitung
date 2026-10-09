import { Test, TestingModule } from "@nestjs/testing";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";
import { DATABASE_EXPORT_FORMAT_VERSION } from "./export.types";

describe("ExportController", () => {
  let controller: ExportController;
  let exportDatabaseMock: jest.Mock;

  beforeEach(async () => {
    exportDatabaseMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        {
          provide: ExportService,
          useValue: { exportDatabase: exportDatabaseMock },
        },
      ],
    }).compile();

    controller = module.get(ExportController);
  });

  it("delegates database export to the ExportService and returns its result", async () => {
    const result = {
      formatVersion: DATABASE_EXPORT_FORMAT_VERSION,
      exportedAt: "2026-01-01T00:00:00.000Z",
      shows: [],
      shifts: [],
      shiftRoles: [],
      songs: [],
      races: [],
      users: [],
    };
    exportDatabaseMock.mockResolvedValue(result);

    await expect(controller.exportDatabase()).resolves.toBe(result);
    expect(exportDatabaseMock).toHaveBeenCalledWith();
  });
});
