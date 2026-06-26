import { createClient } from "@/lib/supabase/server";
import { NinVerifyButton } from "@/components/admin/NinVerifyButton";

export default async function NinVerificationPage() {
  const supabase = createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone, nin, created_at")
    .not("nin", "is", null)
    .eq("nin_verified", false)
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold">Pending NIN Checks</h1>
      <p className="mt-1 text-text-secondary">Users with NIN submitted awaiting NIMC verification</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-surface text-text-secondary">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">NIN</th>
              <th className="p-4">Submitted</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="p-4 font-medium">{p.full_name}</td>
                <td className="p-4">{p.phone}</td>
                <td className="p-4 font-mono">{p.nin}</td>
                <td className="p-4">{new Date(p.created_at).toLocaleDateString("en-NG")}</td>
                <td className="p-4">
                  <NinVerifyButton userId={p.id} nin={p.nin!} name={p.full_name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!profiles?.length && (
          <p className="p-8 text-center text-text-secondary">No pending NIN verifications</p>
        )}
      </div>
    </div>
  );
}
