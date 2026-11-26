import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { CreateAlertDto } from '../alerts/dto/create-alert.dto';
import { WorkerKeyGuard } from './worker-key.guard';

@Controller('worker')
@UseGuards(WorkerKeyGuard)
export class WorkerController {
  constructor(
    private prisma: PrismaService,
    private alerts: AlertsService,
  ) {}

  @Get('cameras')
  listAiCameras() {
    return this.prisma.camera.findMany({
      where: { aiEnabled: true },
      select: {
        id: true,
        name: true,
        mtxPath: true,
        rtspUrl: true,
        scoreThreshold: true,
        aiEnabled: true,
      },
    });
  }

  @Post('alerts')
  ingestAlert(@Body() dto: CreateAlertDto) {
    return this.alerts.createFromWorker(dto);
  }
}