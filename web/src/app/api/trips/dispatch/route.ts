import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { trip_id } = await req.json();
    if (!trip_id) {
      return NextResponse.json({ error: "trip_id required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: trip } = await supabase
      .from("trips")
      .select("*")
      .eq("id", trip_id)
      .single();

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const { data: drivers } = await supabase
      .from("drivers")
      .select("id, current_lat, current_lng, vehicle_id")
      .eq("online_status", true)
      .eq("account_status", "active")
      .not("current_lat", "is", null);

    if (!drivers?.length) {
      return NextResponse.json({ error: "No drivers available" }, { status: 404 });
    }

    const sorted = drivers
      .map((d) => ({
        ...d,
        dist:
          Math.pow((d.current_lat ?? 0) - trip.pickup_lat, 2) +
          Math.pow((d.current_lng ?? 0) - trip.pickup_lng, 2),
      }))
      .sort((a, b) => a.dist - b.dist);

    for (const driver of sorted) {
      await supabase
        .from("trips")
        .update({ driver_id: driver.id, vehicle_id: driver.vehicle_id, status: "driver_assigned" })
        .eq("id", trip_id);

      return NextResponse.json({
        dispatched: true,
        driver_id: driver.id,
        timeout_seconds: 15,
        channel: `driver:${driver.id}`,
      });
    }

    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Dispatch failed" },
      { status: 500 },
    );
  }
}
