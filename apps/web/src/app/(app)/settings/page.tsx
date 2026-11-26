'use client';

import { useEffect, useState } from 'react';
import { authApi, User } from '@/lib/api';
import { API_URL } from '@/lib/config';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    authApi.me().then(setUser);
  }, []);

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-slate-400">MVP stubs — expand in Phase 1</p>
      </div>

      <section className="border border-slate-800 rounded-xl p-4 bg-surface-900">
        <h3 className="font-medium mb-3">Profile</h3>
        {user && (
          <dl className="text-sm space-y-2">
            <SettingRow label="Name" value={user.name} />
            <SettingRow label="Email" value={user.email} />
            <SettingRow label="Role" value={user.role} />
          </dl>
        )}
        <p className="text-xs text-slate-500 mt-3">Password change UI — coming soon.</p>
      </section>

      {user?.role === 'ADMIN' && (
        <section className="border border-slate-800 rounded-xl p-4 bg-surface-900">
          <h3 className="font-medium mb-2">Users &amp; roles</h3>
          <p className="text-sm text-slate-400">
            Admin can manage cameras today. User CRUD API planned for Phase 1.
          </p>
        </section>
      )}

      <section className="border border-slate-800 rounded-xl p-4 bg-surface-900">
        <h3 className="font-medium mb-2">System health</h3>
        <ul className="text-sm font-mono text-slate-400 space-y-1">
          <li>API: {API_URL}</li>
          <li>MediaMTX HLS: check /live tiles</li>
          <li>AI worker: stub scorer (see services/ai-worker)</li>
        </ul>
      </section>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}