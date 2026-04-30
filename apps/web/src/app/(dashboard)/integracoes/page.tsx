import { Suspense } from "react";
import { IntegrationsPanel } from "@/components/IntegrationsPanel";

export default function IntegracoesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Carregando…</p>}>
      <IntegrationsPanel />
    </Suspense>
  );
}
