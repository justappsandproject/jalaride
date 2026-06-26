"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";

type DriverRow = {
  id: string;
  status: string;
  user?: { name?: string; phone?: string };
};

export default function DriversPage() {
  const [rows, setRows] = useState<DriverRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = (await api.admin.pendingDrivers()) as DriverRow[];
      setRows(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load drivers");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(id: string) {
    await api.admin.approveDriver(id);
    await load();
  }

  async function reject(id: string) {
    await api.admin.rejectDriver(id);
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Driver onboarding</h1>
      <p className="mt-2 text-sm text-slate-400">
        Review pending drivers, documents, and background checks before approval.
      </p>
      {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}
      <div className="mt-8 space-y-4">
        {(rows ?? []).map((d) => (
          <div
            key={d.id}
            className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{d.user?.name ?? "Driver"}</p>
              <p className="text-sm text-slate-400">{d.user?.phone}</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">{d.id}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => approve(d.id)}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => reject(d.id)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {rows && rows.length === 0 ? (
          <p className="text-sm text-slate-500">No drivers awaiting approval.</p>
        ) : null}
      </div>
    </div>
  );
}
