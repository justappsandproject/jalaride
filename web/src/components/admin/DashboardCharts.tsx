"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#1B6B3A", "#D4A017", "#38A169", "#132036"];

type Props = {
  dailyTrips: { date: string; count: number }[];
  remittanceWeeks: { week: string; due: number; paid: number }[];
  categoryBreakdown: { name: string; value: number }[];
};

export function DashboardCharts({ dailyTrips, remittanceWeeks, categoryBreakdown }: Props) {
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-surface p-6">
        <h2 className="mb-4 font-semibold">Daily Trips (30 days)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailyTrips}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" tick={{ fill: "#A0AEC0", fontSize: 10 }} />
            <YAxis tick={{ fill: "#A0AEC0", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#132036", border: "none" }} />
            <Line type="monotone" dataKey="count" stroke="#1B6B3A" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl border border-white/10 bg-surface p-6">
        <h2 className="mb-4 font-semibold">Remittance Collection</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={remittanceWeeks}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="week" tick={{ fill: "#A0AEC0", fontSize: 10 }} />
            <YAxis tick={{ fill: "#A0AEC0", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#132036", border: "none" }} />
            <Bar dataKey="due" fill="#D4A017" name="Due" />
            <Bar dataKey="paid" fill="#1B6B3A" name="Paid" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl border border-white/10 bg-surface p-6 lg:col-span-2">
        <h2 className="mb-4 font-semibold">Trip Category Breakdown</h2>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {categoryBreakdown.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#132036", border: "none" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
