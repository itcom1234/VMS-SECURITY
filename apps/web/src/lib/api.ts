'use client';

import { API_URL } from './config';

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR';
};

export type Camera = {
  id: string;
  name: string;
  rtspUrl: string;
  username?: string | null;
  hasPassword: boolean;
  aiEnabled: boolean;
  scoreThreshold: number;
  site?: string | null;
  tags?: string | null;
  mtxPath: string;
  status: 'OFFLINE' | 'STREAMING' | 'ERROR';
  lastScore?: number | null;
  hlsUrl: string;
  webrtcUrl: string;
};

export type Alert = {
  id: string;
  cameraId: string;
  score: number;
  labels: string[];
  snapshotRef?: string | null;
  message?: string | null;
  acknowledged: boolean;
  falsePositive: boolean;
  createdAt: string;
  camera?: { id: string; name: string; mtxPath?: string };
};

const TOKEN_KEY = 'vms_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<User>('/auth/me'),
};

export const camerasApi = {
  list: () => api<Camera[]>('/cameras'),
  get: (id: string) => api<Camera>(`/cameras/${id}`),
  create: (body: Record<string, unknown>) =>
    api<Camera>('/cameras', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    api<Camera>(`/cameras/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    api<{ deleted: boolean }>(`/cameras/${id}`, { method: 'DELETE' }),
};

export const alertsApi = {
  list: (cameraId?: string) =>
    api<Alert[]>(
      `/alerts${cameraId ? `?cameraId=${encodeURIComponent(cameraId)}` : ''}`,
    ),
  get: (id: string) => api<Alert>(`/alerts/${id}`),
  ack: (id: string) =>
    api<Alert>(`/alerts/${id}/ack`, { method: 'PATCH' }),
  falsePositive: (id: string) =>
    api<Alert>(`/alerts/${id}/false-positive`, { method: 'PATCH' }),
};