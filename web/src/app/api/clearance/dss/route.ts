import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function handleClearance(
  req: NextRequest,
  field: "dss_clearance_status" | "police_clearance_status",
  dateField: "dss_clearance_date" | "police_clearance_date",
  docField: "dss_clearance_doc_url" | "police_clearance_doc_url",
) {
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
    [field]: status,
    [dateField]: new Date().toISOString(),
  };
  if (doc_url) update[docField] = doc_url;

  const { data: driver } = await supabase
    .from("drivers")
    .update(update)
    .eq("id", driver_id)
    .select("id")
    .single();

  await supabase.from("notifications").insert({
    user_id: driver_id,
    title: `Clearance ${status}`,
    body: notes ?? `Your clearance status is now: ${status}`,
    type: "clearance",
    data: { status, field },
  });

  await supabase.from("audit_logs").insert({
    admin_id: driver_id,
    action: `${field}_webhook`,
    target_table: "drivers",
    target_id: driver_id,
    new_data: { status, notes },
    ip_address: req.headers.get("x-forwarded-for") ?? "webhook",
  });

  return NextResponse.json({ success: true, driver });
}

export async function POST(req: NextRequest) {
  return handleClearance(req, "dss_clearance_status", "dss_clearance_date", "dss_clearance_doc_url");
}
