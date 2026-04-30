import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { randomBytes } from "crypto";
import { PrismaService } from "../../common/prisma.service";

type PageAccount = {
  id: string;
  name?: string;
  access_token: string;
  instagram_business_account?: { id: string };
};

type MetaGraphErrorBody = {
  error?: { message?: string; error_user_msg?: string; code?: number };
};

type GranularScope = { scope: string; target_ids?: string[] };

type DebugTokenData = {
  scopes?: string[];
  granular_scopes?: GranularScope[];
};

const PAGE_LIKE_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_manage_posts",
  "pages_manage_engagement"
];

const IG_LIKE_SCOPES = ["instagram_manage_comments", "instagram_manage_messages", "instagram_basic", "instagram_manage_insights"];

@Injectable()
export class MetaOAuthService {
  private readonly logger = new Logger(MetaOAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  private redirectUri() {
    return process.env.META_REDIRECT_URI || "http://localhost:3333/auth/meta/callback";
  }

  async startOAuth(userId: string) {
    const appId = process.env.META_APP_ID;
    if (!appId) throw new BadRequestException("META_APP_ID não configurado");

    const state = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.oAuthState.create({
      data: { state, userId, expiresAt }
    });

    const redirect = encodeURIComponent(this.redirectUri());
    const scope = encodeURIComponent(
      "instagram_manage_comments,instagram_manage_messages,pages_read_engagement,pages_show_list,pages_manage_metadata"
    );
    const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirect}&state=${state}&scope=${scope}&response_type=code&auth_type=rerequest`;
    return { url };
  }

  async handleCallback(code: string, state: string) {
    if (!code || !state) throw new BadRequestException("Parâmetros code ou state ausentes");

    const record = await this.prisma.oAuthState.findUnique({ where: { state } });
    if (!record || record.expiresAt < new Date()) {
      if (record) await this.prisma.oAuthState.delete({ where: { id: record.id } }).catch(() => undefined);
      throw new BadRequestException("State inválido ou expirado (tente de novo em Integrações).");
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) throw new BadRequestException("META_APP_ID / META_APP_SECRET não configurados");

    const redirectUri = this.redirectUri();
    const shortTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token`;

    let shortData: { access_token: string };
    try {
      const { data } = await axios.get<{ access_token: string }>(shortTokenUrl, {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code
        }
      });
      shortData = data;
    } catch (e) {
      throw new BadRequestException(this.metaAxiosMessage(e, "Falha ao trocar code por token (redirect_uri e app secret devem bater com o app Meta)."));
    }

    let longData: { access_token: string };
    try {
      const { data } = await axios.get<{ access_token: string }>(shortTokenUrl, {
        params: {
          grant_type: "fb_exchange_token",
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortData.access_token
        }
      });
      longData = data;
    } catch (e) {
      throw new BadRequestException(this.metaAxiosMessage(e, "Falha ao obter token de longa duração."));
    }

    const shortUserToken = shortData.access_token;
    const userAccessToken = longData.access_token;
    const debug = await this.fetchDebugToken(userAccessToken, appId, appSecret);

    const accountsFields = "id,name,access_token,instagram_business_account{id}";
    let list = await this.fetchPageAccountsFlatSafe(shortUserToken, accountsFields);
    if (list.length === 0) {
      list = await this.fetchPageAccountsFlatSafe(userAccessToken, accountsFields);
    }

    if (list.length === 0) {
      list = await this.fetchMeAccountsField(shortUserToken, accountsFields);
    }
    if (list.length === 0) {
      list = await this.fetchMeAccountsField(userAccessToken, accountsFields);
    }

    if (list.length === 0) {
      list = await this.fetchAccountsByUserNodeId(shortUserToken, accountsFields);
    }
    if (list.length === 0) {
      list = await this.fetchAccountsByUserNodeId(userAccessToken, accountsFields);
    }

    if (list.length === 0) {
      const debugShort = await this.fetchDebugToken(shortUserToken, appId, appSecret);
      list = await this.fetchPagesFromAllGranularTargets(shortUserToken, debugShort.granular_scopes ?? []);
    }
    if (list.length === 0) {
      list = await this.fetchPagesFromAllGranularTargets(userAccessToken, debug.granular_scopes ?? []);
    }

