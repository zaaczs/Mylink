/**
 * Monta o texto único enviado no Direct (private reply) quando não usamos template.
 * Formato novo: `{ "v": 2, "body": "..." }` — substitui `{link}` ou acrescenta o URL ao final.
 * Legado: `firstMessage`, `secondMessage`, `finalMessage`.
 */
export type DmPayloadV2 = {
  v: 2;
  body: string;
  /** Rótulo do botão web (ex.: "Abrir link"). Máx. 20 na API. */
  linkButtonTitle?: string;
  /** Título do card no template genérico (opcional). */
  linkCardTitle?: string;
};

export function parseDmPayloadV2(dmMessageJson: string): DmPayloadV2 | null {
  try {
    const p = JSON.parse(dmMessageJson) as DmPayloadV2;
    if (p && p.v === 2 && typeof p.body === "string") return p;
  } catch {
    /* legado */
  }
  return null;
}

export function buildDirectMessageText(dmMessageJson: string, link: string): string {
  const linkTrim = link.trim();
  try {
    const p = JSON.parse(dmMessageJson) as {
      v?: number;
      body?: string;
      firstMessage?: string;
      secondMessage?: string;
      finalMessage?: string;
    };
    if (p.v === 2 && typeof p.body === "string") {
      let t = p.body.trim();
      if (t.includes("{link}")) {
        return t.replace(/\{link\}/g, linkTrim);
      }
      if (linkTrim) {
        return t ? `${t}\n\n${linkTrim}` : linkTrim;
      }
      return t;
    }
    const finalMessage = (p.finalMessage || "Aqui está seu link: {link}").replace("{link}", linkTrim);
    return [p.firstMessage, p.secondMessage, finalMessage].filter(Boolean).join("\n\n").trim();
  } catch {
    return linkTrim;
  }
}
