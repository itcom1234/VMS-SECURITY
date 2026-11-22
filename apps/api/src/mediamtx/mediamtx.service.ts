import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MediaMtxService {
  private readonly logger = new Logger(MediaMtxService.name);
  private readonly baseUrl =
    process.env.MTX_API_URL ?? 'http://localhost:9997';

  async provisionPath(mtxPath: string, source: string): Promise<void> {
    const url = `${this.baseUrl}/v3/config/paths/add/${encodeURIComponent(mtxPath)}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          sourceOnDemand: true,
        }),
      });
      if (!res.ok && res.status !== 409) {
        const text = await res.text();
        this.logger.warn(`MediaMTX path add failed (${res.status}): ${text}`);
      }
    } catch (err) {
      this.logger.warn(
        `MediaMTX unreachable at ${this.baseUrl}; path ${mtxPath} stored in DB only`,
      );
      this.logger.debug(String(err));
    }
  }

  async removePath(mtxPath: string): Promise<void> {
    const url = `${this.baseUrl}/v3/config/paths/remove/${encodeURIComponent(mtxPath)}`;
    try {
      await fetch(url, { method: 'DELETE' });
    } catch {
      this.logger.warn(`Could not remove MediaMTX path ${mtxPath}`);
    }
  }

  hlsUrl(mtxPath: string): string {
    const publicBase =
      process.env.MTX_HLS_PUBLIC_URL ?? 'http://localhost:8888';
    return `${publicBase.replace(/\/$/, '')}/${mtxPath}/index.m3u8`;
  }

  webrtcUrl(mtxPath: string): string {
    const publicBase =
      process.env.MTX_WEBRTC_PUBLIC_URL ?? 'http://localhost:8889';
    return `${publicBase.replace(/\/$/, '')}/${mtxPath}`;
  }
}