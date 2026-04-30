import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AuthModule } from "../auth/auth.module";
import { AutomationController } from "./automation.controller";
import { AutomationService } from "./automation.service";

@Module({
  imports: [AuthModule],
  controllers: [AutomationController],
  providers: [AutomationService, PrismaService],
  exports: [AutomationService]
})
export class AutomationModule {}
