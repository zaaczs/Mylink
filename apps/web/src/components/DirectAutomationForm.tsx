"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DirectMobilePreview } from "@/components/DirectMobilePreview";
import { fetchAutomationById, formatApiError, updateAutomationDm } from "@/lib/api";

const DEFAULT_BODY =
  "Opa! Aqui está o link de todas as peças e produtos do projeto!";

type DmForm = {
  body: string;
  link: string;
  linkButtonTitle: string;
  linkCardTitle: string;
};

function parseDmFromRow(dmMessage: string, linkFromRow: string): DmForm {
  try {
    const parsed = JSON.parse(dmMessage) as {
      v?: number;
      body?: string;
      linkButtonTitle?: string;
      linkCardTitle?: string;
      firstMessage?: string;
      secondMessage?: string;
      finalMessage?: string;
    };
    if (parsed.v === 2 && typeof parsed.body === "string") {
      return {
        body: parsed.body.trim() ? parsed.body : DEFAULT_BODY,
        link: linkFromRow || "",
        linkButtonTitle: parsed.linkButtonTitle?.trim() || "Abrir link",
        linkCardTitle: parsed.linkCardTitle?.trim() || ""
      };
    }
    const finalM = (parsed.finalMessage || "").replace(/\{link\}/g, linkFromRow || "{link}");
    const parts = [parsed.firstMessage, parsed.secondMessage, finalM].map((s) => String(s || "").trim()).filter(Boolean);
    const body = parts.length ? parts.join("\n\n") : DEFAULT_BODY;
    return { body, link: linkFromRow || "", linkButtonTitle: "Abrir link", linkCardTitle: "" };
  } catch {
    return { body: DEFAULT_BODY, link: linkFromRow || "", linkButtonTitle: "Abrir link", linkCardTitle: "" };
  }
}

export function DirectAutomationForm() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState<DmForm>({
    body: DEFAULT_BODY,
    link: "",
    linkButtonTitle: "Abrir link",
    linkCardTitle: ""
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFeedback(null);
      try {
        const row = await fetchAutomationById(id);
        if (cancelled) return;
        setForm(parseDmFromRow(row.dmMessage, row.link));
      } catch (err) {
        if (!cancelled) setFeedback(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function setField<K extends keyof DmForm>(key: K, value: DmForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    setFeedback(null);
    try {
      await updateAutomationDm(id, {
        body: form.body,
        link: form.link,
        linkButtonTitle: form.linkButtonTitle,
        linkCardTitle: form.linkCardTitle || undefined
      });
      router.push("/automacoes");
    } catch (err) {
      setFeedback(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (!id) {
    return <p className="text-sm text-red-700">Identificador inválido.</p>;
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">Carregando automação…</p>;
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4">
      <section className="card min-w-0 flex-1 p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Mensagem no Direct</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Uma mensagem após o comentário. Use {"{link}"} no texto se quiser o URL no meio da frase; caso contrário o
              link é enviado junto no final (fallback em texto). O título do card e o texto do botão ajudam a ficar no
              estilo do Instagram (card + &quot;Abrir link&quot;), quando a Meta aceitar template na resposta ao
              comentário.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href={`/automacoes/${id}/gatilho`} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Editar gatilho
            </Link>
            <Link href="/automacoes" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Voltar à lista
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Texto da mensagem</label>
            <textarea
              value={form.body}
              onChange={(e) => setField("body", e.target.value)}
              rows={5}
              placeholder={DEFAULT_BODY}
              className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">URL do link</label>
            <input
              value={form.link}
              onChange={(e) => setField("link", e.target.value)}
              placeholder="https://linktr.ee/seuperfil"
              className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Título do card (opcional)</label>
              <input
                value={form.linkCardTitle}
                onChange={(e) => setField("linkCardTitle", e.target.value.slice(0, 80))}
                placeholder="Ex.: Novidades da loja"
                maxLength={80}
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
              <p className="mt-1 text-[10px] text-zinc-500">Até 80 caracteres. Se vazio, usamos o início do texto.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Texto do botão do link</label>
              <input
                value={form.linkButtonTitle}
                onChange={(e) => setField("linkButtonTitle", e.target.value.slice(0, 20))}
                placeholder="Abrir link"
                maxLength={20}
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
              <p className="mt-1 text-[10px] text-zinc-500">Até 20 caracteres (limite comum da Meta).</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || form.body.trim().length < 2 || form.link.trim().length < 4}
          className="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-sm hover:bg-accentHover disabled:opacity-40"
        >
          {saving ? "Salvando…" : "Salvar e ativar automação"}
        </button>

        {feedback && <p className="mt-3 text-sm text-red-700">{feedback}</p>}
      </section>
      <DirectMobilePreview
        body={form.body}
        link={form.link}
        linkButtonTitle={form.linkButtonTitle}
        linkCardTitle={form.linkCardTitle}
      />
    </div>
  );
}
