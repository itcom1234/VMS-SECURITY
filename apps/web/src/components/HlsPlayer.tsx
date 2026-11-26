'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { MTX_HLS_URL } from '@/lib/config';

type Props = {
  mtxPath: string;
  label: string;
  className?: string;
};

export function HlsPlayer({ mtxPath, label, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const src = `${MTX_HLS_URL.replace(/\/$/, '')}/${mtxPath}/index.m3u8`;
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({ lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError(
            'Stream unavailable — confirm RTSP URL and MediaMTX path (see README).',
          );
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      setError('HLS not supported in this browser');
    }

    return () => {
      hls?.destroy();
    };
  }, [mtxPath]);

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden border border-slate-800 ${className ?? ''}`}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 flex justify-between items-end text-xs">
        <span className="font-medium truncate">{label}</span>
        {error ? (
          <span className="text-accent-warn max-w-[50%] text-right">
            {error}
          </span>
        ) : (
          <span className="text-accent font-mono">LIVE</span>
        )}
      </div>
    </div>
  );
}