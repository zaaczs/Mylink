"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Link2, LogOut, Settings2, Zap } from "lucide-react";
import { clearToken } from "@/lib/auth";

const nav = [
  { href: "/automacoes", label: "Automações", icon: Bot },
  { href: "/integracoes", label: "Integrações", icon: Link2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings2 }
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white p-4 shadow-sm">
      <Link
        href="/automacoes"
        className="mb-8 block rounded-xl border border-zinc-200 bg-zinc-100 p-3 text-sm font-semibold text-zinc-800"
      >
        MyLink
      </Link>
      <nav className="flex-1 space-y-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? "bg-accent font-medium text-white shadow-sm"
                  : "bg-panelSoft text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 space-y-2 border-t border-zinc-200 pt-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
        >
          <LogOut size={16} />
          Sair
        </button>
        <div className="flex items-center gap-2 px-2 text-xs text-zinc-500">
          <Zap size={14} />
          MVP local
        </div>
      </div>
    </aside>
  );
}
