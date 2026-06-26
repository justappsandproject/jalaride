import { createClient } from "@/lib/supabase/server";
import { unwrapJoin } from "@/lib/supabase/helpers";
import { VehicleAssignForm } from "@/components/admin/VehicleAssignForm";

export default async function AssignVehiclePage() {
  const supabase = createClient();
  const [{ data: vehicles }, { data: drivers }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, plate_number, make, model, status")
      .eq("status", "available"),
    supabase
      .from("drivers")
      .select("id, profiles!inner(full_name)")
      .eq("account_status", "active")
      .is("vehicle_id", null),
  ]);

  const driverOptions = (drivers ?? []).map((d) => {
    const p = unwrapJoin(d.profiles) as { full_name: string } | null;
    return { id: d.id, name: p?.full_name ?? "Driver" };
  });

  const vehicleOptions = (vehicles ?? []).map((v) => ({
    id: v.id,
    label: `${v.plate_number} — ${v.make} ${v.model}`,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold">Assign Vehicles</h1>
      <p className="mt-1 text-text-secondary">Assign available fleet vehicles to active drivers</p>
      <VehicleAssignForm vehicles={vehicleOptions} drivers={driverOptions} />
    </div>
  );
}
