'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await authApi.login(
        String(fd.get('email')),
        String(fd.get('password')),
      );
      setToken(res.accessToken);
      router.push('/live');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-6">
      <div className="w-full max-w-md bg-surface-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="text-accent font-mono text-xs tracking-widest mb-2">
          VMS SECURITY
        </div>
        <h1 className="text-2xl font-semibold mb-6">Operator sign-in</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Email</label>
            <input name="email" type="email" required defaultValue="admin@vms.local" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Password</label>
            <input name="password" type="password" required defaultValue="admin123" />
          </div>
          {error && <p className="text-accent-alert text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Enter console'}
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-6">
          Dev seeds: <span className="font-mono">admin@vms.local</span> /{' '}
          <span className="font-mono">admin123</span> · Operator:{' '}
          <span className="font-mono">operator@vms.local</span>
        </p>
      </div>
    </div>
  );
}