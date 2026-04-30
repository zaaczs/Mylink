"use client";

import { useState } from "react";
import { AUTOMATION_ALL_POSTS_POST_ID, useAutomationStore } from "@/store/automation";

const tabs = ["Publicação", "Comentários", "Direct"] as const;

export function MobilePreview() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Comentários");
  const [variantIdx, setVariantIdx] = useState(0);
  const { draft } = useAutomationStore();

  const kwPreview = draft.keywords[0] ?? "link";
  const replyPreview =
    draft.replyToCommentEnabled && draft.commentReplyVariants[variantIdx]?.trim()
      ? draft.commentReplyVariants[variantIdx]
      : "—";

  return (
    <section className="card w-[380px] shrink-0 p-6">
      <p className="mb-3 text-xs text-zinc-500">
        A prévia mostra como pode aparecer no Instagram (ilustrativo).
      </p>
      <div className="mb-4 flex gap-2">
        {tabs.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              tab === item ? "bg-accent text-white shadow-sm" : "border border-zinc-200 bg-zinc-100 text-zinc-700"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mx-auto min-h-[560px] w-[300px] rounded-[32px] border border-zinc-300 bg-zinc-900 p-4 shadow-inner">
        <div className="space-y-2 text-sm">
          {tab === "Publicação" && (
            <div className="rounded-xl bg-zinc-800 p-3 text-zinc-200">
              {draft.postId === AUTOMATION_ALL_POSTS_POST_ID
                ? "Qualquer publicação da sua conta"
                : `Publicação: ${draft.postId || "selecione um post"}`}
            </div>
          )}
          {tab === "Comentários" && (
            <>
              <div className="rounded-xl bg-zinc-800 p-3 text-zinc-200">Usuário: {kwPreview}</div>
              {draft.replyToCommentEnabled && (
                <>
                  <div className="ml-auto w-fit max-w-[90%] rounded-xl bg-zinc-600 px-3 py-2 text-zinc-50">
                    {replyPreview}
                  </div>
                  <div className="flex justify-center gap-1 pt-1">
                    {([0, 1, 2] as const).map((i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setVariantIdx(i)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          variantIdx === i ? "bg-accent text-white" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {tab === "Direct" && (
            <div className="rounded-xl bg-zinc-800 p-3 text-xs leading-relaxed text-zinc-400">
              O fluxo no Direct é configurado no passo seguinte, depois de salvar o gatilho.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
