import { Controller, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { Observable, interval, map, merge } from 'rxjs';
import { SseTokenGuard } from '../auth/sse-token.guard';
import { AlertsStreamService } from './alerts-stream.service';

@Controller('alerts')
export class AlertsSseController {
  constructor(private stream: AlertsStreamService) {}

  @Sse('stream')
  @UseGuards(SseTokenGuard)
  streamAlerts(): Observable<MessageEvent> {
    const keepAlive = interval(25000).pipe(
      map(() => ({ data: { type: 'ping' } } as MessageEvent)),
    );
    const alerts = this.stream.asObservable().pipe(
      map((alert) => ({ data: alert } as MessageEvent)),
    );
    return merge(alerts, keepAlive);
  }
}