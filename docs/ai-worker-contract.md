# AI worker API contract

## Control plane (NestJS)

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /worker/cameras` | Header `X-Worker-Key` | List cameras with `aiEnabled: true` |
| `POST /worker/alerts` | Header `X-Worker-Key` | Ingest score; suppressed if below `scoreThreshold` |

### `POST /worker/alerts` body

```json
{
  "cameraId": "uuid",
  "score": 0.82,
  "labels": ["person", "motion"],
  "snapshotRef": "s3:// or file path",
  "message": "optional human text"
}
```

Alerts persist to PostgreSQL and broadcast on Socket.IO event `alert:new`.

## Queue (next step)

- Redis queue `vms:ai:frames` — producer: FFmpeg snapshot cron or MediaMTX reader.
- Consumer: Python worker with **ONNX Runtime** + Ultralytics YOLO export.
- Env: `REDIS_URL`, model path `ONNX_MODEL_PATH`.

## MVP stub

`services/ai-worker` posts random scores on an interval. Replace `poll_and_score()` with real frame grab + inference.