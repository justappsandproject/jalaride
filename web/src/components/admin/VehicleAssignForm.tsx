"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  vehicles: { id: string; label: string }[];
  drivers: { id: string; name: string }[];
};

export function VehicleAssignForm({ vehicles, drivers }: Props) {
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [msg, setMsg] = useState("");

  async function assign() {
    if (!vehicleId || !driverId) return;
    const supabase = createClient();
    await supabase.from("drivers").update({ vehicle_id: vehicleId }).eq("id", driverId);
    await supabase.from("vehicles").update({ assigned_driver_id: driverId, status: "assigned" }).eq("id", vehicleId);
    setMsg("Vehicle assigned successfully");
  }

  return (
    <div className="mt-8 max-w-md space-y-4 rounded-2xl border border-white/10 bg-surface p-6">
      <div>
        <label className="text-sm text-text-secondary">Vehicle</label>
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-background px-4 py-2"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm text-text-secondary">Driver</label>
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-background px-4 py-2"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
        >
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <button onClick={assign} className="w-full rounded-lg bg-primary py-3 font-semibold text-white">
        Assign Vehicle
      </button>
      {msg && <p className="text-sm text-success">{msg}</p>}
    </div>
  );
}
