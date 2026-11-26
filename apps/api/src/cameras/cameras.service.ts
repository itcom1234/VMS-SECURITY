import { Injectable, NotFoundException } from '@nestjs/common';
import { CameraStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { buildRtspSource, encryptSecret } from '../common/crypto.util';
import { MediaMtxService } from '../mediamtx/mediamtx.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';
import { OnvifAddCameraDto } from './dto/onvif-add.dto';
import { OnvifDiscoveryService } from './onvif-discovery.service';

function toPublicCamera(
  camera: Prisma.CameraGetPayload<object>,
  mtx: MediaMtxService,
) {
  return {
    id: camera.id,
    name: camera.name,
    rtspUrl: camera.rtspUrl,
    username: camera.username,
    hasPassword: Boolean(camera.passwordEnc),
    aiEnabled: camera.aiEnabled,
    scoreThreshold: camera.scoreThreshold,
    site: camera.site,
    tags: camera.tags,
    mtxPath: camera.mtxPath,
    status: camera.status,
    lastScore: camera.lastScore,
    hlsUrl: mtx.hlsUrl(camera.mtxPath),
    webrtcUrl: mtx.webrtcUrl(camera.mtxPath),
    createdAt: camera.createdAt,
    updatedAt: camera.updatedAt,
  };
}

@Injectable()
export class CamerasService {
  constructor(
    private prisma: PrismaService,
    private mtx: MediaMtxService,
    private onvif: OnvifDiscoveryService,
  ) {}

  async findAll() {
    const cameras = await this.prisma.camera.findMany({
      orderBy: { name: 'asc' },
    });
    return cameras.map((c) => toPublicCamera(c, this.mtx));
  }

  async findOne(id: string) {
    const camera = await this.prisma.camera.findUnique({ where: { id } });
    if (!camera) throw new NotFoundException('Camera not found');
    return toPublicCamera(camera, this.mtx);
  }

  async createFromOnvif(dto: OnvifAddCameraDto) {
    const discovered = await this.onvif.discover(dto);
    const token =
      dto.profileToken ??
      discovered.suggestedProfileToken ??
      discovered.profiles[0]?.token;
    if (!token) {
      throw new NotFoundException('No ONVIF media profile available');
    }
    let rtspUrl =
      discovered.profiles.find((p) => p.token === token)?.rtspUrl ?? null;
    if (!rtspUrl) {
      rtspUrl = await this.onvif.rtspUrlForProfile(dto, token);
    }
    const defaultName =
      dto.name ||
      [discovered.device.manufacturer, discovered.device.model]
        .filter(Boolean)
        .join(' ') ||
      `Camera ${dto.host}`;
    return this.create({
      name: defaultName,
      rtspUrl,
      username: dto.username,
      password: dto.password,
      aiEnabled: dto.aiEnabled,
      scoreThreshold: dto.scoreThreshold,
      site: dto.site ?? dto.host,
      tags: dto.tags,
    });
  }

  async create(dto: CreateCameraDto) {
    const id = randomUUID();
    const mtxPath = `cam-${id.slice(0, 8)}`;
    const passwordEnc = dto.password
      ? encryptSecret(dto.password)
      : undefined;

    const camera = await this.prisma.camera.create({
      data: {
        id,
        name: dto.name,
        rtspUrl: dto.rtspUrl,
        username: dto.username,
        passwordEnc,
        aiEnabled: dto.aiEnabled ?? true,
        scoreThreshold: dto.scoreThreshold ?? 0.65,
        site: dto.site,
        tags: dto.tags,
        mtxPath,
        status: CameraStatus.OFFLINE,
      },
    });

    const source = buildRtspSource(
      camera.rtspUrl,
      camera.username,
      camera.passwordEnc,
    );
    await this.mtx.provisionPath(mtxPath, source);

    return toPublicCamera(
      await this.prisma.camera.update({
        where: { id },
        data: { status: CameraStatus.STREAMING },
      }),
      this.mtx,
    );
  }

  async update(id: string, dto: UpdateCameraDto) {
    const existing = await this.prisma.camera.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Camera not found');

    let passwordEnc = existing.passwordEnc;
    if (dto.password !== undefined) {
      passwordEnc = dto.password ? encryptSecret(dto.password) : null;
    }

    const camera = await this.prisma.camera.update({
      where: { id },
      data: {
        name: dto.name,
        rtspUrl: dto.rtspUrl,
        username: dto.username,
        passwordEnc,
        aiEnabled: dto.aiEnabled,
        scoreThreshold: dto.scoreThreshold,
        site: dto.site,
        tags: dto.tags,
      },
    });

    if (dto.rtspUrl || dto.username !== undefined || dto.password !== undefined) {
      const source = buildRtspSource(
        camera.rtspUrl,
        camera.username,
        camera.passwordEnc,
      );
      await this.mtx.removePath(camera.mtxPath);
      await this.mtx.provisionPath(camera.mtxPath, source);
    }

    return toPublicCamera(camera, this.mtx);
  }

  async remove(id: string) {
    const camera = await this.prisma.camera.findUnique({ where: { id } });
    if (!camera) throw new NotFoundException('Camera not found');
    await this.mtx.removePath(camera.mtxPath);
    await this.prisma.camera.delete({ where: { id } });
    return { deleted: true };
  }
}