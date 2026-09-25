import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./user.service";
import { PrismaService } from "./prisma.service";

describe("UserService", () => {
  let service: UserService;
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
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
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

    service = module.get(UserService);
  });

  describe("user", () => {
    it("finds a single user by its unique input", async () => {
      const user = { id: 1 };
      findUniqueMock.mockResolvedValue(user);

      await expect(service.user({ id: 1 })).resolves.toBe(user);
      expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe("users", () => {
    it("passes skip, take, cursor, where and orderBy through to findMany", async () => {
      const users = [{ id: 1 }, { id: 2 }];
      findManyMock.mockResolvedValue(users);
      const params = {
        skip: 1,
        take: 2,
        cursor: { id: 3 },
        where: { name: { contains: "a" } },
        orderBy: { name: "asc" as const },
      };

      await expect(service.users(params)).resolves.toBe(users);
      expect(findManyMock).toHaveBeenCalledWith(params);
    });
  });

  describe("createUser", () => {
    it("creates a user with the given data", async () => {
      const data = { name: "User" } as any;
      const created = { id: 1, ...data };
      createMock.mockResolvedValue(created);

      await expect(service.createUser(data)).resolves.toBe(created);
      expect(createMock).toHaveBeenCalledWith({ data });
    });
  });

  describe("updateUser", () => {
    it("updates a user with the given where and data", async () => {
      const where = { id: 1 };
      const data = { name: "New Name" };
      const updated = { id: 1, name: "New Name" };
      updateMock.mockResolvedValue(updated);

      await expect(service.updateUser({ where, data })).resolves.toBe(
        updated,
      );
      expect(updateMock).toHaveBeenCalledWith({ data, where });
    });
  });

  describe("deleteUser", () => {
    it("deletes a user by its unique where", async () => {
      const where = { id: 1 };
      const deleted = { id: 1 };
      deleteMock.mockResolvedValue(deleted);

      await expect(service.deleteUser(where)).resolves.toBe(deleted);
      expect(deleteMock).toHaveBeenCalledWith({ where });
    });
  });
});
