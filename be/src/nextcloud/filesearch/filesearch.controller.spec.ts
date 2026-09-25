import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { FilesearchController } from "./filesearch.controller";

describe("FilesearchController", () => {
  let controller: FilesearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesearchController],
      providers: [
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: HttpService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<FilesearchController>(FilesearchController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("getVideos currently returns nothing (unimplemented)", async () => {
    await expect(controller.getVideos()).resolves.toBeUndefined();
  });
});
