'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Alert, alertsApi } from '@/lib/api';

export default function AlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [alert, setAlert] = useState<Alert | null>(null);

  useEffect(() => {
    alertsApi.get(id).then(setAlert);
  }, [id]);

  async function ack() {
    const updated = await alertsApi.ack(id);
    setAlert(updated as Alert);
  }

  async function fp() {
    const updated = await alertsApi.falsePositive(id);
    setAlert(updated as Alert);
  }

  if (!alert) return <p className="p-6">Loading…</p>;

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <button type="button" onClick={() => router.back()} className="text-sm text-slate-400">
        ← Feed
      </button>
      <h2 className="text-xl font-semibold">Alert detail</h2>
      <dl className="grid grid-cols-2 gap-3 text-sm border border-slate-800 rounded-xl p-4 bg-surface-900">
        <dt className="text-slate-500">Camera</dt>
        <dd>{alert.camera?.name ?? alert.cameraId}</dd>
        <dt className="text-slate-500">Score</dt>
        <dd className="font-mono">{(alert.score * 100).toFixed(1)}%</dd>
        <dt className="text-slate-500">Labels</dt>
        <dd>{alert.labels.join(', ') || '—'}</dd>
        <dt className="text-slate-500">Time</dt>
        <dd>{new Date(alert.createdAt).toLocaleString()}</dd>
        <dt className="text-slate-500">Message</dt>
        <dd>{alert.message ?? '—'}</dd>
      </dl>
      {alert.snapshotRef && (
        <p className="text-xs font-mono text-slate-500">
          Snapshot ref: {alert.snapshotRef}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" className="btn-primary" onClick={ack} disabled={alert.acknowledged}>
          Acknowledge
        </button>
        <button type="button" className="btn-ghost" onClick={fp}>
          Mark false positive
        </button>
      </div>
    </div>
  );
}