"""
VMS AI worker — MVP stub.

Next step: sample frames from MediaMTX (RTSP/HLS), run ONNX/YOLO, post real scores.
See docs/ai-worker-contract.md in repo root README.
"""

from __future__ import annotations

import asyncio
import os
import random
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI

API_URL = os.environ.get("API_INTERNAL_URL", "http://localhost:3001")
WORKER_KEY = os.environ.get("WORKER_API_KEY", "dev-worker-key-change-me")
INTERVAL = float(os.environ.get("SAMPLE_INTERVAL_SEC", "20"))


async def poll_and_score(client: httpx.AsyncClient) -> None:
    headers = {"X-Worker-Key": WORKER_KEY}
    try:
        res = await client.get(f"{API_URL}/worker/cameras", headers=headers, timeout=10)
        res.raise_for_status()
        cameras = res.json()
    except Exception as exc:
        print(f"[worker] camera fetch failed: {exc}")
        return

    for cam in cameras:
        if not cam.get("aiEnabled"):
            continue
        # Stub: pseudo motion / object-presence score until ONNX pipeline lands
        score = round(random.uniform(0.35, 0.95), 3)
        labels = ["stub_motion", "stub_object"] if score > 0.6 else ["normal"]
        payload = {
            "cameraId": cam["id"],
            "score": score,
            "labels": labels,
            "message": "Stub inference — replace with ONNX frame scorer",
            "snapshotRef": f"stub://{cam.get('mtxPath', cam['id'])}",
        }
        try:
            r = await client.post(
                f"{API_URL}/worker/alerts",
                headers=headers,
                json=payload,
                timeout=10,
            )
            r.raise_for_status()
            body = r.json()
            if body.get("suppressed"):
                print(f"[worker] {cam['name']}: score {score} below threshold")
            else:
                print(f"[worker] alert for {cam['name']} score={score}")
        except Exception as exc:
            print(f"[worker] alert post failed for {cam.get('name')}: {exc}")


async def scheduler() -> None:
    await asyncio.sleep(5)
    async with httpx.AsyncClient() as client:
        while True:
            await poll_and_score(client)
            await asyncio.sleep(INTERVAL)


@asynccontextmanager
async def lifespan(_: FastAPI):
    task = asyncio.create_task(scheduler())
    yield
    task.cancel()


app = FastAPI(title="VMS AI Worker (stub)", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok", "mode": "stub", "onnx": "not_loaded"}