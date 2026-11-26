import { Module } from '@nestjs/common';
import { WorkerController } from './worker.controller';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AlertsModule],
  controllers: [WorkerController],
})
export class WorkerModule {}