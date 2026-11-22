'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Camera, camerasApi, getToken, User, authApi } from '@/lib/api';

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function reload() {
    setCameras(await camerasApi.list());
  }

  useEffect(() => {
    if (!getToken()) return;
    reload();
    authApi.me().then(setUser);
  }, []);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await camerasApi.create({
        name: fd.get('name'),
        rtspUrl: fd.get('rtspUrl'),
        username: fd.get('username') || undefined,
        password: fd.get('password') || undefined,
        aiEnabled: fd.get('aiEnabled') === 'on',
        scoreThreshold: Number(fd.get('scoreThreshold')),
        site: fd.get('site') || undefined,
      });
      setShowForm(false);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed');
    }
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="p-6 max-w-5xl">
      <header className="flex justify-between items-center mb-6">
        <PageTitle />
        {isAdmin && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Cancel' : 'Add camera'}
          </button>
        )}
      </header>

      {showForm && isAdmin && (
        <form
          onSubmit={onCreate}
          className="mb-8 p-4 border border-slate-800 rounded-xl bg-surface-900 space-y-3"
        >
          <h3 className="font-medium">New camera (manual RTSP)</h3>
          <GridTwo>
            <input name="name" placeholder="Display name" required />
            <input name="site" placeholder="Site (optional)" />
          </GridTwo>
          <input
            name="rtspUrl"
            placeholder="rtsp://host/path"
            required
            className="font-mono text-xs"
          />
          <GridTwo>
            <input name="username" placeholder="RTSP username (optional)" />
            <input
              name="password"
              type="password"
              placeholder="RTSP password (optional)"
              autoComplete="new-password"
            />
          </GridTwo>
          <GridTwo>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="aiEnabled" defaultChecked />
              AI enabled
            </label>
            <label className="text-sm">
              Threshold (0–1){' '}
              <input
                name="scoreThreshold"
                type="number"
                step="0.05"
                min="0"
                max="1"
                defaultValue={0.65}
                className="w-24 inline-block ml-2"
              />
            </label>
          </GridTwo>
          {formError && <p className="text-accent-alert text-sm">{formError}</p>}
          <button type="submit" className="btn-primary">
            Save & provision MediaMTX path
          </button>
        </form>
      )}

      <CameraTable cameras={cameras} isAdmin={isAdmin} onDelete={async (id) => {
        if (!confirm('Delete this camera?')) return;
        await camerasApi.remove(id);
        reload();
      }} />
    </div>
  );
}

function PageTitle() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Cameras</h2>
      <p className="text-sm text-slate-400">Manual ONVIF/RTSP ingest per device</p>
    </div>
  );
}

function GridTwo({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-3">{children}</div>;
}

function CameraTable({
  cameras,
  isAdmin,
  onDelete,
}: {
  cameras: Camera[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  if (!cameras.length) {
    return (
      <p className="text-slate-500 border border-dashed border-slate-700 rounded-lg p-8 text-center">
        No cameras — add one with a public demo RTSP or your LAN URL (credentials via
        form only, never committed).
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-surface-800 text-slate-400 text-left">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Status</th>
            <th className="p-3">AI</th>
            <th className="p-3">Last score</th>
            <th className="p-3">Path</th>
            {isAdmin && <th className="p-3" />}
          </tr>
        </thead>
        <tbody>
          {cameras.map((c) => (
            <tr key={c.id} className="border-t border-slate-800">
              <td className="p-3">
                <Link href={`/cameras/${c.id}`} className="text-accent hover:underline">
                  {c.name}
                </Link>
              </td>
              <td className="p-3 font-mono text-xs">{c.status}</td>
              <td className="p-3">{c.aiEnabled ? 'On' : 'Off'}</td>
              <td className="p-3">
                {c.lastScore != null ? c.lastScore.toFixed(2) : '—'}
              </td>
              <td className="p-3 font-mono text-xs text-slate-500">{c.mtxPath}</td>
              {isAdmin && (
                <td className="p-3 text-right">
                  <button
                    type="button"
                    className="text-accent-alert text-xs hover:underline"
                    onClick={() => onDelete(c.id)}
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}