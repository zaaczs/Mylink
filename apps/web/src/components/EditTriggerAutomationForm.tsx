"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import {
  fetchAutomationById,
  fetchPosts,
  formatApiError,
  updateAutomationTrigger,
  type AutomationRecord,
  type InstagramPost
} from "@/lib/api";
import { AUTOMATION_ALL_POSTS_POST_ID } from "@/store/automation";

type TriggerForm = {
  postId: string;
  keywords: string[];
  replyToCommentEnabled: boolean;
  commentReplyVariants: [string, string, string];
};

const EMPTY_FORM: TriggerForm = {
  postId: "",
  keywords: [],
  replyToCommentEnabled: true,
  commentReplyVariants: ["", "", ""]
};

function parseKeywords(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function parsePublicReplies(stored: string): Pick<TriggerForm, "replyToCommentEnabled" | "commentReplyVariants"> {
  try {
    const parsed = JSON.parse(stored) as { v?: number; enabled?: boolean; variants?: string[] };
    if (parsed.v === 1 && Array.isArray(parsed.variants)) {
      const variants = parsed.variants.slice(0, 3).map((value) => String(value ?? ""));
      while (variants.length < 3) variants.push("");
      return {
        replyToCommentEnabled: parsed.enabled !== false,
        commentReplyVariants: [variants[0] ?? "", variants[1] ?? "", variants[2] ?? ""]
      };
    }
  } catch {
    // Mantem fallback abaixo para dados legados.
  }

  const fallback = [stored.trim(), "", ""] as [string, string, string];
  return { replyToCommentEnabled: Boolean(fallback[0]), commentReplyVariants: fallback };
}

function toForm(row: AutomationRecord): TriggerForm {
  const replies = parsePublicReplies(row.replyComment);
  return {
    postId: row.postId,
    keywords: parseKeywords(row.keywords),
    replyToCommentEnabled: replies.replyToCommentEnabled,
    commentReplyVariants: replies.commentReplyVariants
  };
}

export function EditTriggerAutomationForm() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [form, setForm] = useState<TriggerForm>(EMPTY_FORM);
  const [keywordInput, setKeywordInput] = useState("");
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const allPostsSelected = form.postId === AUTOMATION_ALL_POSTS_POST_ID;
  const selectedPost = useMemo(() => posts.find((post) => post.id === form.postId), [posts, form.postId]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFeedback(null);
      try {
        const row = await fetchAutomationById(id);
        if (cancelled) return;
        setForm(toForm(row));
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

  function setField<K extends keyof TriggerForm>(key: K, value: TriggerForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setReplyVariant(index: 0 | 1 | 2, value: string) {
    setForm((prev) => {
      const next = [...prev.commentReplyVariants] as [string, string, string];
      next[index] = value;
      return { ...prev, commentReplyVariants: next };
    });
  }

  function addKeyword(value: string) {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return;
    setForm((prev) => {
      if (prev.keywords.includes(normalized)) return prev;
      return { ...prev, keywords: [...prev.keywords, normalized] };
    });
  }

  function removeKeyword(value: string) {
    setForm((prev) => ({ ...prev, keywords: prev.keywords.filter((item) => item !== value) }));
  }

  async function loadPosts() {
    setLoadingPosts(true);
    try {
      setPosts(await fetchPosts());
      setFeedback(null);
    } catch {
      setFeedback("Falha ao carregar posts. Verifique a integração Meta nas Integrações.");
    } finally {
      setLoadingPosts(false);
    }
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    setFeedback(null);
    try {
      await updateAutomationTrigger(id, form);
      router.push("/automacoes");
    } catch (err) {
      setFeedback(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  function onKeywordKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addKeyword(keywordInput);
    setKeywordInput("");
  }

  if (!id) {
    return <p className="text-sm text-red-700">Identificador inválido.</p>;
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">Carregando gatilho…</p>;
  }

  const replyLabels = ["Resposta 1", "Resposta 2", "Resposta 3"] as const;

  return (
    <section className="card flex-1 p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Editar gatilho da automação</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Ajuste o escopo de posts e as palavras-chave usadas para disparar a automação.
          </p>
        </div>
        <Link href="/automacoes" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          Voltar à lista
        </Link>
      </div>

      <p className="mb-3 text-sm font-medium text-zinc-800">Publicação</p>
      <p className="mb-3 text-sm text-zinc-600">
        Escolha se a automação vale para todos os posts e reels da conta ou apenas para um específico.
      </p>

      <button
        type="button"
        onClick={() => setField("postId", AUTOMATION_ALL_POSTS_POST_ID)}
        className={`mb-4 w-full rounded-xl border p-4 text-left text-sm transition ${
          allPostsSelected ? "border-accent bg-zinc-100 ring-1 ring-zinc-400" : "border-zinc-200 bg-white hover:bg-zinc-50"
        }`}
      >
        <p className="font-semibold text-zinc-900">Qualquer publicação ou Reel</p>
        <p className="mt-1 text-xs text-zinc-600">Mesmas palavras-chave em qualquer publicação da conta (atuais e futuras).</p>
      </button>

      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-zinc-600">Ou um post ou Reel específico</p>
        <button
          type="button"
          onClick={loadPosts}
          className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-200"
        >
          {loadingPosts ? "Carregando…" : "Buscar posts"}
        </button>
      </div>
      <div className="mb-6 grid max-h-48 grid-cols-2 gap-2 overflow-auto">
        {posts.map((post) => (
          <button
            type="button"
            key={post.id}
            onClick={() => setField("postId", post.id)}
            className={`rounded-xl border p-3 text-left text-xs transition ${
              form.postId === post.id ? "border-accent bg-zinc-100 ring-1 ring-zinc-400" : "border-zinc-200 bg-white hover:bg-zinc-50"
            }`}
          >
            <p className="line-clamp-2 text-zinc-800">{post.caption || "Sem legenda"}</p>
            <p className="mt-2 text-zinc-500">{post.id}</p>
          </button>
        ))}
      </div>

      {allPostsSelected && <p className="mb-4 text-xs text-emerald-700">Escopo: todas as publicações da conta conectada.</p>}
      {!allPostsSelected && selectedPost && <p className="mb-4 text-xs text-emerald-700">Post selecionado: {selectedPost.id}</p>}

      <p className="mb-2 text-sm font-medium text-zinc-800">Palavras-chave no comentário</p>
      <p className="mb-2 text-xs text-zinc-500">Aperte Enter para incluir cada palavra (ex.: link, preço, comprar).</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {form.keywords.map((word) => (
          <button
            type="button"
            key={word}
            onClick={() => removeKeyword(word)}
            className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs text-zinc-800 hover:bg-zinc-200"
          >
            {word} ✕
          </button>
        ))}
      </div>
      <div className="mb-6 flex gap-2">
        <input
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          onKeyDown={onKeywordKeyDown}
          placeholder="Digite uma palavra-chave"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
        />
        <button
          type="button"
          onClick={() => {
            addKeyword(keywordInput);
            setKeywordInput("");
          }}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accentHover"
        >
          Adicionar
        </button>
      </div>

      <p className="mb-2 text-sm font-medium text-zinc-800">Em seguida (comentário público)</p>
      <p className="mb-3 text-xs text-zinc-500">
        Três mensagens: uma delas é escolhida aleatoriamente a cada comentário, para parecer mais natural.
      </p>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        <span className="text-sm text-zinc-800">Responder comentário publicamente</span>
        <button
          type="button"
          onClick={() => setField("replyToCommentEnabled", !form.replyToCommentEnabled)}
          className={`h-7 w-12 rounded-full p-1 ${form.replyToCommentEnabled ? "bg-emerald-600" : "bg-zinc-300"}`}
          aria-pressed={form.replyToCommentEnabled}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white shadow transition ${
              form.replyToCommentEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="mb-6 space-y-3">
        {([0, 1, 2] as const).map((i) => (
          <div key={i}>
            <label className="mb-1 block text-xs font-medium text-zinc-500">{replyLabels[i]}</label>
            <textarea
              value={form.commentReplyVariants[i]}
              onChange={(e) => setReplyVariant(i, e.target.value)}
              rows={2}
              disabled={!form.replyToCommentEnabled}
              className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !form.postId.trim() || form.keywords.length === 0}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-sm hover:bg-accentHover disabled:opacity-40"
      >
        {saving ? "Salvando…" : "Salvar alterações do gatilho"}
      </button>

      {feedback && <p className="mt-3 text-sm text-red-700">{feedback}</p>}
    </section>
  );
}
