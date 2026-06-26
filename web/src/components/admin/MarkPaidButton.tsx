"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = { remittanceId: string; amountDue: number };

export function MarkPaidButton({ remittanceId, amountDue }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(amountDue));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function confirm() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("remittances").update({
      amount_paid: Number(amount),
      payment_status: Number(amount) >= amountDue ? "paid" : "partial",
      paystack_reference: reference || null,
      paid_at: new Date().toISOString(),
      notes: notes || null,
    }).eq("id", remittanceId);
    if (user) {
      await supabase.from("audit_logs").insert({
        admin_id: user.id,
        action: "mark_remittance_paid",
        target_table: "remittances",
        target_id: remittanceId,
        new_data: { amount_paid: Number(amount), reference, notes },
      });
    }
    setSaving(false);
    setOpen(false);
    window.location.reload();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white"
      >
        Mark as Paid
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6">
        <h3 className="text-lg font-bold">Mark as Paid</h3>
        <label className="mt-4 block text-sm text-text-secondary">Amount paid (NGN)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-background px-4 py-2"
        />
        <label className="mt-3 block text-sm text-text-secondary">Paystack reference (optional)</label>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-background px-4 py-2"
        />
        <label className="mt-3 block text-sm text-text-secondary">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-background px-4 py-2"
          rows={2}
        />
        <div className="mt-6 flex gap-3">
          <button onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-white/20 py-2">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={saving}
            className="flex-1 rounded-lg bg-primary py-2 font-semibold text-white"
          >
            {saving ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
