import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SANDBOX_NIN = {
  success: true,
  name: "ADEYEMI JAMES OKONKWO",
  dob: "1990-05-15",
  photo_url: "https://via.placeholder.com/150",
  gender: "M",
};

export async function POST(req: NextRequest) {
  try {
    const { nin, user_id } = await req.json();
    if (!nin || !user_id) {
      return NextResponse.json({ error: "nin and user_id required" }, { status: 400 });
    }
    if (!/^\d{11}$/.test(nin)) {
      return NextResponse.json({ error: "NIN must be 11 digits" }, { status: 400 });
    }

    const supabase = createAdminClient();
    let result = SANDBOX_NIN;

    if (process.env.NIMC_API_KEY !== "sandbox") {
      const res = await fetch(`${process.env.NIMC_BASE_URL}/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NIMC_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nin }),
      });
      result = await res.json();
    }

    await supabase
      .from("profiles")
      .update({ nin, nin_verified: true, nin_verified_at: new Date().toISOString() })
      .eq("id", user_id);

    await supabase.from("audit_logs").insert({
      admin_id: user_id,
      action: "nin_verify",
      target_table: "profiles",
      target_id: user_id,
      new_data: { nin, verified: true },
      ip_address: req.headers.get("x-forwarded-for") ?? "unknown",
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 500 },
    );
  }
}
