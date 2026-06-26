"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  ClipboardList,
  CreditCard,
  FileCheck,
  LayoutDashboard,
  MapPin,
  Settings,
  Shield,
  Users,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  {
    label: "Drivers",
    icon: Users,
    children: [
      { href: "/admin/drivers", label: "All Drivers" },
      { href: "/admin/drivers/pending", label: "Pending Verification" },
      { href: "/admin/drivers/dss", label: "DSS Clearance" },
      { href: "/admin/drivers/police", label: "Police Clearance" },
    ],
  },
  {
    label: "Riders",
    icon: Users,
    children: [{ href: "/admin/riders", label: "All Riders" }],
  },
  {
    label: "Fleet",
    icon: Car,
    children: [
      { href: "/admin/fleet", label: "Vehicles" },
      { href: "/admin/fleet/assign", label: "Assign Vehicles" },
    ],
  },
  {
    label: "Finance",
    icon: CreditCard,
    children: [
      { href: "/admin/finance", label: "Remittances" },
      { href: "/admin/finance/overdue", label: "Overdue Payments" },
    ],
  },
  {
    label: "Trips",
    icon: MapPin,
    children: [
      { href: "/admin/trips/live", label: "Live Trips" },
      { href: "/admin/trips", label: "Trip History" },
    ],
  },
  { href: "/admin/nin", label: "NIN Verification", icon: FileCheck },
  { href: "/admin/settings/audit", label: "Audit Log", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-surface">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-accent">
          JR
        </div>
        <div>
          <p className="font-bold">Jala Ride</p>
          <p className="text-xs text-text-secondary">Admin Portal</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {nav.map((item) => {
          if ("children" in item && item.children) {
            return (
              <div key={item.label} className="mb-4">
                <p className="mb-1 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </p>
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      pathname === child.href
                        ? "bg-primary/20 text-accent"
                        : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                    }`}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            );
          }
          const href = item.href!;
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                active
                  ? "bg-primary/20 text-accent"
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Shield className="h-4 w-4 text-success" />
          Secured admin session
        </div>
      </div>
    </aside>
  );
}
