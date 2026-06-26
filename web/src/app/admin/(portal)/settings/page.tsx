export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Platform Settings</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-surface p-6">
          <h2 className="font-semibold">Admin Users</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Manage admin accounts via Supabase Auth. Set role to admin or superadmin in the profiles table.
          </p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-surface p-6">
          <h2 className="font-semibold">Platform Config</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Commission rate</dt>
              <dd>12%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Default annual rate</dt>
              <dd>40%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Default amortization</dt>
              <dd>4 years</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Dispatch timeout</dt>
              <dd>15 seconds</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
