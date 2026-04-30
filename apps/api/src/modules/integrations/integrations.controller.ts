import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../common/decorators/current-user.decorator";
import { SaveMetaManualDto } from "./dto/save-meta-manual.dto";
import { IntegrationsService } from "./integrations.service";
import { MetaOAuthService } from "./meta-oauth.service";

@Controller("integrations/meta")
@UseGuards(AuthGuard("jwt"))
export class IntegrationsController {
  constructor(
    private readonly integrations: IntegrationsService,
    private readonly metaOAuth: MetaOAuthService
  ) {}

  @Get()
  status(@CurrentUser() user: AuthUser) {
    return this.integrations.getStatus(user.userId);
  }

  @Post("manual")
  saveManual(@CurrentUser() user: AuthUser, @Body() dto: SaveMetaManualDto) {
    return this.integrations.saveManual(user.userId, dto);
  }

  @Post("oauth/start")
  startOauth(@CurrentUser() user: AuthUser) {
    return this.metaOAuth.startOAuth(user.userId);
  }
}
