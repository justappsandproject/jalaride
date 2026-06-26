import { createClient } from "@/lib/supabase/server";
import { unwrapJoin } from "@/lib/supabase/helpers";
import { formatNaira } from "@/lib/finance";
import Link from "next/link";

export default async function DriversPage() {
  const supabase = createClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select(`
      id, account_status, dss_clearance_status, police_clearance_status,
      profiles!inner(full_name, phone, nin_verified, profile_photo_url),
      vehicles(plate_number, make, model)
    `)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">All Drivers</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-surface text-text-secondary">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">NIN</th>
              <th className="p-4">DSS</th>
              <th className="p-4">Police</th>
              <th className="p-4">Status</th>
              <th className="p-4">Vehicle</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(drivers ?? []).map((d) => {
              const profile = unwrapJoin(d.profiles) as {
                full_name: string;
                phone: string;
                nin_verified: boolean;
              } | null;
              const vehicle = unwrapJoin(d.vehicles) as { plate_number?: string } | null;
              return (
                <tr key={d.id} className="border-b border-white/5">
                  <td className="p-4 font-medium">{profile?.full_name ?? "—"}</td>
                  <td className="p-4">{profile?.phone ?? "—"}</td>
                  <td className="p-4">{profile?.nin_verified ? "✅" : "⚠"}</td>
                  <td className="p-4">{d.dss_clearance_status}</td>
                  <td className="p-4">{d.police_clearance_status}</td>
                  <td className="p-4">{d.account_status}</td>
                  <td className="p-4">{vehicle?.plate_number ?? "—"}</td>
                  <td className="p-4">
                    <Link href={`/admin/drivers/${d.id}`} className="text-accent hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
