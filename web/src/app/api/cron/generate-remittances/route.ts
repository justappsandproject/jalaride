import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unwrapJoin } from "@/lib/supabase/helpers";

function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    week_start: monday.toISOString().split("T")[0],
    week_end: sunday.toISOString().split("T")[0],
  };
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { week_start, week_end } = getWeekBounds();

  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, vehicle_id, vehicles!inner(weekly_remittance)")
    .eq("account_status", "active")
    .not("vehicle_id", "is", null);

  let generated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const driver of drivers ?? []) {
    const { data: existing } = await supabase
      .from("remittances")
      .select("id")
      .eq("driver_id", driver.id)
      .eq("week_start", week_start)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const vehicle = unwrapJoin(driver.vehicles) as { weekly_remittance: number } | null;
    if (!vehicle) {
      errors.push(`${driver.id}: no vehicle`);
      continue;
    }
    const { error } = await supabase.from("remittances").insert({
      driver_id: driver.id,
      vehicle_id: driver.vehicle_id,
      week_start,
      week_end,
      amount_due: vehicle.weekly_remittance,
      payment_status: "pending",
    });

    if (error) {
      errors.push(`${driver.id}: ${error.message}`);
    } else {
      generated++;
    }
  }

  const prevWeek = new Date();
  prevWeek.setDate(prevWeek.getDate() - 7);
  const { week_start: prev_start } = getWeekBounds(prevWeek);
  await supabase
    .from("remittances")
    .update({ payment_status: "overdue" })
    .eq("week_start", prev_start)
    .in("payment_status", ["pending", "partial"]);

  return NextResponse.json({ generated, skipped, errors });
}
