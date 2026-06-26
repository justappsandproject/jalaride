"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  driverId: string;
  type: "dss" | "police";
  currentStatus: string;
};

export function ClearanceActions({ driverId, type, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function update(newStatus: "approved" | "rejected" | "pending") {
    setLoading(true);
    const supabase = createClient();
    const field = type === "dss" ? "dss_clearance_status" : "police_clearance_status";
    const dateField = type === "dss" ? "dss_clearance_date" : "police_clearance_date";
    await supabase
      .from("drivers")
      .update({ [field]: newStatus, [dateField]: new Date().toISOString() })
      .eq("id", driverId);
    setStatus(newStatus);
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      {(["pending", "approved", "rejected"] as const).map((s) => (
        <button
          key={s}
          disabled={loading}
          onClick={() => update(s)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
            status === s ? "bg-primary text-white" : "bg-white/10 text-text-secondary hover:bg-white/20"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
