export type StoredPublicRepliesV1 = {
  v: 1;
  enabled: boolean;
  variants: string[];
};

export function serializePublicReplies(enabled: boolean, variants: string[]): string {
  const normalized = variants.slice(0, 3);
  while (normalized.length < 3) normalized.push("");
  return JSON.stringify({ v: 1 as const, enabled, variants: normalized } satisfies StoredPublicRepliesV1);
}

/** Escolhe uma variação aleatória; compatível com texto simples antigo em `replyComment`. */
export function pickPublicReply(stored: string): string | null {
  const trimmed = stored.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as StoredPublicRepliesV1;
    if (parsed && parsed.v === 1 && Array.isArray(parsed.variants)) {
      if (!parsed.enabled) return null;
      const texts = parsed.variants.map((s) => String(s).trim()).filter((s) => s.length > 0);
      if (!texts.length) return null;
      return texts[Math.floor(Math.random() * texts.length)] ?? null;
    }
  } catch {
    /* legado: string única */
  }
  return trimmed;
}
