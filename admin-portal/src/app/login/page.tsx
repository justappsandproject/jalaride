"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+10000000000");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.login({ phone, password });
      if (res.user.role !== "ADMIN") {
        setError("This portal is for administrators only.");
        return;
      }
      window.localStorage.setItem("jala_ride_admin_token", res.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight">Jala Ride Admin</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in with an admin account. Seed user: <code className="text-emerald-300">+10000000000</code> /{" "}
          <code className="text-emerald-300">admin123</code>
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm text-slate-300">
            Phone
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500/60"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500/60"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
