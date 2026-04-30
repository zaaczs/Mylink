"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [pathname, router]);

  return (
    <main className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <Sidebar />
      <section className="flex flex-1 gap-4 overflow-auto p-6">{children}</section>
    </main>
  );
}
