import { Test, TestingModule } from "@nestjs/testing";
import { ShiftsService } from "./shifts.service";
import { PrismaService } from "./prisma.service";

describe("ShiftsService", () => {
  let service: ShiftsService;
  let findUniqueMock: jest.Mock;
  let findManyMock: jest.Mock;
  let createMock: jest.Mock;
  let updateMock: jest.Mock;
  let deleteMock: jest.Mock;

  beforeEach(async () => {
    findUniqueMock = jest.fn();
    findManyMock = jest.fn();
    createMock = jest.fn();
    updateMock = jest.fn();
    deleteMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        {
          provide: PrismaService,
          useValue: {
            shift: {
              findUnique: findUniqueMock,
              findMany: findManyMock,
              create: createMock,
              update: updateMock,
              delete: deleteMock,
            },
          },
        },
      ],
    }).compile();

    service = module.get(ShiftsService);
  });

  describe("shift", () => {
    it("finds a single shift by its unique input", async () => {
      const shift = { id: 1 };
      findUniqueMock.mockResolvedValue(shift);

      await expect(service.shift({ id: 1 })).resolves.toBe(shift);
      expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe("shifts", () => {
    it("passes skip, take, cursor, where and orderBy through to findMany", async () => {
      const shifts = [{ id: 1 }, { id: 2 }];
      findManyMock.mockResolvedValue(shifts);
      const params = {
        skip: 1,
        take: 2,
        cursor: { id: 3 },
        where: { showId: 5 },
        orderBy: { id: "asc" as const },
      };

      await expect(service.shifts(params)).resolves.toBe(shifts);
      expect(findManyMock).toHaveBeenCalledWith(params);
    });
  });

  describe("createShift", () => {
    it("creates a shift with the given data", async () => {
      const data = { showId: 5, from: new Date(), to: new Date() } as any;
      const created = { id: 1, ...data };
      createMock.mockResolvedValue(created);

      await expect(service.createShift(data)).resolves.toBe(created);
      expect(createMock).toHaveBeenCalledWith({ data });
    });
  });

  describe("updateShift", () => {
    it("updates a shift with the given where and data", async () => {
      const where = { id: 1 };
      const data = { order: 2 };
      const updated = { id: 1, order: 2 };
      updateMock.mockResolvedValue(updated);

      await expect(service.updateShift({ where, data })).resolves.toBe(
        updated,
      );
      expect(updateMock).toHaveBeenCalledWith({ data, where });
    });
  });

  describe("deleteShift", () => {
    it("deletes a shift by its unique where", async () => {
      const where = { id: 1 };
      const deleted = { id: 1 };
      deleteMock.mockResolvedValue(deleted);

      await expect(service.deleteShift(where)).resolves.toBe(deleted);
      expect(deleteMock).toHaveBeenCalledWith({ where });
    });
  });

  describe("shiftsForShow", () => {
    it("finds shifts for a show, converting the showId string to a number", async () => {
      const shifts = [{ id: 1, showId: 5 }];
      findManyMock.mockResolvedValue(shifts);

      await expect(service.shiftsForShow("5")).resolves.toBe(shifts);
      expect(findManyMock).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        cursor: undefined,
        where: { showId: 5 },
        orderBy: undefined,
      });
    });
  });
});
