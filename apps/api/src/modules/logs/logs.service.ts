import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async add(input: {
    userId: string;
    automationId: string;
    commentId: string;
    commentText: string;
    actionStatus: string;
  }) {
    return this.prisma.automationLog.create({ data: input });
  }

  async list() {
    return this.prisma.automationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }
}
