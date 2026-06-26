import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { amount, email, trip_id, remittance_id, type } = await req.json();
    if (!amount || !email || !type) {
      return NextResponse.json({ error: "amount, email, type required" }, { status: 400 });
    }

    const reference = `jala_${Date.now()}`;
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        email,
        reference,
        metadata: { trip_id, remittance_id, type },
      }),
    });

    const data = await res.json();
    if (!data.status) {
      return NextResponse.json({ error: data.message ?? "Paystack error" }, { status: 400 });
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Payment init failed" },
      { status: 500 },
    );
  }
}
