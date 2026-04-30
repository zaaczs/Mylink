import { BadRequestException, Controller, Get, Logger, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import axios from "axios";
import { MetaOAuthService } from "./meta-oauth.service";

@Controller("auth/meta")
export class MetaCallbackController {
  private readonly logger = new Logger(MetaCallbackController.name);

  constructor(private readonly metaOAuth: MetaOAuthService) {}

  @Get("callback")
  async callback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Query("error_description") errorDescription: string | undefined,
    @Res() res: Response
  ) {
    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    if (error) {
      const msg = errorDescription || error;
      return res.redirect(`${frontend}/integracoes?error=${encodeURIComponent(msg)}`);
    }
    try {
      await this.metaOAuth.handleCallback(code as string, state as string);
      return res.redirect(`${frontend}/integracoes?connected=1`);
    } catch (e: unknown) {
      this.logger.warn(`OAuth callback falhou: ${this.describeError(e)}`);
      const msg = this.describeError(e);
      return res.redirect(`${frontend}/integracoes?error=${encodeURIComponent(msg)}`);
    }
  }

  private describeError(e: unknown): string {
    if (e instanceof BadRequestException) {
      return typeof e.message === "string" ? e.message : "oauth_failed";
    }
    if (axios.isAxiosError(e)) {
      const meta = e.response?.data as { error?: { message?: string; error_user_msg?: string } };
      const fromMeta = meta?.error?.error_user_msg || meta?.error?.message;
      if (fromMeta) return fromMeta;
      if (e.response?.status) return `Erro HTTP ${e.response.status} ao falar com a Meta.`;
    }
    if (e instanceof Error && e.message) return e.message;
    return "oauth_failed";
  }
}
