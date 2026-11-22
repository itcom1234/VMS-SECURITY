import { Module } from '@nestjs/common';
import { CamerasService } from './cameras.service';
import { CamerasController } from './cameras.controller';
import { MediaMtxModule } from '../mediamtx/mediamtx.module';

@Module({
  imports: [MediaMtxModule],
  providers: [CamerasService],
  controllers: [CamerasController],
  exports: [CamerasService],
})
export class CamerasModule {}