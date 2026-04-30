"use client";

type Props = {
  body: string;
  link: string;
  linkButtonTitle: string;
  linkCardTitle: string;
};

/** Prévia no estilo card + botão (quando a Meta aceitar template genérico no Direct). */
export function DirectMobilePreview({ body, link, linkButtonTitle, linkCardTitle }: Props) {
  const linkTrim = link.trim();
  const bodyClean = body.replace(/\{link\}/gi, "").trim();
  const title = (linkCardTitle.trim() || bodyClean.slice(0, 80) || "Mensagem").trim();
  const subtitle =
    linkCardTitle.trim() && bodyClean
      ? bodyClean.length > 80
        ? bodyClean.slice(0, 77) + "…"
        : bodyClean
      : bodyClean.length > 80
        ? bodyClean.slice(80, 157) + (bodyClean.length > 157 ? "…" : "")
        : linkCardTitle.trim()
          ? ""
          : "";

  return (
    <section className="card w-[380px] shrink-0 p-6">
      <p className="mb-3 text-xs text-zinc-500">Prévia do Direct (ilustrativa)</p>
      <div className="mx-auto min-h-[360px] w-[300px] rounded-[32px] border border-zinc-300 bg-zinc-900 p-4 shadow-inner">
        <div className="overflow-hidden rounded-2xl bg-zinc-800">
          <div className="border-b border-zinc-700/80 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Mensagem automática</p>
          </div>
          <div className="px-3 py-3">
            <p className="text-sm font-semibold leading-snug text-zinc-50">{title}</p>
            {subtitle ? <p className="mt-2 text-xs leading-relaxed text-zinc-400">{subtitle}</p> : null}
            {linkTrim ? (
              <div className="mt-3 rounded-xl bg-zinc-700/90 py-2.5 text-center text-sm font-semibold text-white">
                {linkButtonTitle.trim() || "Abrir link"}
              </div>
            ) : null}
          </div>
        </div>
        <p className="mt-3 px-1 text-[10px] leading-snug text-zinc-500">
          Tentamos enviar este layout pela API da Meta; se não for aceito para resposta a comentário, o app envia a
          mesma mensagem como texto com o link (como no Instagram costuma aparecer o URL clicável).
        </p>
      </div>
    </section>
  );
}
