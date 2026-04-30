import axios from "axios";
import type { TriggerAutomationDraft } from "@/store/automation";
import { clearToken, getToken } from "@/lib/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function isAuthLoginOrRegister(config: { url?: string } | undefined) {
  const url = config?.url ?? "";
  return url.includes("/auth/login") || url.includes("/auth/register");
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401 && typeof window !== "undefined" && !isAuthLoginOrRegister(err.config)) {
      clearToken();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export function formatApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
      return "Não foi possível falar com a API. Confira se `npm run dev:api` está rodando e se `NEXT_PUBLIC_API_URL` aponta para a API (ex.: http://localhost:3333).";
    }
    const msg = err.response?.data?.message as string | string[] | undefined;
    if (Array.isArray(msg)) return msg.join(" ");
    if (typeof msg === "string" && msg.length > 0) return msg;
  }
  return "Erro inesperado.";
}

export type InstagramPost = {
  id: string;
  caption: string;
  media_url: string;
  media_type: string;
};

export type AutomationRecord = {
  id: string;
  userId: string;
  postId: string;
  keywords: string;
  replyComment: string;
  dmMessage: string;
  link: string;
  isActive: boolean;
  sentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DirectFlowPayload = {
  body: string;
  link: string;
  linkButtonTitle?: string;
  linkCardTitle?: string;
};

export async function login(email: string, password: string) {
  const { data } = await api.post<{ access_token: string }>("/auth/login", { email, password });
  return data;
}

export async function register(email: string, password: string) {
  const { data } = await api.post<{ access_token: string }>("/auth/register", { email, password });
  return data;
}

export async function fetchPosts() {
  const { data } = await api.get<InstagramPost[]>("/instagram/posts");
  return data;
}

export async function createTriggerAutomation(payload: TriggerAutomationDraft) {
  const { data } = await api.post<AutomationRecord>("/automation", {
    postId: payload.postId,
    keywords: payload.keywords,
    replyToCommentEnabled: payload.replyToCommentEnabled,
    commentReplyVariants: [...payload.commentReplyVariants]
  });
  return data;
}

export async function fetchAutomationById(id: string) {
  const { data } = await api.get<AutomationRecord>(`/automation/${id}`);
  return data;
}

export async function updateAutomationDm(id: string, payload: DirectFlowPayload) {
  const { data } = await api.patch<AutomationRecord>(`/automation/${id}`, {
    body: payload.body,
    link: payload.link,
    ...(payload.linkButtonTitle !== undefined ? { linkButtonTitle: payload.linkButtonTitle } : {}),
    ...(payload.linkCardTitle !== undefined ? { linkCardTitle: payload.linkCardTitle } : {})
  });
  return data;
}

export async function fetchAutomations() {
  const { data } = await api.get<AutomationRecord[]>("/automation");
  return data;
}

export type MetaIntegrationStatus =
  | { connected: false }
  | { connected: true; pageId: string; igUserId: string; tokenPreview: string };

export async function fetchMetaIntegration(): Promise<MetaIntegrationStatus> {
  const { data } = await api.get<MetaIntegrationStatus>("/integrations/meta");
  return data;
}

export async function saveMetaManual(input: { accessToken: string; pageId: string; igUserId: string }) {
  const { data } = await api.post("/integrations/meta/manual", input);
  return data;
}

export async function startMetaOAuth(): Promise<{ url: string }> {
  const { data } = await api.post<{ url: string }>("/integrations/meta/oauth/start");
  return data;
}
