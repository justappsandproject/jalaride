import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ error: "reference required" }, { status: 400 });
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await res.json();

    if (!data.status || data.data.status !== "success") {
      return NextResponse.json({ success: false, error: "Payment not verified" }, { status: 400 });
    }

    const { amount, metadata } = data.data;
    const paidAmount = amount / 100;
    const supabase = createAdminClient();

    if (metadata?.type === "remittance" && metadata?.remittance_id) {
      await supabase
        .from("remittances")
        .update({
          amount_paid: paidAmount,
          payment_status: "paid",
          paystack_reference: reference,
          paid_at: new Date().toISOString(),
        })
        .eq("id", metadata.remittance_id);
    } else if (metadata?.type === "trip" && metadata?.trip_id) {
      await supabase
        .from("trips")
        .update({ payment_status: "paid", paystack_reference: reference })
        .eq("id", metadata.trip_id);
    }

    return NextResponse.json({ success: true, amount: paidAmount, type: metadata?.type });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 500 },
    );
  }
}
