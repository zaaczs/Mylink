import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AuthModule } from "../auth/auth.module";
import { InstagramController } from "./instagram.controller";
import { InstagramService } from "./instagram.service";

@Module({
  imports: [AuthModule],
  controllers: [InstagramController],
  providers: [InstagramService, PrismaService],
  exports: [InstagramService]
})
export class InstagramModule {}
