'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authApi, Camera, camerasApi, User } from '@/lib/api';
import { HlsPlayer } from '@/components/HlsPlayer';

export default function CameraDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [camera, setCamera] = useState<Camera | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    camerasApi.get(id).then(setCamera);
    authApi.me().then(setUser);
  }, [id]);

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (user?.role !== 'ADMIN') return;
    const fd = new FormData(e.currentTarget);
    const updated = await camerasApi.update(id, {
      name: fd.get('name'),
      rtspUrl: fd.get('rtspUrl'),
      username: fd.get('username') || undefined,
      password: fd.get('password') || undefined,
      aiEnabled: fd.get('aiEnabled') === 'on',
      scoreThreshold: Number(fd.get('scoreThreshold')),
    });
    setCamera(updated);
    setMessage('Saved');
  }

  if (!camera) return <p className="p-6 text-slate-500">Loading…</p>;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <button type="button" onClick={() => router.back()} className="text-sm text-slate-400 hover:text-white">
        ← Back
      </button>
      <h2 className="text-xl font-semibold">{camera.name}</h2>
      <HlsPlayer mtxPath={camera.mtxPath} label="Preview" className="aspect-video max-h-[360px]" />
      <form onSubmit={onSave} className="space-y-3 border border-slate-800 rounded-xl p-4 bg-surface-900">
        <input name="name" defaultValue={camera.name} disabled={user?.role !== 'ADMIN'} />
        <input
          name="rtspUrl"
          defaultValue={camera.rtspUrl}
          className="font-mono text-xs"
          disabled={user?.role !== 'ADMIN'}
        />
        <ClientMask camera={camera} readOnly={user?.role !== 'ADMIN'} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="aiEnabled"
            defaultChecked={camera.aiEnabled}
            disabled={user?.role !== 'ADMIN'}
          />
          AI enabled
        </label>
        <input
          name="scoreThreshold"
          type="number"
          step="0.05"
          min="0"
          max="1"
          defaultValue={camera.scoreThreshold}
          disabled={user?.role !== 'ADMIN'}
        />
        {user?.role === 'ADMIN' && (
          <button type="submit" className="btn-primary">
            Update
          </button>
        )}
        {message && <p className="text-accent text-sm">{message}</p>}
      </form>
      <p className="text-xs text-slate-500 font-mono break-all">
        HLS: {camera.hlsUrl} · WebRTC base: {camera.webrtcUrl}
      </p>
    </div>
  );
}

function ClientMask({
  camera,
  readOnly,
}: {
  camera: Camera;
  readOnly: boolean;
}) {
  return (
    <>
      <input
        name="username"
        defaultValue={camera.username ?? ''}
        placeholder="Username"
        disabled={readOnly}
      />
      <input
        name="password"
        type="password"
        placeholder={camera.hasPassword ? '•••••• (leave blank to keep)' : 'Password'}
        autoComplete="new-password"
        disabled={readOnly}
      />
    </>
  );
}