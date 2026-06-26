import { createClient } from "@/lib/supabase/server";
import { unwrapJoin } from "@/lib/supabase/helpers";
import { formatNaira } from "@/lib/finance";

export default async function FleetPage() {
  const supabase = createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select(`
      id, plate_number, make, model, year, category,
      purchase_price, annual_rate_percent, amortization_years, weekly_remittance, status,
      assigned_driver:drivers(profiles(full_name))
    `)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fleet Management</h1>
        <a
          href="/admin/fleet/add"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Add Vehicle
        </a>
      </div>
      <p className="mt-1 text-sm text-text-secondary">
        Weekly remittance = (price × rate% × years) ÷ (years × 52)
      </p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-surface text-text-secondary">
            <tr>
              <th className="p-4">Plate</th>
              <th className="p-4">Make/Model</th>
              <th className="p-4">Category</th>
              <th className="p-4">Purchase Price</th>
              <th className="p-4">Weekly Remittance</th>
              <th className="p-4">Driver</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {(vehicles ?? []).map((v) => {
              const driver = unwrapJoin(v.assigned_driver) as {
                profiles?: { full_name?: string } | { full_name?: string }[];
              } | null;
              const driverProfile = unwrapJoin(driver?.profiles);
              return (
                <tr key={v.id} className="border-b border-white/5">
                  <td className="p-4 font-mono font-bold">{v.plate_number}</td>
                  <td className="p-4">
                    {v.make} {v.model} {v.year}
                  </td>
                  <td className="p-4 capitalize">{v.category}</td>
                  <td className="p-4">{formatNaira(Number(v.purchase_price))}</td>
                  <td className="p-4 font-semibold text-accent">
                    {formatNaira(Number(v.weekly_remittance))}
                  </td>
                  <td className="p-4">{driverProfile?.full_name ?? "—"}</td>
                  <td className="p-4">{v.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}