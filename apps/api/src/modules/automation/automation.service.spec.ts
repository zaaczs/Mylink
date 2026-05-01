import { describe, expect, it, vi } from "vitest";
import { AUTOMATION_ALL_POSTS_POST_ID, AutomationService } from "./automation.service";

describe("AutomationService.findActiveForComment", () => {
  it("considera automacao global quando nao identifica account do webhook", async () => {
    const prisma = {
      instagramAccount: {
        findFirst: vi.fn().mockResolvedValue(null)
      },
      automation: {
        findFirst: vi.fn().mockResolvedValue({ id: "auto-1" })
      }
    };
    const service = new AutomationService(prisma as never);

    await service.findActiveForComment("media-123", "unknown-account");

    expect(prisma.automation.findFirst).toHaveBeenCalledWith({
      where: {
        isActive: true,
        OR: [{ postId: "media-123" }, { postId: AUTOMATION_ALL_POSTS_POST_ID }]
      },
      orderBy: { updatedAt: "desc" }
    });
  });

  it("prioriza escopo do usuario da conta quando accountId bate", async () => {
    const prisma = {
      instagramAccount: {
        findFirst: vi.fn().mockResolvedValue({ userId: "user-1" })
      },
      automation: {
        findFirst: vi.fn().mockResolvedValue({ id: "auto-2" })
      }
    };
    const service = new AutomationService(prisma as never);

    await service.findActiveForComment("media-123", "acct-1");

    expect(prisma.automation.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        isActive: true,
        OR: [{ postId: "media-123" }, { postId: AUTOMATION_ALL_POSTS_POST_ID }]
      },
      orderBy: { updatedAt: "desc" }
    });
  });
});
