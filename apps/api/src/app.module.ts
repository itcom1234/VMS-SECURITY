import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CamerasModule } from './cameras/cameras.module';
import { AlertsModule } from './alerts/alerts.module';
import { HealthController } from './health.controller';
import { EventsModule } from './events/events.module';
import { WorkerModule } from './worker/worker.module';
import { MediaMtxModule } from './mediamtx/mediamtx.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CamerasModule,
    AlertsModule,
    EventsModule,
    WorkerModule,
    MediaMtxModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}