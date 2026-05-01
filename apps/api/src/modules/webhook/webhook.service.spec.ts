import { describe, expect, it, vi } from "vitest";
import { WebhookService } from "./webhook.service";

describe("WebhookService.handleIncoming", () => {
  it("enfileira comentario valido do webhook Meta", async () => {
    const queueService = {
      registerProcessor: vi.fn(),
      enqueue: vi.fn().mockResolvedValue(undefined)
    };
    const automationService = {
      findActiveForComment: vi.fn(),
      incrementSentCount: vi.fn()
    };
    const instagramService = {
      replyComment: vi.fn(),
      sendPrivateReply: vi.fn(),
      sendPrivateReplyWithLinkTemplate: vi.fn()
    };
    const logsService = { add: vi.fn() };

    const service = new WebhookService(
      queueService as never,
      automationService as never,
      instagramService as never,
      logsService as never
    );

    await service.handleIncoming({
      entry: [
        {
          id: "17841400000000",
          changes: [
            {
              value: {
                comment_id: "17900000000000",
                text: "quero o link",
                media: { id: "18000000000000" }
              }
            }
          ]
        }
      ]
    });

    expect(queueService.enqueue).toHaveBeenCalledWith({
      commentId: "17900000000000",
      commentText: "quero o link",
      mediaId: "18000000000000",
      webhookAccountId: "17841400000000"
    });
  });

  it("ignora eventos sem media id ou texto", async () => {
    const queueService = {
      registerProcessor: vi.fn(),
      enqueue: vi.fn().mockResolvedValue(undefined)
    };
    const service = new WebhookService(
      queueService as never,
      {} as never,
      {} as never,
      {} as never
    );

    await service.handleIncoming({
      entry: [
        {
          id: "acc",
          changes: [{ value: { comment_id: "c-1", text: "", media: { id: "m-1" } } }, { value: { comment_id: "c-2" } }]
        }
      ]
    });

    expect(queueService.enqueue).not.toHaveBeenCalled();
  });
});
