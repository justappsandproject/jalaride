import { createClient } from "@/lib/supabase/server";
import { unwrapJoin } from "@/lib/supabase/helpers";
import { formatNaira } from "@/lib/finance";

export default async function TripHistoryPage() {
  const supabase = createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select(`
      id, status, category, pickup_address, dropoff_address,
      actual_fare, distance_km, created_at,
      driver:drivers(profiles(full_name)),
      rider:riders(profiles(full_name))
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold">Trip History</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-surface text-text-secondary">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Rider</th>
              <th className="p-4">Driver</th>
              <th className="p-4">Category</th>
              <th className="p-4">From → To</th>
              <th className="p-4">Fare</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {(trips ?? []).map((t) => {
              const riderJoin = unwrapJoin(t.rider) as { profiles?: unknown } | null;
              const rider = unwrapJoin(riderJoin?.profiles) as { full_name?: string } | null;
              const driverJoin = unwrapJoin(t.driver) as { profiles?: unknown } | null;
              const driver = unwrapJoin(driverJoin?.profiles) as { full_name?: string } | null;
              return (
                <tr key={t.id} className="border-b border-white/5">
                  <td className="p-4 font-mono text-xs">{t.id.slice(0, 8)}…</td>
                  <td className="p-4">{rider?.full_name ?? "—"}</td>
                  <td className="p-4">{driver?.full_name ?? "—"}</td>
                  <td className="p-4 capitalize">{t.category}</td>
                  <td className="p-4 max-w-xs truncate">{t.pickup_address} → {t.dropoff_address}</td>
                  <td className="p-4">{t.actual_fare ? formatNaira(Number(t.actual_fare)) : "—"}</td>
                  <td className="p-4 capitalize">{t.status}</td>
                  <td className="p-4">{new Date(t.created_at).toLocaleDateString("en-NG")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
