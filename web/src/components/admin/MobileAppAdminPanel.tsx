"use client";

import { useEffect, useState } from "react";

type Rider = {
  id: string;
  name: string;
  phone: string;
  nin?: string;
  registrationStatus: string;
  totalRides?: number;
};

type Driver = {
  id: string;
  status: string;
  user: { name: string; phone: string; nin?: string; registrationStatus: string };
};

export function MobileAppAdminPanel() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [s, r, d] = await Promise.all([
        fetch("/api/mobile-admin?resource=stats").then((x) => x.json()),
        fetch("/api/mobile-admin?resource=riders").then((x) => x.json()),
        fetch("/api/mobile-admin?resource=drivers").then((x) => x.json()),
      ]);
      setStats(s);
      setRiders(r.riders ?? []);
      setDrivers(d.drivers ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approveDriver(id: string) {
    await fetch("/api/mobile-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve-driver", driverId: id }),
    });
    await load();
  }

  if (loading) return <p className="text-text-secondary">Loading mobile app data…</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Users", stats.users],
          ["Approved riders", stats.riders],
          ["Approved drivers", stats.approvedDrivers],
          ["Pending drivers", stats.pendingDrivers],
        ].map(([label, val]) => (
          <div key={label as string} className="rounded-xl border border-white/10 bg-surface p-4">
            <p className="text-2xl font-bold text-accent">{val ?? 0}</p>
            <p className="text-sm text-text-secondary">{label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Registered riders (mobile app)</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-text-secondary">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">NIN</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.phone}</td>
                  <td className="p-3">{r.nin ?? "—"}</td>
                  <td className="p-3">{r.registrationStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Drivers — approve pending</h2>
        <div className="space-y-3">
          {drivers
            .filter((d) => d.status === "PENDING")
            .map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-surface p-4">
                <div>
                  <p className="font-semibold">{d.user.name}</p>
                  <p className="text-sm text-text-secondary">{d.user.phone} · NIN {d.user.nin ?? "—"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => approveDriver(d.id)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Approve driver
                </button>
              </div>
            ))}
          {drivers.filter((d) => d.status === "PENDING").length === 0 && (
            <p className="text-text-secondary">No pending driver applications.</p>
          )}
        </div>
      </section>
    </div>
  );
}
