'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Camera,
  OnvifDiscoverResult,
  camerasApi,
  getToken,
  User,
  authApi,
} from '@/lib/api';

type AddMode = 'manual' | 'onvif';

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('onvif');

  async function reload() {
    setCameras(await camerasApi.list());
  }

  useEffect(() => {
    if (!getToken()) return;
    reload();
    authApi.me().then(setUser);
  }, []);

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
        <div className="mb-8 p-4 border border-slate-800 rounded-xl bg-surface-900 space-y-4">
          <div className="flex gap-2">
            <ModeTab
              active={addMode === 'onvif'}
              onClick={() => setAddMode('onvif')}
            >
              Add via ONVIF
            </ModeTab>
            <ModeTab
              active={addMode === 'manual'}
              onClick={() => setAddMode('manual')}
            >
              Manual RTSP
            </ModeTab>
          </div>
          {addMode === 'onvif' ? (
            <OnvifAddForm
              onSaved={async () => {
                setShowForm(false);
                await reload();
              }}
            />
          ) : (
            <ManualRtspForm
              onSaved={async () => {
                setShowForm(false);
                await reload();
              }}
            />
          )}
        </div>
      )}

      <CameraTable
        cameras={cameras}
        isAdmin={isAdmin}
        onDelete={async (id) => {
          if (!confirm('Delete this camera?')) return;
          await camerasApi.remove(id);
          reload();
        }}
      />
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm px-3 py-1.5 rounded-lg border ${
        active
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-slate-700 text-slate-400 hover:border-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

function OnvifAddForm({ onSaved }: { onSaved: () => void }) {
  const [discovering, setDiscovering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnvifDiscoverResult | null>(null);
  const [profileToken, setProfileToken] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('80');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function onDiscover(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setDiscovering(true);
    try {
      const portNum = port.trim() ? Number(port) : 80;
      const data = await camerasApi.onvifDiscover({
        host: host.trim(),
        port: portNum,
        username: username.trim(),
        password,
      });
      setResult(data);
      setProfileToken(
        data.suggestedProfileToken ?? data.profiles[0]?.token ?? '',
      );
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setDiscovering(false);
    }
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!result) {
      setError('Discover the camera first.');
      return;
    }
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const portNum = port.trim() ? Number(port) : 80;
      await camerasApi.onvifAdd({
        host: host.trim(),
        port: portNum,
        username: username.trim(),
        password,
        name: fd.get('name'),
        profileToken: profileToken || undefined,
        site: fd.get('site') || host.trim(),
        aiEnabled: fd.get('aiEnabled') === 'on',
        scoreThreshold: Number(fd.get('scoreThreshold')),
      });
      await onSaved();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  const selectedProfile = result?.profiles.find((p) => p.token === profileToken);
  const previewRtsp =
    selectedProfile?.rtspUrl ?? result?.suggestedRtspUrl ?? '';

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Enter the camera IP and ONVIF credentials. The API probes ONVIF, lists
        media profiles, and saves the chosen RTSP URL (brand-agnostic).
      </p>
      <form onSubmit={onDiscover} className="space-y-3">
        <GridTwo>
          <input
            name="host"
            placeholder="Camera IP or hostname"
            required
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
          <input
            name="port"
            placeholder="ONVIF port (default 80)"
            type="number"
            min={1}
            max={65535}
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </GridTwo>
        <GridTwo>
          <input
            name="username"
            placeholder="ONVIF username"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            name="password"
            type="password"
            placeholder="ONVIF password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </GridTwo>
        <button type="submit" className="btn-primary" disabled={discovering}>
          {discovering ? 'Discovering…' : 'Discover'}
        </button>
      </form>

      {result && (
        <div className="border border-slate-800 rounded-lg p-3 space-y-3 text-sm">
          <p className="text-slate-300 font-medium">Device</p>
          <dl className="grid sm:grid-cols-2 gap-2 text-slate-400 font-mono text-xs">
            <div>
              <dt className="text-slate-500">Manufacturer</dt>
              <dd>{result.device.manufacturer ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Model</dt>
              <dd>{result.device.model ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Firmware</dt>
              <dd>{result.device.firmwareVersion ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Serial</dt>
              <dd>{result.device.serialNumber ?? '—'}</dd>
            </div>
          </dl>

          <label className="block text-slate-300">
            Media profile
            <select
              className="mt-1 w-full"
              value={profileToken}
              onChange={(e) => setProfileToken(e.target.value)}
            >
              {result.profiles.map((p) => (
                <option key={p.token} value={p.token}>
                  {p.name}
                  {p.videoWidth ? ` (${p.videoWidth}px)` : ''}
                  {!p.rtspUrl ? ' — no RTSP' : ''}
                </option>
              ))}
            </select>
          </label>

          {previewRtsp ? (
            <p className="font-mono text-xs text-slate-500 break-all">
              RTSP: {previewRtsp}
            </p>
          ) : (
            <p className="text-accent-alert text-xs">
              No RTSP URL for this profile — try another profile or use manual
              RTSP.
            </p>
          )}
        </div>
      )}

      {result && (
        <form onSubmit={onSave} className="space-y-3 border-t border-slate-800 pt-4">
          <GridTwo>
            <input name="name" placeholder="Display name" required />
            <input name="site" placeholder="Site (optional)" defaultValue={host} />
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
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !profileToken}
          >
            {saving ? 'Saving…' : 'Save & provision MediaMTX path'}
          </button>
        </form>
      )}

      {error && <p className="text-accent-alert text-sm">{error}</p>}
    </div>
  );
}

function ManualRtspForm({ onSaved }: { onSaved: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);

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
      await onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <form onSubmit={onCreate} className="space-y-3">
      <h3 className="font-medium text-sm">New camera (manual RTSP)</h3>
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
  );
}

function parseApiError(err: unknown): string {
  if (!(err instanceof Error)) return 'Request failed';
  const raw = err.message;
  try {
    const json = JSON.parse(raw) as { message?: string | string[] };
    if (Array.isArray(json.message)) return json.message.join(', ');
    if (json.message) return json.message;
  } catch {
    /* plain text */
  }
  return raw || 'Request failed';
}

function PageTitle() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Cameras</h2>
      <p className="text-sm text-slate-400">
        ONVIF discovery or manual RTSP ingest
      </p>
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
        No cameras — add one via ONVIF (IP + credentials) or paste an RTSP URL.
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
                <Link
                  href={`/cameras/${c.id}`}
                  className="text-accent hover:underline"
                >
                  {c.name}
                </Link>
              </td>
              <td className="p-3 font-mono text-xs">{c.status}</td>
              <td className="p-3">{c.aiEnabled ? 'On' : 'Off'}</td>
              <td className="p-3">
                {c.lastScore != null ? c.lastScore.toFixed(2) : '—'}
              </td>
              <td className="p-3 font-mono text-xs text-slate-500">
                {c.mtxPath}
              </td>
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
