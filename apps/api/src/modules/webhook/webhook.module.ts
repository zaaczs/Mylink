import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AutomationModule } from "../automation/automation.module";
import { InstagramModule } from "../instagram/instagram.module";
import { LogsModule } from "../logs/logs.module";
import { QueueService } from "./queue.service";
import { WebhookController } from "./webhook.controller";
import { WebhookService } from "./webhook.service";

@Module({
  imports: [AuthModule, AutomationModule, InstagramModule, LogsModule],
  controllers: [WebhookController],
  providers: [WebhookService, QueueService]
})
export class WebhookModule {}
