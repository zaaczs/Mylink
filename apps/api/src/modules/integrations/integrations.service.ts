import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { SaveMetaManualDto } from "./dto/save-meta-manual.dto";

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async saveManual(userId: string, dto: SaveMetaManualDto) {
    const existing = await this.prisma.instagramAccount.findFirst({ where: { userId } });
    if (existing) {
      return this.prisma.instagramAccount.update({
        where: { id: existing.id },
        data: {
          accessToken: dto.accessToken,
          pageId: dto.pageId,
          igUserId: dto.igUserId
        }
      });
    }
    return this.prisma.instagramAccount.create({
      data: {
        userId,
        accessToken: dto.accessToken,
        pageId: dto.pageId,
        igUserId: dto.igUserId
      }
    });
  }

  async getStatus(userId: string) {
    const acc = await this.prisma.instagramAccount.findFirst({ where: { userId } });
    if (!acc) return { connected: false as const };
    const tail = acc.accessToken.slice(-6);
    return {
      connected: true as const,
      pageId: acc.pageId,
      igUserId: acc.igUserId,
      tokenPreview: `****${tail}`
    };
  }
}
