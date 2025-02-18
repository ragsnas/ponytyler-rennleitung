import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { UserService } from "../prisma-api/user.service";
import { Prisma, User } from "@prisma/client";

@Controller("api/user")
export class UserController {
  constructor(
    private readonly userService: UserService
  ) {}

  @Get("")
  async getUsers(): Promise<User[]> {
    return this.userService.users({orderBy: {name: "asc"}});
  }

  @Get(":id")
  async getPostById(@Param("id") id: string): Promise<User> {
    return this.userService.user({ id: Number(id) });
  }

  @Post("")
  async createUser(@Body() userData: Prisma.UserCreateInput): Promise<User> {
    return this.userService.createUser({
      ...userData
    });
  }

  @Patch(":id")
  async updateUser(
    @Param("id") id: string,
    @Body() userData: Prisma.UserUpdateInput,
  ): Promise<User> {
    return this.userService.updateUser({
      data: userData,
      where: { id: Number(id) },
    });
  }

  @Delete(":id")
  async deleteUserById(@Param("id") id: string): Promise<any> {
    return this.userService.deleteUser({id: Number(id)});
  }
}
