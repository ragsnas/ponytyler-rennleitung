import { Test, TestingModule } from "@nestjs/testing";
import { ShiftsController } from "./shifts.controller";
import { ShiftsService } from "../prisma-api/shifts.service";

describe("ShiftsController", () => {
  let controller: ShiftsController;
  let shiftsForShowMock: jest.Mock;
  let createShiftMock: jest.Mock;

  beforeEach(async () => {
    shiftsForShowMock = jest.fn();
    createShiftMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftsController],
      providers: [
        {
          provide: ShiftsService,
          useValue: {
            shiftsForShow: shiftsForShowMock,
            createShift: createShiftMock,
          },
        },
      ],
    }).compile();

    controller = module.get(ShiftsController);
  });

  it("delegates fetching a show's shifts to the ShiftsService, passing the showId through unchanged", () => {
    controller.findShiftsForShow("5");

    expect(shiftsForShowMock).toHaveBeenCalledWith("5");
  });

  it("delegates creation to the ShiftsService", () => {
    const data = { showId: 5, roleId: 1, start: new Date(), end: new Date() };

    controller.create(data as any);

    expect(createShiftMock).toHaveBeenCalledWith(data);
  });
});
