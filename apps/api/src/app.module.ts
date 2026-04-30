import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { PrismaService } from "./common/prisma.service";
import { AuthModule } from "./modules/auth/auth.module";
import { InstagramModule } from "./modules/instagram/instagram.module";
import { AutomationModule } from "./modules/automation/automation.module";
import { WebhookModule } from "./modules/webhook/webhook.module";
import { LogsModule } from "./modules/logs/logs.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    IntegrationsModule,
    InstagramModule,
    AutomationModule,
    WebhookModule,
    LogsModule
  ],
  controllers: [AppController],
  providers: [PrismaService]
})
export class AppModule {}
