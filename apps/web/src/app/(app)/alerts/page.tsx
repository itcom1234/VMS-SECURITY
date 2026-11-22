'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert, alertsApi } from '@/lib/api';
import { subscribeAlerts } from '@/lib/alert-stream';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    alertsApi.list().then(setAlerts);

    return subscribeAlerts((alert) => {
      setAlerts((prev) => [alert, ...prev]);
      setLiveCount((c) => c + 1);
    });
  }, []);

  return (
    <div className="p-6 max-w-4xl">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">AI Alerts</h2>
          <p className="text-sm text-slate-400">
            Real-time via SSE (+ Socket.IO on API) · stub worker until ONNX
          </p>
        </div>
        {liveCount > 0 && (
          <span className="text-xs bg-accent-alert/20 text-accent-alert px-2 py-1 rounded">
            +{liveCount} new this session
          </span>
        )}
      </header>
      <ul className="space-y-2">
        {alerts.length === 0 && (
          <li className="text-slate-500 border border-dashed border-slate-700 rounded-lg p-8 text-center">
            No alerts yet. Enable AI on a camera and run the worker service.
          </li>
        )}
        {alerts.map((a) => (
          <li key={a.id}>
            <Link
              href={`/alerts/${a.id}`}
              className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-surface-900 hover:border-slate-600"
            >
              <div>
                <ScoreBadge score={a.score} />
                <div className="text-sm text-slate-300">
                  {a.camera?.name ?? a.cameraId}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {new Date(a.createdAt).toLocaleString()} ·{' '}
                  {a.labels.join(', ') || 'anomaly'}
                </div>
              </div>
              <StatusPill acknowledged={a.acknowledged} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <span
      className={`font-mono text-lg ${score >= 0.8 ? 'text-accent-alert' : 'text-accent-warn'}`}
    >
      {pct}%
    </span>
  );
}

function StatusPill({ acknowledged }: { acknowledged: boolean }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded ${
        acknowledged ? 'bg-slate-800 text-slate-400' : 'bg-accent/20 text-accent'
      }`}
    >
      {acknowledged ? 'Acked' : 'New'}
    </span>
  );
}