"use client";

import { useState } from "react";
import { calculateWeeklyRemittance, formatNaira } from "@/lib/finance";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AddVehiclePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    plate_number: "",
    make: "",
    model: "",
    year: "2022",
    color: "",
    category: "economy",
    purchase_price: "10000000",
    annual_rate_percent: "40",
    amortization_years: "4",
  });

  const weekly = calculateWeeklyRemittance(
    Number(form.purchase_price),
    Number(form.annual_rate_percent),
    Number(form.amortization_years),
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("vehicles").insert({
      plate_number: form.plate_number,
      make: form.make,
      model: form.model,
      year: Number(form.year),
      color: form.color,
      category: form.category,
      purchase_price: Number(form.purchase_price),
      annual_rate_percent: Number(form.annual_rate_percent),
      amortization_years: Number(form.amortization_years),
    });
    if (!error) router.push("/admin/fleet");
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">Add Vehicle</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {[
          ["plate_number", "Plate Number *"],
          ["make", "Make *"],
          ["model", "Model *"],
          ["year", "Year *"],
          ["color", "Color *"],
        ].map(([key, label]) => (
          <div key={key}>
            <label className="text-sm text-text-secondary">{label}</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-4 py-2"
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required
            />
          </div>
        ))}
        <div>
          <label className="text-sm text-text-secondary">Category *</label>
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-4 py-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {["economy", "comfort", "xl", "moto"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-text-secondary">Purchase Price (NGN) *</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-4 py-2"
            value={form.purchase_price}
            onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-secondary">Annual Rate (%) *</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-4 py-2"
              value={form.annual_rate_percent}
              onChange={(e) => setForm({ ...form, annual_rate_percent: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Amortization Years *</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-4 py-2"
              value={form.amortization_years}
              onChange={(e) => setForm({ ...form, amortization_years: e.target.value })}
            />
          </div>
        </div>
        <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
          <p className="text-sm text-text-secondary">Weekly Remittance (auto-calculated)</p>
          <p className="text-2xl font-bold text-accent">{formatNaira(weekly)}</p>
          <p className="mt-1 text-xs text-text-secondary">
            ({formatNaira(Number(form.purchase_price))} × {form.annual_rate_percent}% ×{" "}
            {form.amortization_years}) ÷ ({form.amortization_years} × 52)
          </p>
        </div>
        <button type="submit" className="rounded-lg bg-primary px-6 py-3 font-semibold text-white">
          Save Vehicle
        </button>
      </form>
    </div>
  );
}
