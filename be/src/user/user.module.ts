import { Module } from "@nestjs/common";
import { PrismaApiModule } from "src/prisma-api/prisma-api.module";
import { UserController } from "./user.controller";

@Module({
  imports: [PrismaApiModule],
  controllers: [UserController],
})
export class UserModule {}
