import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../common/decorators/current-user.decorator";
import { CreateTriggerAutomationDto } from "./create-trigger-automation.dto";
import { UpdateTriggerAutomationDto } from "./update-trigger-automation.dto";
import { UpdateAutomationDmDto } from "./update-automation-dm.dto";
import { AutomationService } from "./automation.service";

@Controller("automation")
@UseGuards(AuthGuard("jwt"))
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post()
  createTrigger(@CurrentUser() user: AuthUser, @Body() dto: CreateTriggerAutomationDto) {
    return this.automationService.createTrigger(user.userId, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.automationService.list(user.userId);
  }

  @Get(":id")
  getOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.automationService.findByIdForUser(user.userId, id);
  }

  @Patch(":id")
  updateDm(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateAutomationDmDto) {
    return this.automationService.updateDm(user.userId, id, dto);
  }

  @Patch(":id/trigger")
  updateTrigger(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateTriggerAutomationDto) {
    return this.automationService.updateTrigger(user.userId, id, dto);
  }
}
