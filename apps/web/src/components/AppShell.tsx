'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import clsx from 'clsx';
import { authApi, clearToken, getToken, User } from '@/lib/api';

const nav = [
  { href: '/live', label: 'Live View' },
  { href: '/cameras', label: 'Cameras' },
  { href: '/alerts', label: 'AI Alerts' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        clearToken();
        router.replace('/login');
      });
  }, [router]);

  function logout() {
    clearToken();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-surface-900 border-r border-slate-800 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-800">
          <div className="text-accent font-mono text-xs tracking-widest">
            VMS // OPS
          </div>
          <h1 className="text-lg font-semibold mt-1">Security Console</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'block px-3 py-2 rounded-md text-sm transition',
                pathname.startsWith(item.href)
                  ? 'bg-surface-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-surface-800',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          {user ? (
            <>
              <div className="text-slate-300">{user.name}</div>
              <div className="font-mono">{user.role}</div>
              <button
                type="button"
                onClick={logout}
                className="mt-2 text-accent hover:underline"
              >
                Sign out
              </button>
            </>
          ) : (
            <span>Loading…</span>
          )}
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}