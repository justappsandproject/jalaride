import { createClient } from "@/lib/supabase/server";
import { unwrapJoin } from "@/lib/supabase/helpers";
import { notFound } from "next/navigation";
import { DriverDetailPanel } from "@/components/admin/DriverDetailPanel";

export default async function DriverDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: driver } = await supabase
    .from("drivers")
    .select(`
      id, account_status, dss_clearance_status, police_clearance_status,
      license_number, license_expiry, rating, total_trips, vehicle_id,
      profiles!inner(id, full_name, phone, email, nin, nin_verified, profile_photo_url),
      vehicles(plate_number, make, model, year),
      driver_documents(id, doc_type, file_url, verified, rejection_reason)
    `)
    .eq("id", params.id)
    .single();

  if (!driver) notFound();

  const profile = unwrapJoin(driver.profiles)!;
  const vehicle = unwrapJoin(driver.vehicles);
  const docs = (driver.driver_documents ?? []) as {
    id: string;
    doc_type: string;
    file_url: string;
    verified: boolean;
    rejection_reason: string | null;
  }[];

  const { data: trips } = await supabase
    .from("trips")
    .select("id, status, pickup_address, dropoff_address, actual_fare, created_at")
    .eq("driver_id", params.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: remittances } = await supabase
    .from("remittances")
    .select("week_start, amount_due, amount_paid, payment_status")
    .eq("driver_id", params.id)
    .order("week_start", { ascending: false })
    .limit(8);

  return (
    <DriverDetailPanel
      driver={driver}
      profile={profile as Record<string, unknown>}
      vehicle={vehicle as Record<string, unknown> | null}
      documents={docs}
      trips={trips ?? []}
      remittances={remittances ?? []}
    />
  );
}
