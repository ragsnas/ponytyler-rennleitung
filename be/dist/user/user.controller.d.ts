import { UserService } from "../prisma-api/user.service";
import { Prisma, User } from "@prisma/client";
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getUsers(): Promise<User[]>;
    getPostById(id: string): Promise<User>;
    createUser(userData: Prisma.UserCreateInput): Promise<User>;
    updateUser(id: string, userData: Prisma.UserUpdateInput): Promise<User>;
    deleteUserById(id: string): Promise<any>;
}
