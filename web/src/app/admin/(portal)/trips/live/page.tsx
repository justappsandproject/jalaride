import { createClient } from "@/lib/supabase/server";
import { unwrapJoin } from "@/lib/supabase/helpers";

export default async function LiveTripsPage() {
  const supabase = createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select(`
      id, status, category, pickup_address, dropoff_address,
      driver:drivers(current_lat, current_lng, profiles(full_name)),
      rider:riders(profiles(full_name))
    `)
    .in("status", ["driver_assigned", "driver_en_route", "arrived", "in_progress"]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Live Trips</h1>
      <p className="mt-1 text-text-secondary">{trips?.length ?? 0} active trip(s)</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-surface p-6 min-h-[300px]">
          <p className="text-sm text-text-secondary">Map view — requires Google Maps API key</p>
          <div className="mt-4 space-y-2">
            {(trips ?? []).map((t) => {
              const driver = unwrapJoin(t.driver) as {
                current_lat?: number;
                current_lng?: number;
                profiles?: { full_name?: string } | { full_name?: string }[];
              } | null;
              const driverProfile = unwrapJoin(driver?.profiles);
              return (
                <div key={t.id} className="rounded-lg bg-background/50 p-3 text-sm">
                  <span className="capitalize text-accent">{t.category}</span> · {t.status.replace(/_/g, " ")}
                  <p className="text-text-secondary">{driverProfile?.full_name ?? "Unassigned"}</p>
                  {driver?.current_lat && (
                    <p className="text-xs">📍 {driver.current_lat.toFixed(4)}, {driver.current_lng?.toFixed(4)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          {(trips ?? []).map((t) => {
            const rider = unwrapJoin(t.rider) as { profiles?: { full_name?: string } | { full_name?: string }[] } | null;
            const riderProfile = unwrapJoin(rider?.profiles);
            return (
              <div key={t.id} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-semibold capitalize">{t.status.replace(/_/g, " ")}</p>
                <p className="mt-1 text-sm">{t.pickup_address}</p>
                <p className="text-sm text-text-secondary">→ {t.dropoff_address}</p>
                <p className="mt-2 text-xs text-text-secondary">Rider: {riderProfile?.full_name ?? "—"}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
