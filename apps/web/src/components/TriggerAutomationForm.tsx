"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTOMATION_ALL_POSTS_POST_ID, useAutomationStore } from "@/store/automation";
import { createTriggerAutomation, fetchPosts, formatApiError, type InstagramPost } from "@/lib/api";

export function TriggerAutomationForm() {
  const router = useRouter();
  const { draft, setField, setReplyVariant, addKeyword, removeKeyword, reset } = useAutomationStore();
  const [keywordInput, setKeywordInput] = useState("");
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedPost = useMemo(() => posts.find((post) => post.id === draft.postId), [posts, draft.postId]);
  const allPostsSelected = draft.postId === AUTOMATION_ALL_POSTS_POST_ID;

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
    setSaving(true);
    setFeedback(null);
    try {
      const created = await createTriggerAutomation(draft);
      reset();
      router.push(`/automacoes/${created.id}/direct`);
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

  const replyLabels = ["Resposta 1", "Resposta 2", "Resposta 3"] as const;

  return (
    <section className="card flex-1 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">Quando alguém comenta</h2>
        <p className="mt-1 text-sm text-zinc-600">Defina o post (ou toda a conta), as palavras-chave e as respostas públicas.</p>
      </div>

      <p className="mb-3 text-sm font-medium text-zinc-800">Publicação</p>
      <p className="mb-3 text-sm text-zinc-600">
        Escolha se a automação vale para todos os posts e reels da conta ou apenas para um específico.
      </p>

      <button
        type="button"
        onClick={() => setField("postId", AUTOMATION_ALL_POSTS_POST_ID)}
        className={`mb-4 w-full rounded-xl border p-4 text-left text-sm transition ${
          allPostsSelected
            ? "border-accent bg-zinc-100 ring-1 ring-zinc-400"
            : "border-zinc-200 bg-white hover:bg-zinc-50"
        }`}
      >
        <p className="font-semibold text-zinc-900">Qualquer publicação ou Reel</p>
        <p className="mt-1 text-xs text-zinc-600">
          Mesmas palavras-chave em qualquer publicação da conta (atuais e futuras).
        </p>
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
              draft.postId === post.id ? "border-accent bg-zinc-100 ring-1 ring-zinc-400" : "border-zinc-200 bg-white hover:bg-zinc-50"
            }`}
          >
            <p className="line-clamp-2 text-zinc-800">{post.caption || "Sem legenda"}</p>
            <p className="mt-2 text-zinc-500">{post.id}</p>
          </button>
        ))}
      </div>

      {allPostsSelected && (
        <p className="mb-4 text-xs text-emerald-700">Escopo: todas as publicações da conta conectada.</p>
      )}
      {!allPostsSelected && selectedPost && (
        <p className="mb-4 text-xs text-emerald-700">Post selecionado: {selectedPost.id}</p>
      )}

      <p className="mb-2 text-sm font-medium text-zinc-800">Palavras-chave no comentário</p>
      <p className="mb-2 text-xs text-zinc-500">Aperte Enter para incluir cada palavra (ex.: link, preço, comprar).</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {draft.keywords.map((word) => (
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
          onClick={() => setField("replyToCommentEnabled", !draft.replyToCommentEnabled)}
          className={`h-7 w-12 rounded-full p-1 ${draft.replyToCommentEnabled ? "bg-emerald-600" : "bg-zinc-300"}`}
          aria-pressed={draft.replyToCommentEnabled}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white shadow transition ${
              draft.replyToCommentEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="mb-6 space-y-3">
        {([0, 1, 2] as const).map((i) => (
          <div key={i}>
            <label className="mb-1 block text-xs font-medium text-zinc-500">{replyLabels[i]}</label>
            <textarea
              value={draft.commentReplyVariants[i]}
              onChange={(e) => setReplyVariant(i, e.target.value)}
              rows={2}
              disabled={!draft.replyToCommentEnabled}
              className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !draft.postId.trim() || draft.keywords.length === 0}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-sm hover:bg-accentHover disabled:opacity-40"
      >
        {saving ? "Salvando…" : "Salvar e configurar Direct"}
      </button>

      {feedback && <p className="mt-3 text-sm text-red-700">{feedback}</p>}
    </section>
  );
}
