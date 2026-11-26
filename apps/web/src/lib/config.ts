/** Browser calls same-origin `/api/*` (Next rewrites to the Nest API). */
export const API_URL =
  typeof window !== 'undefined'
    ? '/api'
    : (process.env.API_INTERNAL_URL ??
        process.env.NEXT_PUBLIC_API_URL ??
        'http://127.0.0.1:3001');

export const MTX_HLS_URL =
  process.env.NEXT_PUBLIC_MTX_HLS_URL ?? 'http://localhost:8888';