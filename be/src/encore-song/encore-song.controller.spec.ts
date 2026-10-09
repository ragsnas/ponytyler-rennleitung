import { Test, TestingModule } from "@nestjs/testing";
import { EncoreSongController } from "./encore-song.controller";
import { EncoreSongService } from "../prisma-api/encore-song.service";

describe("EncoreSongController", () => {
  let controller: EncoreSongController;
  let createEncoreSongMock: jest.Mock;
  let encoreSongsForShowMock: jest.Mock;

  beforeEach(async () => {
    createEncoreSongMock = jest.fn();
    encoreSongsForShowMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EncoreSongController],
      providers: [
        {
          provide: EncoreSongService,
          useValue: {
            createEncoreSong: createEncoreSongMock,
            encoreSongsForShow: encoreSongsForShowMock,
          },
        },
      ],
    }).compile();

    controller = module.get(EncoreSongController);
  });

  it("delegates creation to the EncoreSongService", () => {
    const data = { showId: 5, songId: 10 };

    controller.create(data);

    expect(createEncoreSongMock).toHaveBeenCalledWith(data);
  });

  it("delegates fetching a show's encore songs to the EncoreSongService, converting the showId to a number", () => {
    controller.findForShow("5");

    expect(encoreSongsForShowMock).toHaveBeenCalledWith(5);
  });
});