    if (list.length === 0) {
      list = await this.fetchPagesFromEnvFallback(shortUserToken);
    }
    if (list.length === 0) {
      list = await this.fetchPagesFromEnvFallback(userAccessToken);
    }

    if (list.length === 0) {
      list = this.fetchManualEnvPageOverride();
    }

    if (list.length === 0) {
      this.assertHasPageOrIgAccess(debug);
      const g = debug.granular_scopes ?? [];
      const nTargets = g.reduce((acc, x) => acc + (x.target_ids?.length ?? 0), 0);
      this.logger.warn(
        `OAuth: sem páginas após todos os fallbacks. granular_scopes=${g.length} entradas, target_ids total=${nTargets}.`
      );
      throw new BadRequestException(
        "A Meta não devolveu dados de página com o token OAuth. No .env da API defina META_OAUTH_FALLBACK_PAGE_ACCESS_TOKEN (Page token do Explorador Graph), META_OAUTH_FALLBACK_PAGE_ID e META_OAUTH_FALLBACK_IG_USER_ID, reinicie e volte a autorizar — ou use «Salvar integração manual» na aplicação."
      );
    }

    await this.enrichPagesWithInstagramBusiness(list);

    const page = list.find((p) => p.instagram_business_account?.id);
    if (!page?.instagram_business_account?.id) {
      this.logger.warn(`Páginas sem ID de Instagram na resposta da Graph: ${list.map((p) => p.id).join(", ")}`);
      throw new BadRequestException(
        "A Meta não devolveu o Instagram Business associado à Página (campo instagram_business_account). Confirme no Explorador Graph: GET /{id-da-pagina}?fields=instagram_business_account com token DA PÁGINA. No .env pode definir META_OAUTH_FALLBACK_IG_USER_ID (ID numérico do IG, ex. 178414…) ou use «Salvar integração manual»."
      );
    }

    const igUserId = page.instagram_business_account.id;
    const pageAccessToken = page.access_token;

