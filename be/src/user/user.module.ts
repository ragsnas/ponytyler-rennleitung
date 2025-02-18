import { Module } from "@nestjs/common";
import { PrismaApiModule } from "src/prisma-api/prisma-api.module";
import { UserController } from "./user.controller";
import { UserService } from "../prisma-api/user.service";

@Module({
  imports: [PrismaApiModule],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
