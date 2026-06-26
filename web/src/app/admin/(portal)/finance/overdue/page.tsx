import { createClient } from "@/lib/supabase/server";
import { unwrapJoin } from "@/lib/supabase/helpers";
import { formatNaira } from "@/lib/finance";
import { MarkPaidButton } from "@/components/admin/MarkPaidButton";

export default async function OverduePaymentsPage() {
  const supabase = createClient();
  const { data: remittances } = await supabase
    .from("remittances")
    .select(`
      id, week_start, amount_due, amount_paid, payment_status,
      driver:drivers(profiles(full_name)),
      vehicle:vehicles(plate_number)
    `)
    .eq("payment_status", "overdue")
    .order("week_start", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold">Overdue Payments</h1>
      <p className="mt-1 text-text-secondary">{remittances?.length ?? 0} overdue remittance(s)</p>
      <div className="mt-6 space-y-3">
        {(remittances ?? []).map((r) => {
          const driver = unwrapJoin(r.driver) as { profiles?: { full_name?: string } | { full_name?: string }[] } | null;
          const driverProfile = unwrapJoin(driver?.profiles);
          const vehicle = unwrapJoin(r.vehicle) as { plate_number?: string } | null;
          return (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-error/30 bg-error/5 p-4">
              <div>
                <p className="font-semibold">{driverProfile?.full_name ?? "—"}</p>
                <p className="text-sm text-text-secondary">
                  {vehicle?.plate_number} · Week {r.week_start}
                </p>
                <p className="mt-1 font-bold text-error">
                  Due: {formatNaira(Number(r.amount_due))}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg border border-white/20 px-3 py-1.5 text-sm">
                  Send Reminder
                </button>
                <MarkPaidButton
                  remittanceId={r.id}
                  amountDue={Number(r.amount_due)}
                />
              </div>
            </div>
          );
        })}
        {!remittances?.length && (
          <p className="text-center text-text-secondary">No overdue payments 🎉</p>
        )}
      </div>
    </div>
  );
}
