import { Test, TestingModule } from "@nestjs/testing";
import { UserController } from "./user.controller";
import { UserService } from "../prisma-api/user.service";

describe("UserController", () => {
  let controller: UserController;
  let usersMock: jest.Mock;
  let userMock: jest.Mock;
  let createUserMock: jest.Mock;
  let updateUserMock: jest.Mock;
  let deleteUserMock: jest.Mock;

  beforeEach(async () => {
    usersMock = jest.fn();
    userMock = jest.fn();
    createUserMock = jest.fn();
    updateUserMock = jest.fn();
    deleteUserMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            users: usersMock,
            user: userMock,
            createUser: createUserMock,
            updateUser: updateUserMock,
            deleteUser: deleteUserMock,
          },
        },
      ],
    }).compile();

    controller = module.get(UserController);
  });

  it("fetches all users ordered by name", async () => {
    await controller.getUsers();

    expect(usersMock).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
  });

  it("delegates fetching a single user to the UserService, converting the id to a number", async () => {
    await controller.getPostById("5");

    expect(userMock).toHaveBeenCalledWith({ id: 5 });
  });

  it("delegates creation to the UserService", async () => {
    const data = { name: "Alice" };

    await controller.createUser(data as any);

    expect(createUserMock).toHaveBeenCalledWith({ ...data });
  });

  it("delegates updating a user to the UserService, converting the id to a number", async () => {
    const data = { name: "Bob" };

    await controller.updateUser("5", data as any);

    expect(updateUserMock).toHaveBeenCalledWith({
      data,
      where: { id: 5 },
    });
  });

  it("delegates deleting a user to the UserService, converting the id to a number", async () => {
    await controller.deleteUserById("5");

    expect(deleteUserMock).toHaveBeenCalledWith({ id: 5 });
  });
});
