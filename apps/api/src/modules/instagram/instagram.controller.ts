import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../common/decorators/current-user.decorator";
import { InstagramService } from "./instagram.service";

@Controller("instagram")
@UseGuards(AuthGuard("jwt"))
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get("posts")
  getPosts(@CurrentUser() user: AuthUser) {
    return this.instagramService.getPosts(user.userId);
  }
}
