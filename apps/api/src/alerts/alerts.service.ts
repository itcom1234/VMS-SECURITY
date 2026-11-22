import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AlertsStreamService } from './alerts-stream.service';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
    private stream: AlertsStreamService,
  ) {}

  async findAll(cameraId?: string) {
    return this.prisma.alert.findMany({
      where: cameraId ? { cameraId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { camera: { select: { id: true, name: true, mtxPath: true } } },
      take: 200,
    });
  }

  async findOne(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: { camera: true },
    });
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  async acknowledge(id: string) {
    return this.prisma.alert.update({
      where: { id },
      data: { acknowledged: true },
    });
  }

  async markFalsePositive(id: string) {
    return this.prisma.alert.update({
      where: { id },
      data: { falsePositive: true, acknowledged: true },
    });
  }

  async createFromWorker(dto: CreateAlertDto) {
    const camera = await this.prisma.camera.findUnique({
      where: { id: dto.cameraId },
    });
    if (!camera) throw new NotFoundException('Camera not found');

    if (dto.score < camera.scoreThreshold) {
      return { suppressed: true, score: dto.score };
    }

    const alert = await this.prisma.alert.create({
      data: {
        cameraId: dto.cameraId,
        score: dto.score,
        labels: dto.labels ?? [],
        snapshotRef: dto.snapshotRef,
        message: dto.message,
      },
      include: { camera: { select: { id: true, name: true } } },
    });

    await this.prisma.camera.update({
      where: { id: dto.cameraId },
      data: { lastScore: dto.score },
    });

    this.events.broadcastAlert(alert);
    this.stream.emit(alert);
    return alert;
  }
}