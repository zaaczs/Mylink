import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaService } from "../../common/prisma.service";
import { IntegrationsController } from "./integrations.controller";
import { IntegrationsService } from "./integrations.service";
import { MetaCallbackController } from "./meta-callback.controller";
import { MetaOAuthService } from "./meta-oauth.service";

@Module({
  imports: [AuthModule],
  controllers: [IntegrationsController, MetaCallbackController],
  providers: [IntegrationsService, MetaOAuthService, PrismaService]
})
export class IntegrationsModule {}
