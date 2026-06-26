import { createClient } from "@/lib/supabase/server";
import { unwrapJoin } from "@/lib/supabase/helpers";

export default async function AuditLogPage() {
  const supabase = createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select(`
      id, action, target_table, target_id, old_data, new_data, ip_address, created_at,
      admin:profiles!audit_logs_admin_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold">Audit Log</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-surface text-text-secondary">
            <tr>
              <th className="p-4">Admin</th>
              <th className="p-4">Action</th>
              <th className="p-4">Target</th>
              <th className="p-4">IP</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log) => {
              const admin = unwrapJoin(log.admin) as { full_name?: string } | null;
              return (
                <tr key={log.id} className="border-b border-white/5">
                  <td className="p-4">{admin?.full_name ?? "—"}</td>
                  <td className="p-4 font-mono text-xs">{log.action}</td>
                  <td className="p-4 text-text-secondary">
                    {log.target_table} {log.target_id?.slice(0, 8)}
                  </td>
                  <td className="p-4 text-xs">{log.ip_address ?? "—"}</td>
                  <td className="p-4">{new Date(log.created_at).toLocaleString("en-NG")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
