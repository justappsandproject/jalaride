import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { user_id, title, body, data } = await req.json();
    if (!user_id || !title || !body) {
      return NextResponse.json({ error: "user_id, title, body required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("expo_push_token")
      .eq("id", user_id)
      .single();

    if (profile?.expo_push_token) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: profile.expo_push_token,
          title,
          body,
          data: data ?? {},
        }),
      });
    }

    await supabase.from("notifications").insert({
      user_id,
      title,
      body,
      type: data?.type ?? "general",
      data: data ?? {},
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed" },
      { status: 500 },
    );
  }
}
