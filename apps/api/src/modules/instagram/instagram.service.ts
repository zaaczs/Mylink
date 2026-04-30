import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "../../common/prisma.service";

type MetaPost = {
  id: string;
  caption?: string;
  media_url?: string;
  media_type?: string;
};

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getCredentials(userId: string) {
    const acc = await this.prisma.instagramAccount.findFirst({ where: { userId } });
    if (!acc) return null;
    return { accessToken: acc.accessToken, igUserId: acc.igUserId };
  }

  async getPosts(userId: string) {
    const creds = await this.getCredentials(userId);
    if (creds?.accessToken && creds?.igUserId) {
      const url = `https://graph.facebook.com/v21.0/${creds.igUserId}/media`;
      const { data } = await axios.get<{ data: MetaPost[] }>(url, {
        params: {
          fields: "id,caption,media_url,media_type",
          access_token: creds.accessToken
        }
      });
      this.logger.log(`Posts carregados: ${data.data.length}`);
      return data.data;
    }

    const accessToken = process.env.META_ACCESS_TOKEN;
    const igUserId = process.env.IG_USER_ID;
    if (accessToken && igUserId) {
      const url = `https://graph.facebook.com/v21.0/${igUserId}/media`;
      const { data } = await axios.get<{ data: MetaPost[] }>(url, {
        params: {
          fields: "id,caption,media_url,media_type",
          access_token: accessToken
        }
      });
      return data.data;
    }

    return [
      {
        id: "mock_media_1",
        caption: "Comente LINK para receber no Direct (mock — configure Integrações Meta)",
        media_url: "",
        media_type: "IMAGE"
      }
    ];
  }

  async replyComment(userId: string, commentId: string, message: string) {
    const creds = await this.getCredentials(userId);
    const accessToken = creds?.accessToken || process.env.META_ACCESS_TOKEN;
    if (!accessToken) return;

    await axios.post(
      `https://graph.facebook.com/v21.0/${commentId}/replies`,
      { message },
      { params: { access_token: accessToken } }
    );
  }

  async sendPrivateReply(userId: string, commentId: string, message: string) {
    const creds = await this.getCredentials(userId);
    const accessToken = creds?.accessToken || process.env.META_ACCESS_TOKEN;
    if (!accessToken) return;

    await axios.post(
      `https://graph.facebook.com/v21.0/${commentId}/private_replies`,
      { message },
      { params: { access_token: accessToken } }
    );
  }

  /**
   * Tenta enviar template genérico (título + botão URL, estilo "Abrir link") via `/{ig-user-id}/messages`.
   * Se a Meta rejeitar (ex.: só `text` permitido para `comment_id`), envia `textFallback` em `private_replies`.
   */
  async sendPrivateReplyWithLinkTemplate(
    userId: string,
    commentId: string,
    input: {
      textFallback: string;
      link: string;
      body: string;
      linkButtonTitle?: string;
      linkCardTitle?: string;
    }
  ) {
    const creds = await this.getCredentials(userId);
    const accessToken = creds?.accessToken || process.env.META_ACCESS_TOKEN;
    const igUserId = creds?.igUserId || process.env.IG_USER_ID;
    if (!accessToken) return;

    const link = input.link.trim();
    if (!link) {
      await this.sendPrivateReply(userId, commentId, input.textFallback);
      return;
    }

    const bodyForCard = input.body.replace(/\{link\}/gi, "").trim();
    const buttonTitle = (input.linkButtonTitle?.trim() || "Abrir link").slice(0, 20);
    const cardTitleOpt = input.linkCardTitle?.trim();

    let title: string;
    let subtitle: string | undefined;
    if (cardTitleOpt) {
      title = cardTitleOpt.slice(0, 80);
      subtitle = bodyForCard ? bodyForCard.slice(0, 80) : undefined;
    } else {
      title = (bodyForCard.slice(0, 80) || " ").trim() || " ";
      subtitle = bodyForCard.length > 80 ? bodyForCard.slice(80, 160).slice(0, 80) : undefined;
    }

    const element: Record<string, unknown> = {
      title,
      buttons: [{ type: "web_url", url: link, title: buttonTitle }]
    };
    if (subtitle?.trim()) {
      element.subtitle = subtitle.trim().slice(0, 80);
    }

    if (!igUserId) {
      await this.sendPrivateReply(userId, commentId, input.textFallback);
      return;
    }

    try {
      await axios.post(
        `https://graph.facebook.com/v21.0/${igUserId}/messages`,
        {
          recipient: { comment_id: commentId },
          message: {
            attachment: {
              type: "template",
              payload: {
                template_type: "generic",
                elements: [element]
              }
            }
          }
        },
        { params: { access_token: accessToken } }
      );
    } catch (err) {
      this.logger.warn(
        `Template Direct (generic + comment_id) indisponível ou rejeitado; enviando texto. ${axios.isAxiosError(err) ? JSON.stringify(err.response?.data) : (err as Error).message}`
      );
      await this.sendPrivateReply(userId, commentId, input.textFallback);
    }
  }
}
