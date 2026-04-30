"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { MetaIntegrationStatus } from "@/lib/api";
import { fetchMetaIntegration, saveMetaManual, startMetaOAuth } from "@/lib/api";

export function IntegrationsPanel() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string | null>(null);
  const [integration, setIntegration] = useState<MetaIntegrationStatus | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [pageId, setPageId] = useState("");
  const [igUserId, setIgUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const s = await fetchMetaIntegration();
    setIntegration(s);
  }, []);

  useEffect(() => {
    const err = searchParams.get("error");
    const ok = searchParams.get("connected");
    if (err) setStatus(`Erro: ${err}`);
    else if (ok) setStatus("Conta Meta conectada com sucesso.");
    void load();
  }, [load, searchParams]);

  const connected = integration?.connected === true;
  const statusReady = integration !== null;

  async function handleManualSave() {
    setLoading(true);
    try {
      await saveMetaManual({ accessToken, pageId, igUserId });
      setStatus("Credenciais salvas.");
      setAccessToken("");
      await load();
    } catch {
      setStatus("Falha ao salvar. Verifique o token e os IDs.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth() {
    setLoading(true);
    try {
      const { url } = await startMetaOAuth();
      window.location.href = url;
    } catch {
      setStatus("Não foi possível iniciar o OAuth (configure META_APP_ID no servidor).");
      setLoading(false);
    }
  }

  return (
    <section className="card mx-auto max-w-xl flex-1 p-6">
      <h1 className="mb-2 text-lg font-semibold text-zinc-900">Integração Meta (Instagram)</h1>

      {statusReady && connected ? (
        <p className="mb-6 text-sm text-zinc-600">
          A sua conta está ligada. Pode sincronizar posts e responder no Instagram Direct a partir desta app.
        </p>
      ) : statusReady ? (
        <p className="mb-6 text-sm text-zinc-600">
          Salve o token da página e o ID do Instagram Business para buscar posts e enviar mensagens no Direct. Ou use o login
          oficial da Meta (OAuth).
        </p>
      ) : (
        <p className="mb-6 text-sm text-zinc-600">A verificar se já existe uma ligação à Meta…</p>
      )}

      {status && (
        <p className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">{status}</p>
      )}

      {!statusReady ? null : connected && integration.connected ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              Conectado
            </span>
            <span className="text-xs text-emerald-800">Integração ativa</span>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
              <dt className="shrink-0 font-medium text-zinc-700">Token da página</dt>
              <dd className="font-mono text-zinc-600">{integration.tokenPreview}</dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
              <dt className="shrink-0 font-medium text-zinc-700">ID da página</dt>
              <dd className="break-all font-mono text-zinc-600">{integration.pageId}</dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
              <dt className="shrink-0 font-medium text-zinc-700">Instagram Business</dt>
              <dd className="break-all font-mono text-zinc-600">{integration.igUserId}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-emerald-900/80">
            Para ligar outra página ou renovar permissões, use o botão abaixo. Não é necessário voltar a colar token manualmente.
          </p>
          <button
            type="button"
            onClick={handleOAuth}
            disabled={loading}
            className="mt-3 w-full rounded-xl border border-emerald-300 bg-white py-2.5 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50 disabled:opacity-50"
          >
            Reconectar ou trocar de conta (Meta)
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <p className="font-medium text-zinc-900">Status</p>
            <p className="mt-1 text-zinc-600">Não conectado</p>
          </div>

          <h2 className="mb-2 text-sm font-medium text-zinc-800">Conectar via Meta (OAuth)</h2>
          <p className="mb-3 text-xs text-zinc-500">
            No app Meta, defina o redirect URI:{" "}
            <code className="rounded bg-zinc-200 px-1 py-0.5 text-zinc-800">http://localhost:3333/auth/meta/callback</code>
          </p>
          <button
            type="button"
            onClick={handleOAuth}
            disabled={loading}
            className="mb-8 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-sm hover:bg-accentHover disabled:opacity-50"
          >
            Abrir login Meta
          </button>

          <h2 className="mb-3 text-sm font-medium text-zinc-800">Ou cole manualmente (teste)</h2>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Page Access Token</label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="mb-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            placeholder="EAAG…"
          />
          <label className="mb-1 block text-xs font-medium text-zinc-500">ID da página</label>
          <input
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            className="mb-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
          />
          <label className="mb-1 block text-xs font-medium text-zinc-500">ID da conta Instagram Business</label>
          <input
            value={igUserId}
            onChange={(e) => setIgUserId(e.target.value)}
            className="mb-4 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
          />
          <button
            type="button"
            onClick={handleManualSave}
            disabled={loading}
            className="w-full rounded-xl border border-zinc-300 bg-zinc-100 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            Salvar integração manual
          </button>
        </>
      )}
    </section>
  );
}
