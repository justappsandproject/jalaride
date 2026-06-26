"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

export default function LiveRidesPage() {
  const [rides, setRides] = useState<unknown[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.admin.liveRides();
        if (!cancelled) setRides(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load rides");
      }
    }
    load();
    const t = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Live rides</h1>
      <p className="mt-2 text-sm text-slate-400">Active and requested trips across the network.</p>
      {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}
      <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Rider</th>
              <th className="px-4 py-3 font-medium">Driver</th>
            </tr>
          </thead>
          <tbody>
            {(rides ?? []).map((r) => {
              const row = r as {
                id: string;
                status: string;
                rider?: { name?: string };
                driver?: { user?: { name?: string } } | null;
              };
              return (
                <tr key={row.id} className="border-t border-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{row.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{row.rider?.name ?? "—"}</td>
                  <td className="px-4 py-3">{row.driver?.user?.name ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rides && rides.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No active rides right now.</p>
        ) : null}
      </div>
    </div>
  );
}
