import { Module } from '@nestjs/common';
import { CamerasService } from './cameras.service';
import { CamerasController } from './cameras.controller';
import { MediaMtxModule } from '../mediamtx/mediamtx.module';
import { OnvifDiscoveryService } from './onvif-discovery.service';

@Module({
  imports: [MediaMtxModule],
  providers: [CamerasService, OnvifDiscoveryService],
  controllers: [CamerasController],
  exports: [CamerasService],
})
export class CamerasModule {}