"use client";

import { useState } from "react";

type Props = { userId: string; nin: string; name: string };

export function NinVerifyButton({ userId, nin, name }: Props) {
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    const res = await fetch("/api/nimc/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nin, user_id: userId }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  if (result) {
    return (
      <div className="text-xs">
        <p className="text-success">✓ {result.name}</p>
        <p className="text-text-secondary">DOB: {result.dob}</p>
      </div>
    );
  }

  return (
    <button
      onClick={verify}
      disabled={loading}
      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white"
    >
      {loading ? "Verifying…" : "Verify via NIMC"}
    </button>
  );
}
