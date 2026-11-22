'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Camera, camerasApi } from '@/lib/api';
import { HlsPlayer } from '@/components/HlsPlayer';

type Layout = 1 | 4 | 9;

export default function LivePage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [layout, setLayout] = useState<Layout>(4);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    camerasApi
      .list()
      .then(setCameras)
      .finally(() => setLoading(false));
  }, []);

  const visible = cameras.slice(0, layout);
  const cols =
    layout === 1 ? 'grid-cols-1' : layout === 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold">Live View</h2>
          <p className="text-sm text-slate-400">
            HLS from MediaMTX · WebRTC URL available per camera in API
          </p>
        </div>
        <div className="flex gap-2">
          {([1, 4, 9] as Layout[]).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLayout(n)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm border',
                layout === n
                  ? 'border-accent text-accent'
                  : 'border-slate-600 text-slate-400',
              )}
            >
              {n === 1 ? '1-up' : `${n}-tile`}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <p className="text-slate-500">Loading cameras…</p>
      ) : cameras.length === 0 ? (
        <div className="border border-dashed border-slate-700 rounded-xl p-12 text-center">
          <p className="text-slate-400 mb-4">No cameras configured yet.</p>
          <a href="/cameras" className="btn-primary inline-block">
            Add camera
          </a>
        </div>
      ) : (
        <div
          className={clsx('grid gap-3 auto-rows-fr', cols)}
          style={{ minHeight: layout === 1 ? '70vh' : '75vh' }}
        >
          {visible.map((cam) => (
            <HlsPlayer
              key={cam.id}
              mtxPath={cam.mtxPath}
              label={cam.name}
              className="min-h-[180px] aspect-video"
            />
          ))}
          {visible.length < layout &&
            Array.from({ length: layout - visible.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="border border-slate-800 rounded-lg bg-surface-800 flex items-center justify-center text-slate-600 text-sm"
              >
                Empty slot
              </div>
            ))}
        </div>
      )}
    </div>
  );
}