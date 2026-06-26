import { createClient } from "@/lib/supabase/server";
import { unwrapJoin } from "@/lib/supabase/helpers";
import { ClearanceActions } from "@/components/admin/ClearanceActions";

export default async function DssClearancePage() {
  const supabase = createClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select(`id, dss_clearance_status, dss_clearance_date, profiles!inner(full_name, phone)`)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">DSS Clearance</h1>
      <p className="mt-1 text-text-secondary">Review and update DSS security clearance status</p>
      <div className="mt-6 space-y-3">
        {(drivers ?? []).map((d) => {
          const profile = unwrapJoin(d.profiles) as { full_name: string; phone: string } | null;
          return (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-surface p-4">
              <div>
                <p className="font-semibold">{profile?.full_name}</p>
                <p className="text-sm text-text-secondary">{profile?.phone}</p>
                <p className="mt-1 text-sm capitalize">
                  Status: <span className="text-accent">{d.dss_clearance_status}</span>
                  {d.dss_clearance_date && (
                    <span className="text-text-secondary"> · {new Date(d.dss_clearance_date).toLocaleDateString()}</span>
                  )}
                </p>
              </div>
              <ClearanceActions driverId={d.id} type="dss" currentStatus={d.dss_clearance_status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
