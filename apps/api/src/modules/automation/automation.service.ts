import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CreateTriggerAutomationDto } from "./create-trigger-automation.dto";
import { UpdateAutomationDmDto } from "./update-automation-dm.dto";
import { serializePublicReplies } from "./public-reply.util";

/** Valor de `Automation.postId` quando a regra vale para qualquer mídia da conta. */
export const AUTOMATION_ALL_POSTS_POST_ID = "*";

const DM_TEMPLATE_EMPTY = JSON.stringify({ v: 2, body: "", linkButtonTitle: "Abrir link" });

@Injectable()
export class AutomationService {
  constructor(private readonly prisma: PrismaService) {}

  async createTrigger(userId: string, dto: CreateTriggerAutomationDto) {
    const keywords = dto.keywords.map((k) => k.trim().toLowerCase()).filter((k) => k.length > 0);
    if (!keywords.length) {
      throw new BadRequestException("Informe ao menos uma palavra-chave.");
    }

    const replyComment = serializePublicReplies(dto.replyToCommentEnabled, dto.commentReplyVariants);

    return this.prisma.automation.create({
      data: {
        userId,
        postId: dto.postId,
        keywords: keywords.join(","),
        replyComment,
        dmMessage: DM_TEMPLATE_EMPTY,
        link: "",
        isActive: false
      }
    });
  }

  async findByIdForUser(userId: string, id: string) {
    const row = await this.prisma.automation.findFirst({ where: { id, userId } });
    if (!row) throw new NotFoundException("Automação não encontrada.");
    return row;
  }

  async updateDm(userId: string, id: string, dto: UpdateAutomationDmDto) {
    await this.findByIdForUser(userId, id);

    await this.prisma.automation.updateMany({
      where: { userId, id: { not: id }, isActive: true },
      data: { isActive: false }
    });

    const dmMessage = JSON.stringify({
      v: 2,
      body: dto.body,
      linkButtonTitle: (dto.linkButtonTitle?.trim() || "Abrir link").slice(0, 20),
      ...(dto.linkCardTitle?.trim() ? { linkCardTitle: dto.linkCardTitle.trim().slice(0, 80) } : {})
    });

    return this.prisma.automation.update({
      where: { id },
      data: {
        dmMessage,
        link: dto.link,
        isActive: true
      }
    });
  }

  async list(userId: string) {
    return this.prisma.automation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Automação ativa para o comentário: post específico ou sentinel {@link AUTOMATION_ALL_POSTS_POST_ID}.
   * Com `webhookAccountId`, o escopo é o usuário dono da integração Instagram (evita colisão entre contas).
   */
  async findActiveForComment(mediaId: string, webhookAccountId?: string | null) {
    if (webhookAccountId) {
      const account = await this.prisma.instagramAccount.findFirst({
        where: { OR: [{ igUserId: webhookAccountId }, { pageId: webhookAccountId }] },
        select: { userId: true }
      });
      if (account) {
        return this.prisma.automation.findFirst({
          where: {
            userId: account.userId,
            isActive: true,
            OR: [{ postId: mediaId }, { postId: AUTOMATION_ALL_POSTS_POST_ID }]
          },
          orderBy: { updatedAt: "desc" }
        });
      }
    }

    return this.prisma.automation.findFirst({
      where: { postId: mediaId, isActive: true },
      orderBy: { updatedAt: "desc" }
    });
  }

  async incrementSentCount(automationId: string) {
    await this.prisma.automation.update({
      where: { id: automationId },
      data: { sentCount: { increment: 1 } }
    });
  }
}
