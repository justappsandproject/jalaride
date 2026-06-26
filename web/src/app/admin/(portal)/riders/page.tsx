import { createClient } from "@/lib/supabase/server";
import { unwrapJoin } from "@/lib/supabase/helpers";

export default async function RidersPage() {
  const supabase = createClient();
  const { data: riders } = await supabase
    .from("riders")
    .select(`
      id, total_rides, loyalty_points, created_at,
      profiles!inner(full_name, phone, nin_verified, is_active, profile_photo_url)
    `)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">All Riders</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-surface text-text-secondary">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">NIN</th>
              <th className="p-4">Total Rides</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {(riders ?? []).map((r) => {
              const profile = unwrapJoin(r.profiles) as {
                full_name: string;
                phone: string;
                nin_verified: boolean;
                is_active: boolean;
              } | null;
              return (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="p-4 font-medium">{profile?.full_name ?? "—"}</td>
                  <td className="p-4">{profile?.phone ?? "—"}</td>
                  <td className="p-4">{profile?.nin_verified ? "✅" : "⚠"}</td>
                  <td className="p-4">{r.total_rides}</td>
                  <td className="p-4">{new Date(r.created_at).toLocaleDateString("en-NG")}</td>
                  <td className="p-4">{profile?.is_active ? "Active" : "Inactive"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
