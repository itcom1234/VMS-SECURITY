# VMS Security

**Architecture (one line):** Browser **Next.js** console → **NestJS** control plane (PostgreSQL, Redis, Socket.IO) → **MediaMTX** RTSP/HLS/WebRTC ingest → **Python AI worker** (stub today; ONNX next).

Self-hosted CCTV VMS with per-camera RTSP, live multi-tile view, and AI anomaly alerts.

## Quick start (Docker Compose)

```bash
cp .env.example .env   # edit secrets for production
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web UI | http://localhost:3000 |
| API | http://localhost:3001/health |
| MediaMTX HLS | http://localhost:8888 |
| AI worker | http://localhost:8000/health |

**Seed logins** (dev only): `admin@vms.local` / `admin123` (Admin), `operator@vms.local` / `operator123` (Operator).

**Troubleshooting:** Login or API errors in the browser? Use either `http://localhost:3000` or `http://127.0.0.1:3000` (both work); the UI calls `/api/*` on the same host. After changing `API_INTERNAL_URL` or `CORS_ORIGIN`, rebuild: `docker compose up --build web api`.

## Dev without Docker

Prerequisites: Node 20+, PostgreSQL 16, Redis 7, [MediaMTX](https://github.com/bluenviron/mediamtx) binary.

```bash
# Infrastructure
docker compose up postgres redis mediamtx -d   # or run locals yourself

cp .env.example .env
# Point DATABASE_URL, REDIS_URL, MTX_API_URL at localhost

cd apps/api && npm install && npx prisma migrate deploy && npx tsx prisma/seed.ts && npm run dev
cd apps/web && npm install && npm run dev

# Optional stub AI worker
cd services/ai-worker && pip install -e . && uvicorn app.main:app --reload --port 8000
```

Web: http://localhost:3000 · API: http://localhost:3001

## Adding a camera

1. Sign in as Admin → **Cameras** → **Add camera**.
2. Set **RTSP URL** (and credentials in the form — never commit real secrets).
3. API provisions MediaMTX path `cam-<id>` and returns HLS/WebRTC URLs.

**Demo RTSP (no secrets):**  
`rtsp://wowzaec2demo.streamlock.net/vlc/mp4:BigBuckBunny_115k.mp4`

If a tile shows “Stream unavailable”, confirm MediaMTX is running and the camera URL is reachable from the MediaMTX container/host.

## Environment variables

See [`.env.example`](.env.example). Important:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL |
| `REDIS_URL` | Queues / future BullMQ |
| `JWT_SECRET` | API auth |
| `ENCRYPTION_KEY` | 32-char key for RTSP password encryption at rest |
| `WORKER_API_KEY` | Shared secret for AI worker → API |
| `NEXT_PUBLIC_*` | Browser API + MediaMTX public URLs |

## Repo layout

```
apps/web          Next.js operator UI
apps/api          NestJS REST + WebSocket
services/ai-worker  FastAPI stub scorer
infra/mediamtx    Base MediaMTX config (dynamic paths via :9997 API)
docs/             AI worker contract
```

## Stub vs complete (MVP)

| Area | Status |
|------|--------|
| Monorepo + Compose | ✅ |
| Auth (JWT, Admin/Operator) | ✅ |
| Camera CRUD + MediaMTX provision API | ✅ |
| Live grid (HLS via hls.js) | ✅ |
| AI alerts + WebSocket push | ✅ |
| AI inference (ONNX/YOLO) | 🔶 Stub random scores |
| ONVIF discovery | 🔶 Phase 1 |
| Recording / playback | 🔶 Phase 1 |
| User management UI | 🔶 Settings stub |

ONNX pipeline: see [`docs/ai-worker-contract.md`](docs/ai-worker-contract.md).

## License

TBD — add before production deploy.