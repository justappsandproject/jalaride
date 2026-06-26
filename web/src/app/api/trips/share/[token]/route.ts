import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const supabase = createAdminClient();
  const { data: trip } = await supabase
    .from("trips")
    .select(`
      id, status, pickup_address, dropoff_address, estimated_fare, share_token,
      rider:riders!inner(id, profiles!inner(full_name)),
      driver:drivers(id, current_lat, current_lng, rating,
        profiles!inner(full_name, profile_photo_url),
        vehicle:vehicles(make, model, year, color, plate_number)
      )
    `)
    .eq("share_token", params.token)
    .single();

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const driver = trip.driver as {
    profiles?: { full_name?: string; profile_photo_url?: string };
    current_lat?: number;
    current_lng?: number;
    vehicle?: { make?: string; model?: string; year?: number; color?: string; plate_number?: string };
  } | null;

  const rider = trip.rider as { profiles?: { full_name?: string } } | null;

  return NextResponse.json({
    driver_name: driver?.profiles?.full_name ?? "Driver",
    driver_photo: driver?.profiles?.profile_photo_url,
    vehicle: driver?.vehicle
      ? `${driver.vehicle.make} ${driver.vehicle.model} ${driver.vehicle.year}`
      : null,
    plate: driver?.vehicle?.plate_number,
    rider_first_name: rider?.profiles?.full_name?.split(" ")[0] ?? "Rider",
    pickup_address: trip.pickup_address,
    dropoff_address: trip.dropoff_address,
    status: trip.status,
    driver_lat: driver?.current_lat,
    driver_lng: driver?.current_lng,
    eta: null,
  });
}
