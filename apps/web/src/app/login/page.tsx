"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatApiError, login, register } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("teste@local.dev");
  const [password, setPassword] = useState("teste123");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage(null);
    try {
      const data = mode === "login" ? await login(email, password) : await register(email, password);
      setToken(data.access_token);
      router.replace("/automacoes");
    } catch (err) {
      setMessage(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-md">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">MyLink</h1>
        <p className="mb-6 text-sm text-zinc-600">
          Entre ou crie uma conta para testar o MVP. Em desenvolvimento, a API cria automaticamente{" "}
          <strong className="text-zinc-800">teste@local.dev</strong> / <strong className="text-zinc-800">teste123</strong> ao
          subir (se ainda não existir).
        </p>

        <div className="mb-4 flex rounded-xl border border-zinc-200 bg-zinc-50 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-lg py-2 text-sm ${mode === "login" ? "bg-accent font-medium text-white shadow-sm" : "text-zinc-500"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-lg py-2 text-sm ${mode === "register" ? "bg-accent font-medium text-white shadow-sm" : "text-zinc-500"}`}
          >
            Cadastro
          </button>
        </div>

        <label className="mb-1 block text-xs font-medium text-zinc-500">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
        />
        <label className="mb-1 block text-xs font-medium text-zinc-500">Senha (mín. 6 no cadastro)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
        />

        {message && <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{message}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-sm hover:bg-accentHover disabled:opacity-50"
        >
          {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
        </button>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Depois do login, configure a Meta em{" "}
          <Link href="/integracoes" className="font-medium text-zinc-800 underline decoration-zinc-400">
            Integrações
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
