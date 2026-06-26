"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/finance";

type Props = {
  driver: Record<string, unknown>;
  profile: Record<string, unknown>;
  vehicle: Record<string, unknown> | null;
  documents: { id: string; doc_type: string; file_url: string; verified: boolean; rejection_reason: string | null }[];
  trips: { id: string; status: string; pickup_address: string; dropoff_address: string; actual_fare: number | null; created_at: string }[];
  remittances: { week_start: string; amount_due: number; amount_paid: number; payment_status: string }[];
};

export function DriverDetailPanel({ driver, profile, vehicle, documents, trips, remittances }: Props) {
  const [accountStatus, setAccountStatus] = useState(driver.account_status as string);
  const [docs, setDocs] = useState(documents);
  const [activating, setActivating] = useState(false);

  const canActivate =
    profile.nin_verified &&
    driver.dss_clearance_status === "approved" &&
    driver.police_clearance_status === "approved" &&
    docs.length > 0 &&
    docs.every((d) => d.verified);

  async function toggleDoc(docId: string, verified: boolean) {
    const supabase = createClient();
    await supabase.from("driver_documents").update({ verified }).eq("id", docId);
    setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, verified } : d)));
  }

  async function activateAccount() {
    if (!canActivate) return;
    setActivating(true);
    const supabase = createClient();
    await supabase.from("drivers").update({ account_status: "active" }).eq("id", driver.id as string);
    await supabase.from("profiles").update({ is_active: true }).eq("id", driver.id as string);
    setAccountStatus("active");
    setActivating(false);
  }

  return (
    <div>
      <Link href="/admin/drivers" className="text-sm text-accent hover:underline">← All Drivers</Link>
      <h1 className="mt-4 text-2xl font-bold">{profile.full_name as string}</h1>
      <p className="text-text-secondary">{profile.phone as string} · NIN: {profile.nin_verified ? "✅" : "⚠"}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-surface p-6">
          <h2 className="font-semibold">Clearance</h2>
          <p className="mt-2 text-sm">DSS: {driver.dss_clearance_status as string}</p>
          <p className="text-sm">Police: {driver.police_clearance_status as string}</p>
          <p className="mt-2 text-sm">Account: <span className="capitalize text-accent">{accountStatus}</span></p>
          <button
            disabled={!canActivate || accountStatus === "active" || activating}
            onClick={activateAccount}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {activating ? "Activating…" : "Activate Account"}
          </button>
          {!canActivate && (
            <p className="mt-2 text-xs text-text-secondary">
              Requires NIN verified + both clearances approved + all documents verified
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-surface p-6">
          <h2 className="font-semibold">Vehicle</h2>
          {vehicle ? (
            <p className="mt-2">
              {vehicle.make as string} {vehicle.model as string} · {vehicle.plate_number as string}
            </p>
          ) : (
            <p className="mt-2 text-text-secondary">No vehicle assigned</p>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-surface p-6">
        <h2 className="font-semibold">Documents</h2>
        <div className="mt-4 space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg bg-background/50 p-3">
              <span className="capitalize">{d.doc_type.replace(/_/g, " ")}</span>
              <div className="flex gap-2">
                <button onClick={() => toggleDoc(d.id, true)} className="text-xs text-success">Approve</button>
                <button onClick={() => toggleDoc(d.id, false)} className="text-xs text-error">Reject</button>
                <span>{d.verified ? "✅" : "⏳"}</span>
              </div>
            </div>
          ))}
          {!docs.length && <p className="text-text-secondary">No documents uploaded</p>}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-surface p-6">
        <h2 className="font-semibold">Recent Trips</h2>
        <div className="mt-4 space-y-2 text-sm">
          {trips.map((t) => (
            <div key={t.id} className="flex justify-between border-b border-white/5 py-2">
              <span>{t.pickup_address} → {t.dropoff_address}</span>
              <span className="text-text-secondary">{t.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-surface p-6">
        <h2 className="font-semibold">Remittance History</h2>
        <div className="mt-4 space-y-2 text-sm">
          {remittances.map((r) => (
            <div key={r.week_start} className="flex justify-between py-2">
              <span>Week {r.week_start}</span>
              <span>{formatNaira(Number(r.amount_paid))} / {formatNaira(Number(r.amount_due))}</span>
              <span className="capitalize text-accent">{r.payment_status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
