import { createClient } from "@/lib/supabase/server";
import { unwrapJoin } from "@/lib/supabase/helpers";
import { formatNaira } from "@/lib/finance";
import { MarkPaidButton } from "@/components/admin/MarkPaidButton";

export default async function FinancePage() {
  const supabase = createClient();
  const { data: remittances } = await supabase
    .from("remittances")
    .select(`
      id, week_start, week_end, amount_due, amount_paid, payment_status, paid_at,
      driver:drivers(profiles(full_name)),
      vehicle:vehicles(plate_number)
    `)
    .order("week_start", { ascending: false })
    .limit(50);

  const totalDue = remittances?.reduce((s, r) => s + Number(r.amount_due), 0) ?? 0;
  const totalPaid = remittances?.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0) ?? 0;
  const collectionRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  const statusColor: Record<string, string> = {
    pending: "bg-gray-500/20 text-gray-300",
    paid: "bg-success/20 text-success",
    partial: "bg-accent/20 text-accent",
    overdue: "bg-error/20 text-error",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Finance — Remittances</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-surface p-4">
          <p className="text-sm text-text-secondary">Total Due</p>
          <p className="text-xl font-bold">{formatNaira(totalDue)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface p-4">
          <p className="text-sm text-text-secondary">Collected</p>
          <p className="text-xl font-bold text-success">{formatNaira(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface p-4">
          <p className="text-sm text-text-secondary">Collection Rate</p>
          <p className="text-xl font-bold">{collectionRate}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface p-4">
          <p className="text-sm text-text-secondary">Outstanding</p>
          <p className="text-xl font-bold text-error">{formatNaira(totalDue - totalPaid)}</p>
        </div>
      </div>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-surface text-text-secondary">
            <tr>
              <th className="p-4">Driver</th>
              <th className="p-4">Vehicle</th>
              <th className="p-4">Week</th>
              <th className="p-4">Due</th>
              <th className="p-4">Paid</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(remittances ?? []).map((r) => {
              const driver = unwrapJoin(r.driver) as { profiles?: { full_name?: string } | { full_name?: string }[] } | null;
              const driverProfile = unwrapJoin(driver?.profiles);
              const vehicle = unwrapJoin(r.vehicle) as { plate_number?: string } | null;
              return (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="p-4">{driverProfile?.full_name ?? "—"}</td>
                  <td className="p-4 font-mono">{vehicle?.plate_number ?? "—"}</td>
                  <td className="p-4">
                    {r.week_start} — {r.week_end}
                  </td>
                  <td className="p-4">{formatNaira(Number(r.amount_due))}</td>
                  <td className="p-4">{formatNaira(Number(r.amount_paid ?? 0))}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${statusColor[r.payment_status] ?? ""}`}
                    >
                      {r.payment_status}
                    </span>
                  </td>
                  <td className="p-4">
                    {r.payment_status !== "paid" && (
                      <MarkPaidButton remittanceId={r.id} amountDue={Number(r.amount_due)} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
