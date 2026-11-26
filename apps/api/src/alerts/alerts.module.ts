import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { EventsModule } from '../events/events.module';
import { AlertsSseController } from './alerts-sse.controller';
import { AlertsStreamService } from './alerts-stream.service';
import { AuthModule } from '../auth/auth.module';
import { SseTokenGuard } from '../auth/sse-token.guard';

@Module({
  imports: [EventsModule, AuthModule],
  providers: [AlertsService, AlertsStreamService, SseTokenGuard],
  controllers: [AlertsController, AlertsSseController],
  exports: [AlertsService, AlertsStreamService],
})
export class AlertsModule {}