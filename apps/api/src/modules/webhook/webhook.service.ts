import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Job } from "bullmq";
import { AutomationService } from "../automation/automation.service";
import { buildDirectMessageText, parseDmPayloadV2 } from "../automation/dm-message.util";
import { pickPublicReply } from "../automation/public-reply.util";
import { InstagramService } from "../instagram/instagram.service";
import { LogsService } from "../logs/logs.service";
import { QueueService, type CommentJob } from "./queue.service";

@Injectable()
export class WebhookService implements OnModuleInit {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly automationService: AutomationService,
    private readonly instagramService: InstagramService,
    private readonly logsService: LogsService
  ) {}

  onModuleInit() {
    this.queueService.registerProcessor(async (job) => {
      await this.processComment(job);
    });
  }

  async handleIncoming(payload: Record<string, any>) {
    const entries = payload.entry || [];

    for (const entry of entries) {
      const webhookAccountId = typeof entry.id === "string" ? entry.id : undefined;
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || {};
        const commentId = (value.comment_id ?? value.id) as string | undefined;
        if (!commentId || !value.text || !value.media?.id) continue;

        await this.queueService.enqueue({
          commentId,
          commentText: value.text,
          mediaId: value.media.id,
          webhookAccountId
        });
      }
    }
  }

  async sendDm(userId: string, commentId: string, message: string) {
    await this.instagramService.sendPrivateReply(userId, commentId, message);
  }

  private async processComment(job: Job<CommentJob>) {
    const { commentId, commentText, mediaId, webhookAccountId } = job.data;

    const automation = await this.automationService.findActiveForComment(mediaId, webhookAccountId);
    if (!automation) return;

    const keywords = automation.keywords
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const normalizedComment = commentText.toLowerCase();
    const matchedKeyword = keywords.find((keyword) => normalizedComment.includes(keyword));
    if (!matchedKeyword) return;

    try {
      const publicReply = pickPublicReply(automation.replyComment);
      const dmText = buildDirectMessageText(automation.dmMessage, automation.link);
      if (!publicReply && !dmText.trim()) {
        return;
      }

      if (publicReply) {
        await this.instagramService.replyComment(automation.userId, commentId, publicReply);
      }
      if (dmText.trim()) {
        const v2 = parseDmPayloadV2(automation.dmMessage);
        const link = automation.link.trim();
        if (v2 && link) {
          await this.instagramService.sendPrivateReplyWithLinkTemplate(automation.userId, commentId, {
            textFallback: dmText,
            link,
            body: v2.body,
            linkButtonTitle: v2.linkButtonTitle,
            linkCardTitle: v2.linkCardTitle
          });
        } else {
          await this.instagramService.sendPrivateReply(automation.userId, commentId, dmText);
        }
      }

      await this.automationService.incrementSentCount(automation.id);
      await this.logsService.add({
        userId: automation.userId,
        automationId: automation.id,
        commentId,
        commentText,
        actionStatus: "SUCCESS"
      });
    } catch (error) {
      this.logger.error("Erro ao executar automacao", error as Error);
      await this.logsService.add({
        userId: automation.userId,
        automationId: automation.id,
        commentId,
        commentText,
        actionStatus: "ERROR"
      });
    }
  }
}
