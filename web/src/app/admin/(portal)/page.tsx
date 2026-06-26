import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/finance";
import { DashboardCharts } from "@/components/admin/DashboardCharts";

export default async function AdminDashboard() {
  const supabase = createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { count: activeDrivers },
    { count: activeRiders },
    { count: tripsToday },
    { count: overdueCount },
    { count: pendingVerifications },
    { data: remittances },
    { data: recentTrips },
    { data: allTrips },
  ] = await Promise.all([
    supabase.from("drivers").select("*", { count: "exact", head: true }).eq("account_status", "active"),
    supabase.from("riders").select("*", { count: "exact", head: true }),
    supabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date().toISOString().split("T")[0]),
    supabase.from("remittances").select("*", { count: "exact", head: true }).eq("payment_status", "overdue"),
    supabase.from("drivers").select("*", { count: "exact", head: true }).eq("account_status", "pending"),
    supabase.from("remittances").select("amount_due, amount_paid, week_start"),
    supabase
      .from("trips")
      .select("id, category, created_at, status")
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("trips").select("category").gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const revenueThisWeek =
    remittances?.reduce((sum, r) => sum + Number(r.amount_paid ?? 0), 0) ?? 0;

  const kpis = [
    { label: "Active Drivers", value: activeDrivers ?? 0 },
    { label: "Active Riders", value: activeRiders ?? 0 },
    { label: "Trips Today", value: tripsToday ?? 0 },
    { label: "Revenue This Week", value: formatNaira(revenueThisWeek) },
    { label: "Overdue Remittances", value: overdueCount ?? 0, alert: true },
    { label: "Pending Verifications", value: pendingVerifications ?? 0 },
  ];

  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().split("T")[0], 0);
  }
  (recentTrips ?? []).forEach((t) => {
    const day = t.created_at.split("T")[0];
    if (dailyMap.has(day)) dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  });
  const dailyTrips = Array.from(dailyMap.entries()).map(([date, count]) => ({
    date: date.slice(5),
    count,
  }));

  const remittanceWeeks = (remittances ?? []).slice(0, 8).map((r) => ({
    week: String(r.week_start).slice(5),
    due: Number(r.amount_due),
    paid: Number(r.amount_paid ?? 0),
  }));

  const catCounts: Record<string, number> = {};
  (allTrips ?? []).forEach((t) => {
    catCounts[t.category] = (catCounts[t.category] ?? 0) + 1;
  });
  const categoryBreakdown = Object.entries(catCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const completed = (recentTrips ?? []).filter((t) => t.status === "completed").slice(0, 10);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>
      <p className="mt-1 text-text-secondary">Jala Ride platform at a glance</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-2xl border p-6 ${
              kpi.alert ? "border-error/30 bg-error/5" : "border-white/10 bg-surface"
            }`}
          >
            <p className="text-sm text-text-secondary">{kpi.label}</p>
            <p className="mt-2 text-3xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <DashboardCharts
        dailyTrips={dailyTrips}
        remittanceWeeks={remittanceWeeks}
        categoryBreakdown={categoryBreakdown.length ? categoryBreakdown : [{ name: "Economy", value: 1 }]}
      />

      <div className="mt-8 rounded-2xl border border-white/10 bg-surface p-6">
        <h2 className="font-semibold">Recent Completions</h2>
        <div className="mt-4 space-y-2 text-sm">
          {completed.map((t) => (
            <div key={t.id} className="flex justify-between border-b border-white/5 py-2">
              <span className="capitalize">{t.category}</span>
              <span className="text-text-secondary">{new Date(t.created_at).toLocaleString("en-NG")}</span>
            </div>
          ))}
          {!completed.length && <p className="text-text-secondary">No completed trips yet</p>}
        </div>
      </div>
    </div>
  );
}
