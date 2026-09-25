import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ShowState } from "@prisma/client";
import { ShowController } from "./show.controller";
import { ShowService } from "../prisma-api/show.service";
import { RaceService } from "../prisma-api/race.service";

describe("ShowController", () => {
  let controller: ShowController;
  let showsMock: jest.Mock;
  let showsOrderedByActiveAndDateMock: jest.Mock;
  let showMock: jest.Mock;
  let createShowMock: jest.Mock;
  let updateShowMock: jest.Mock;
  let deleteShowWithRacesAndShiftsMock: jest.Mock;
  let repairOrderMock: jest.Mock;

  beforeEach(async () => {
    showsMock = jest.fn();
    showsOrderedByActiveAndDateMock = jest.fn();
    showMock = jest.fn();
    createShowMock = jest.fn();
    updateShowMock = jest.fn();
    deleteShowWithRacesAndShiftsMock = jest.fn();
    repairOrderMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShowController],
      providers: [
        {
          provide: ShowService,
          useValue: {
            shows: showsMock,
            showsOrderedByActiveAndDate: showsOrderedByActiveAndDateMock,
            show: showMock,
            createShow: createShowMock,
            updateShow: updateShowMock,
            deleteShowWithRacesAndShifts: deleteShowWithRacesAndShiftsMock,
          },
        },
        {
          provide: RaceService,
          useValue: { repairOrder: repairOrderMock },
        },
      ],
    }).compile();

    controller = module.get(ShowController);
  });

  it("gets shows ordered by date descending", async () => {
    showsMock.mockResolvedValue([]);

    await controller.getShows();

    expect(showsMock).toHaveBeenCalledWith({
      orderBy: { date: { sort: "desc" } },
    });
  });

  it("delegates fetching all shows ordered by active and date to the ShowService", async () => {
    showsOrderedByActiveAndDateMock.mockResolvedValue([]);

    await controller.getAllShows();

    expect(showsOrderedByActiveAndDateMock).toHaveBeenCalledWith();
  });

  describe("getCurrentShow", () => {
    it("returns the last active show when active shows exist", async () => {
      const shows = [{ id: 1 }, { id: 2 }];
      showsMock.mockResolvedValue(shows);

      const result = await controller.getCurrentShow();

      expect(result).toEqual({ id: 2 });
      expect(showsMock).toHaveBeenCalledWith({
        orderBy: { date: { sort: "desc" } },
        where: { active: true },
      });
    });

    it("throws NotFoundException when there is no active show", async () => {
      showsMock.mockResolvedValue([]);

      await expect(controller.getCurrentShow()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  it("gets current shows", async () => {
    showsMock.mockResolvedValue([]);

    await controller.getCurrentShows();

    expect(showsMock).toHaveBeenCalledWith({
      orderBy: { date: { sort: "desc" } },
      where: { active: true },
    });
  });

  it("gets old shows", async () => {
    showsMock.mockResolvedValue([]);

    await controller.getOldShows();

    expect(showsMock).toHaveBeenCalledWith({
      orderBy: { date: { sort: "desc" } },
      where: { active: false },
    });
  });

  it("gets a show by id", async () => {
    showMock.mockResolvedValue({ id: 4 });

    await controller.getPostById("4");

    expect(showMock).toHaveBeenCalledWith({ id: 4 });
  });

  describe("createShow", () => {
    it("defaults the show state to BEFORE_SHOW and preserves a given date", async () => {
      const date = new Date("2026-01-01T00:00:00.000Z");
      createShowMock.mockResolvedValue({});

      await controller.createShow({ name: "Show 1", date } as any);

      expect(createShowMock).toHaveBeenCalledWith({
        name: "Show 1",
        date,
        showState: ShowState.BEFORE_SHOW,
      });
    });

    it("defaults the date to a new Date when none is given", async () => {
      createShowMock.mockResolvedValue({});

      await controller.createShow({ name: "Show 1" } as any);

      const callArgs = createShowMock.mock.calls[0][0];
      expect(callArgs.date).toBeInstanceOf(Date);
      expect(callArgs.showState).toBe(ShowState.BEFORE_SHOW);
    });
  });

  it("delegates repairing races for a show to the RaceService", () => {
    controller.repairRacesFor("5");

    expect(repairOrderMock).toHaveBeenCalledWith("5");
  });

  it("updates a show", async () => {
    const showData = { name: "Updated" };
    updateShowMock.mockResolvedValue({});

    await controller.updateShow("5", showData as any);

    expect(updateShowMock).toHaveBeenCalledWith({
      data: showData,
      where: { id: 5 },
    });
  });

  it("delegates deleting a show to the ShowService", async () => {
    deleteShowWithRacesAndShiftsMock.mockResolvedValue({});

    await controller.deleteShowById("5");

    expect(deleteShowWithRacesAndShiftsMock).toHaveBeenCalledWith("5");
  });
});
