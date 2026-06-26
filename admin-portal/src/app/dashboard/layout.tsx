"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredToken } from "@/lib/client";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/rides", label: "Live rides" },
  { href: "/dashboard/drivers", label: "Driver onboarding" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  function logout() {
    window.localStorage.removeItem("jala_ride_admin_token");
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400 text-sm">
        Checking session…
      </div>
    );
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-white/10 md:w-56 md:border-b-0 md:border-r md:min-h-screen p-4 flex flex-col gap-6">
        <div className="text-lg font-semibold">Jala Ride</div>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm ${
                pathname === l.href ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="mt-auto text-left text-sm text-slate-500 hover:text-white"
        >
          Log out
        </button>
      </aside>
      <div className="flex-1 p-6 md:p-10">{children}</div>
    </div>
  );
}
