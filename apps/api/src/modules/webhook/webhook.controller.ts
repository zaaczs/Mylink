import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../common/decorators/current-user.decorator";
import { SendDmDto } from "./dto/send-dm.dto";
import { WebhookService } from "./webhook.service";

@Controller()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get("webhook/meta")
  verify(
    @Query("hub.mode") mode?: string,
    @Query("hub.verify_token") token?: string,
    @Query("hub.challenge") challenge?: string
  ) {
    if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN && challenge) {
      return challenge;
    }
    return "invalid verification";
  }

  @Post("webhook/meta")
  async receive(@Body() payload: Record<string, unknown>) {
    await this.webhookService.handleIncoming(payload);
    return { received: true };
  }

  @Post("send-dm")
  @UseGuards(AuthGuard("jwt"))
  async sendDm(@CurrentUser() user: AuthUser, @Body() body: SendDmDto) {
    await this.webhookService.sendDm(user.userId, body.commentId, body.message);
    return { sent: true };
  }
}