    await this.upsertInstagram(record.userId, pageAccessToken, page.id, igUserId);
    await this.prisma.oAuthState.delete({ where: { id: record.id } });
    this.logger.log(`Integração Meta salva para o utilizador ${record.userId}`);
  }

  private normalizeGranularScopes(raw: unknown): GranularScope[] {
    if (!Array.isArray(raw)) return [];
    const out: GranularScope[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const g = item as Record<string, unknown>;
      const scope = typeof g.scope === "string" ? g.scope : "";
      let target_ids: string[] = [];
      if (Array.isArray(g.target_ids)) {
        target_ids = g.target_ids.map((x) => String(x));
      }
      out.push({ scope, target_ids });
    }
    return out;
  }

  private async fetchDebugToken(userAccessToken: string, appId: string, appSecret: string): Promise<DebugTokenData> {
    try {
      const { data } = await axios.get<{ data?: DebugTokenData & { granular_scopes?: unknown } }>(
        "https://graph.facebook.com/v21.0/debug_token",
        {
          params: {
            input_token: userAccessToken,
            access_token: `${appId}|${appSecret}`
          }
        }
      );
      const inner = data.data ?? {};
      return {
        scopes: inner.scopes,
        granular_scopes: this.normalizeGranularScopes(inner.granular_scopes)
      };
    } catch (e) {
      this.logger.warn(`debug_token: ${this.metaAxiosMessage(e, "")}`);
      return {};
    }
  }

  private assertHasPageOrIgAccess(debug: DebugTokenData) {
    const scopes = debug.scopes ?? [];
    const granular = debug.granular_scopes ?? [];

    for (const s of scopes) {
      if (PAGE_LIKE_SCOPES.includes(s) || IG_LIKE_SCOPES.includes(s)) return;
    }
    if (scopes.includes("pages_show_list")) return;

    for (const g of granular) {
      if ((g.target_ids?.length ?? 0) > 0) return;
      const sc = g.scope ?? "";
      if (sc.startsWith("pages_") || sc.startsWith("instagram_")) return;
    }

    if (scopes.length === 0 && granular.length === 0) return;

    throw new BadRequestException(
      "O token não inclui acesso a Páginas ou Instagram. Volte a abrir «Abrir login Meta» e aceite todas as opções até «Concluir»."
    );
  }

  private async fetchAccountsByUserNodeId(userAccessToken: string, accountsFields: string): Promise<PageAccount[]> {
    try {
      const { data: me } = await axios.get<{ id?: string }>("https://graph.facebook.com/v21.0/me", {
        params: { fields: "id", access_token: userAccessToken }
      });
      const uid = me.id;
      if (!uid) return [];
      const { data } = await axios.get<{ data?: PageAccount[] }>(`https://graph.facebook.com/v21.0/${uid}/accounts`, {
        params: {
          fields: accountsFields,
          access_token: userAccessToken,
          limit: 100
        }
      });
      return data.data ?? [];
    } catch (e) {
      this.logger.warn(`GET /{user-id}/accounts alternativo: ${this.metaAxiosMessage(e, "")}`);
      return [];
    }
  }

  /**
   * Todos os target_ids de todas as entradas granulares (a Meta nem sempre usa prefixo pages_/instagram_).
   */
  private collectAllTargetIds(granular: GranularScope[]): string[] {
    const set = new Set<string>();
    for (const g of granular) {
      for (const tid of g.target_ids ?? []) {
        const s = String(tid).trim();
        if (s) set.add(s);
      }
    }
    return [...set];
  }

  private async fetchPagesFromAllGranularTargets(userAccessToken: string, granular: GranularScope[]): Promise<PageAccount[]> {
    const ids = this.collectAllTargetIds(granular);
    const out: PageAccount[] = [];
    const seen = new Set<string>();

    for (const id of ids) {
      let row = await this.fetchSinglePageById(id, userAccessToken);
      if (!row) row = await this.fetchPageViaInstagramBusinessId(id, userAccessToken);
      if (row && !seen.has(row.id)) {
        seen.add(row.id);
        out.push(row);
      }
    }

    return out;
  }

  private async fetchPagesFromEnvFallback(userAccessToken: string): Promise<PageAccount[]> {
    const raw = process.env.META_OAUTH_FALLBACK_PAGE_IDS ?? "";
    const ids = raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const out: PageAccount[] = [];
    for (const id of ids) {
      const row = await this.fetchSinglePageById(id, userAccessToken);
      if (row) out.push(row);
    }
    return out;
  }

  /**
   * Quando a Graph não devolve access_token via user token, pode definir no .env o Page Access Token
   * (Explorador Graph → token da página) + IDs — conclui o OAuth sem depender de /me/accounts.
   */
  private fetchManualEnvPageOverride(): PageAccount[] {
    const pageToken = process.env.META_OAUTH_FALLBACK_PAGE_ACCESS_TOKEN?.trim();
    const igId = process.env.META_OAUTH_FALLBACK_IG_USER_ID?.trim();
    let pageId =
      process.env.META_OAUTH_FALLBACK_PAGE_ID?.trim() ||
      (process.env.META_OAUTH_FALLBACK_PAGE_IDS ?? "")
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)[0];

    if (!pageToken || !igId || !pageId) return [];

    this.logger.log("OAuth: a usar META_OAUTH_FALLBACK_PAGE_ACCESS_TOKEN + IDs do .env.");
    return [
      {
        id: pageId,
        access_token: pageToken,
        instagram_business_account: { id: igId }
      }
    ];
  }

  /**
   * Com token de utilizador, /me/accounts e GET /{page} por vezes não trazem `instagram_business_account`.
   * Com o token da própria página, o mesmo campo costuma aparecer quando o IG está ligado na Meta.
   */
  private async enrichPagesWithInstagramBusiness(pages: PageAccount[]): Promise<void> {
    const envIg = process.env.META_OAUTH_FALLBACK_IG_USER_ID?.trim();
    for (const p of pages) {
      if (p.instagram_business_account?.id || !p.access_token) continue;
      const igId = await this.fetchInstagramBusinessIdForPage(p.id, p.access_token);
      if (igId) p.instagram_business_account = { id: igId };
    }
    if (envIg) {
      for (const p of pages) {
        if (!p.instagram_business_account?.id && p.access_token) {
          this.logger.warn(`OAuth: a usar META_OAUTH_FALLBACK_IG_USER_ID na página ${p.id} (Graph não devolveu instagram_business_account).`);
          p.instagram_business_account = { id: envIg };
          break;
        }
      }
    }
  }

  private async fetchInstagramBusinessIdForPage(pageId: string, pageAccessToken: string): Promise<string | null> {
    try {
      const { data } = await axios.get<{ instagram_business_account?: { id?: string } }>(
        `https://graph.facebook.com/v21.0/${pageId}`,
        {
          params: {
            fields: "instagram_business_account{id}",
            access_token: pageAccessToken
          }
        }
      );
      return data.instagram_business_account?.id ?? null;
    } catch (e) {
      this.logger.warn(`instagram_business_account (token da página) ${pageId}: ${this.metaAxiosMessage(e, "")}`);
      return null;
    }
  }

  private async fetchSinglePageById(pageId: string, userAccessToken: string): Promise<PageAccount | null> {
    try {
      const { data } = await axios.get<PageAccount & { id: string }>(`https://graph.facebook.com/v21.0/${pageId}`, {
        params: {
          fields: "id,name,access_token,instagram_business_account{id}",
          access_token: userAccessToken
        }
      });
      if (!data.access_token) return null;
      return {
        id: data.id,
        name: data.name,
        access_token: data.access_token,
        instagram_business_account: data.instagram_business_account
      };
    } catch (e) {
      this.logger.warn(`GET /${pageId}: ${this.metaAxiosMessage(e, "")}`);
      return null;
    }
  }

  private async fetchPageViaInstagramBusinessId(igUserId: string, userAccessToken: string): Promise<PageAccount | null> {
    try {
      const { data } = await axios.get<{
        connected_facebook_page?: { id?: string };
      }>(`https://graph.facebook.com/v21.0/${igUserId}`, {
        params: {
          fields: "connected_facebook_page{id}",
          access_token: userAccessToken
        }
      });
      const pageId = data.connected_facebook_page?.id;
      if (!pageId) return null;
      return this.fetchSinglePageById(pageId, userAccessToken);
    } catch (e) {
      this.logger.warn(`GET /${igUserId} (IG→página): ${this.metaAxiosMessage(e, "")}`);
      return null;
    }
  }

  private async fetchMeAccountsField(userAccessToken: string, accountsFields: string): Promise<PageAccount[]> {
    try {
      const { data } = await axios.get<{ accounts?: { data?: PageAccount[] } }>("https://graph.facebook.com/v21.0/me", {
        params: {
          fields: `accounts{${accountsFields}}`,
          access_token: userAccessToken
        }
      });
      return data.accounts?.data ?? [];
    } catch {
      return [];
    }
  }

  private async fetchPageAccountsFlatSafe(userAccessToken: string, accountsFields: string): Promise<PageAccount[]> {
    try {
      const { data } = await axios.get<{ data?: PageAccount[] }>("https://graph.facebook.com/v21.0/me/accounts", {
        params: {
          fields: accountsFields,
          access_token: userAccessToken,
          limit: 100
        }
      });
      return data.data ?? [];
    } catch (e) {
      this.logger.warn(`me/accounts: ${this.metaAxiosMessage(e, "")}`);
      return [];
    }
  }

  private metaAxiosMessage(e: unknown, fallback: string): string {
    if (!axios.isAxiosError(e)) return fallback;
    const body = e.response?.data as MetaGraphErrorBody | undefined;
    const msg = body?.error?.error_user_msg || body?.error?.message;
    return msg ? `${fallback} Detalhe Meta: ${msg}` : fallback;
  }

  private async upsertInstagram(userId: string, accessToken: string, pageId: string, igUserId: string) {
    const existing = await this.prisma.instagramAccount.findFirst({ where: { userId } });
    if (existing) {
      await this.prisma.instagramAccount.update({
        where: { id: existing.id },
        data: { accessToken, pageId, igUserId }
      });
      return;
    }
    await this.prisma.instagramAccount.create({
      data: { userId, accessToken, pageId, igUserId }
    });
  }
}
