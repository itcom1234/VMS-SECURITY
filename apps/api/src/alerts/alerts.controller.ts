import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AlertsService } from './alerts.service';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Get()
  list(@Query('cameraId') cameraId?: string) {
    return this.alerts.findAll(cameraId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.alerts.findOne(id);
  }

  @Patch(':id/ack')
  ack(@Param('id') id: string) {
    return this.alerts.acknowledge(id);
  }

  @Patch(':id/false-positive')
  falsePositive(@Param('id') id: string) {
    return this.alerts.markFalsePositive(id);
  }
}