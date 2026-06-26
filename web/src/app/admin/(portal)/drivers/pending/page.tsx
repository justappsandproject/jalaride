import { createClient } from "@/lib/supabase/server";
import { unwrapJoin } from "@/lib/supabase/helpers";
import Link from "next/link";

export default async function PendingDriversPage() {
  const supabase = createClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select(`
      id, account_status, created_at,
      profiles!inner(full_name, phone, nin_verified)
    `)
    .eq("account_status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold">Pending Verification</h1>
      <p className="mt-1 text-text-secondary">Drivers awaiting NIN, DSS, Police clearance and document review</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-surface text-text-secondary">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">NIN</th>
              <th className="p-4">Registered</th>
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
              return (
                <tr key={d.id} className="border-b border-white/5">
                  <td className="p-4 font-medium">{profile?.full_name ?? "—"}</td>
                  <td className="p-4">{profile?.phone ?? "—"}</td>
                  <td className="p-4">{profile?.nin_verified ? "✅ Verified" : "⚠ Pending"}</td>
                  <td className="p-4">{new Date(d.created_at).toLocaleDateString("en-NG")}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link href={`/admin/drivers/${d.id}`} className="text-accent hover:underline">
                        View Docs
                      </Link>
                      {!profile?.nin_verified && (
                        <Link href="/admin/nin" className="text-primary hover:underline">
                          Approve NIN
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!drivers?.length && (
          <p className="p-8 text-center text-text-secondary">No pending drivers</p>
        )}
      </div>
    </div>
  );
}
