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

**Host autostart (systemd):** [`docs/ops-autostart.md`](docs/ops-autostart.md)

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

### Via ONVIF (recommended on LAN)

1. Sign in as Admin → **Cameras** → **Add camera** → **Add via ONVIF**.
2. Enter camera **IP**, **ONVIF port** (default `80`), **username**, **password** → **Discover**.
3. Pick a media profile (main stream is pre-selected when possible) → name → **Save**.
4. API stores the resolved **RTSP URL**, encrypts credentials, and provisions MediaMTX path `cam-<id>`.

**API (same as UI):**

```bash
TOKEN=$(curl -sS -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@vms.local","password":"admin123"}' | jq -r .accessToken)

curl -sS -X POST http://localhost:3001/cameras/onvif/discover \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"host":"192.168.1.50","port":80,"username":"admin","password":"your-pass"}' | jq

curl -sS -X POST http://localhost:3001/cameras/onvif/add \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"host":"192.168.1.50","username":"admin","password":"your-pass","name":"Front door"}' | jq
```

**Testing without hardware:** [ONVIF Device Manager](https://sourceforge.net/projects/onvifdm/) or a camera simulator that exposes `http://<ip>/onvif/device_service` with media profiles. Ensure the API container/host can reach the camera IP (same VLAN or port-forward). Wrong credentials return **401** with a clear message.

**Unit test (profile picker / error mapping):** `cd apps/api && npm run test:onvif-util`

### Manual RTSP

1. **Cameras** → **Add camera** → **Manual RTSP**.
2. Paste **RTSP URL** and optional stream credentials.
3. Save — MediaMTX path is provisioned as above.

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
| `ONVIF_TIMEOUT_MS` | Optional ONVIF SOAP timeout in ms (default `15000`) |

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
| ONVIF discovery (IP + credentials) | ✅ |
| Recording / playback | 🔶 Phase 1 |
| User management UI | 🔶 Settings stub |

ONNX pipeline: see [`docs/ai-worker-contract.md`](docs/ai-worker-contract.md).

## License

TBD — add before production deploy.