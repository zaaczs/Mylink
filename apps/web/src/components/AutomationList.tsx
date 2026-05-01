"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchAutomations, formatApiError, type AutomationRecord } from "@/lib/api";
import { AUTOMATION_ALL_POSTS_POST_ID } from "@/store/automation";

function scopeLabel(postId: string) {
  if (postId === AUTOMATION_ALL_POSTS_POST_ID) return "Qualquer publicação ou Reel";
  return `Post / Reel ${postId}`;
}

function keywordsLabel(keywordsCsv: string) {
  const parts = keywordsCsv
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export function AutomationList() {
  const [items, setItems] = useState<AutomationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAutomations());
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Minhas automações</h1>
          <p className="text-sm text-zinc-600">Gerencie gatilhos, respostas públicas e fluxo no Direct.</p>
        </div>
        <Link
          href="/automacoes/nova"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accentHover"
        >
          Nova automação
        </Link>
      </div>

      {loading && <p className="text-sm text-zinc-600">Carregando…</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !items.length && (
        <div className="card rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-sm text-zinc-700">Nenhuma automação ainda.</p>
          <Link href="/automacoes/nova" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
            Criar primeira automação
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((row) => (
            <li key={row.id} className="card rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {row.isActive ? "Ativa" : "Rascunho"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Execuções: {row.sentCount} · Atualizado {new Date(row.updatedAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-800">
                    <span className="font-medium text-zinc-900">Gatilho:</span> {scopeLabel(row.postId)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    <span className="font-medium text-zinc-800">Palavras-chave:</span> {keywordsLabel(row.keywords)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/automacoes/${row.id}/gatilho`}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-xs font-medium text-zinc-800 hover:bg-zinc-100"
                  >
                    Editar gatilho
                  </Link>
                  {!row.isActive && (
                    <Link
                      href={`/automacoes/${row.id}/direct`}
                      className="rounded-lg bg-accent px-3 py-2 text-center text-xs font-semibold text-white hover:bg-accentHover"
                    >
                      Configurar Direct
                    </Link>
                  )}
                  {row.isActive && (
                    <Link
                      href={`/automacoes/${row.id}/direct`}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-xs font-medium text-zinc-800 hover:bg-zinc-100"
                    >
                      Editar Direct
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
