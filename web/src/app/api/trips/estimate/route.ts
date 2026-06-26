import { NextRequest, NextResponse } from "next/server";
import { FARE_RATES, calculateSurgeMultiplier, type TripCategory } from "@/lib/finance";

export async function POST(req: NextRequest) {
  try {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, category } = await req.json();
    if (!pickup_lat || !pickup_lng || !dropoff_lat || !dropoff_lng || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rates = FARE_RATES[category as TripCategory];
    if (!rates) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    let distance_km = 5;
    let duration_minutes = 15;

    if (process.env.GOOGLE_MAPS_SERVER_KEY) {
      const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
      url.searchParams.set("origins", `${pickup_lat},${pickup_lng}`);
      url.searchParams.set("destinations", `${dropoff_lat},${dropoff_lng}`);
      url.searchParams.set("key", process.env.GOOGLE_MAPS_SERVER_KEY);
      const res = await fetch(url.toString());
      const data = await res.json();
      const el = data.rows?.[0]?.elements?.[0];
      if (el?.status === "OK") {
        distance_km = el.distance.value / 1000;
        duration_minutes = Math.ceil(el.duration.value / 60);
      }
    } else {
      const dlat = dropoff_lat - pickup_lat;
      const dlng = dropoff_lng - pickup_lng;
      distance_km = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
      duration_minutes = Math.ceil(distance_km * 3);
    }

    const surge_multiplier = calculateSurgeMultiplier(pickup_lat, pickup_lng);
    const base_fare = rates.base + distance_km * rates.perKm;
    const estimated_fare = Math.round(base_fare * surge_multiplier);

    return NextResponse.json({
      distance_km: Math.round(distance_km * 100) / 100,
      duration_minutes,
      estimated_fare,
      surge_multiplier,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Estimate failed" },
      { status: 500 },
    );
  }
}
