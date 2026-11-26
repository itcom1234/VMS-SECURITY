'use client';

import { API_URL } from './config';
import { getToken } from './api';
import type { Alert } from './api';

export function subscribeAlerts(onAlert: (alert: Alert) => void): () => void {
  const token = getToken();
  if (!token) return () => undefined;

  const es = new EventSource(
    `${API_URL}/alerts/stream?token=${encodeURIComponent(token)}`,
  );

  es.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data) as Alert & { type?: string };
      if (data.type === 'ping') return;
      onAlert(data as Alert);
    } catch {
      /* ignore */
    }
  };

  return () => es.close();
}