import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("X-Jala-Admin-Secret");
  if (secret !== process.env.JALA_ADMIN_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { driver_id, status, notes, doc_url } = await req.json();
  if (!driver_id || !["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    police_clearance_status: status,
    police_clearance_date: new Date().toISOString(),
  };
  if (doc_url) update.police_clearance_doc_url = doc_url;

  const { data: driver } = await supabase
    .from("drivers")
    .update(update)
    .eq("id", driver_id)
    .select("id")
    .single();

  await supabase.from("notifications").insert({
    user_id: driver_id,
    title: `Police clearance ${status}`,
    body: notes ?? `Your police clearance status is now: ${status}`,
    type: "clearance",
    data: { status },
  });

  await supabase.from("audit_logs").insert({
    admin_id: driver_id,
    action: "police_clearance_webhook",
    target_table: "drivers",
    target_id: driver_id,
    new_data: { status, notes },
    ip_address: req.headers.get("x-forwarded-for") ?? "webhook",
  });

  return NextResponse.json({ success: true, driver });
}
