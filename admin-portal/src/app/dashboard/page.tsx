"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

export default function DashboardOverview() {
  const [stats, setStats] = useState<{ users: number; approvedDrivers: number; ridesToday: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api.admin.stats();
        if (!cancelled) setStats(s);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load stats");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Operations overview</h1>
      <p className="mt-2 text-sm text-slate-400">
        Real-time fleet and ride monitoring, onboarding, pricing rules, and fraud tooling — Phase 1
        focuses on auth, rides, and driver approvals.
      </p>
      {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}
      {stats ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Stat title="Registered users" value={stats.users} />
          <Stat title="Approved drivers" value={stats.approvedDrivers} />
          <Stat title="Rides today" value={stats.ridesToday} />
        </div>
      ) : !error ? (
        <p className="mt-8 text-sm text-slate-500">Loading metrics…</p>
      ) : null}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
