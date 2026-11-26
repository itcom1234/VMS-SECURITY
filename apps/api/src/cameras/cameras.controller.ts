import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CamerasService } from './cameras.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';
import { OnvifDiscoverDto } from './dto/onvif-discover.dto';
import { OnvifAddCameraDto } from './dto/onvif-add.dto';
import { OnvifDiscoveryService } from './onvif-discovery.service';

@Controller('cameras')
@UseGuards(JwtAuthGuard)
export class CamerasController {
  constructor(
    private cameras: CamerasService,
    private onvif: OnvifDiscoveryService,
  ) {}

  @Get()
  list() {
    return this.cameras.findAll();
  }

  @Post('onvif/discover')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  discoverOnvif(@Body() dto: OnvifDiscoverDto) {
    return this.onvif.discover(dto);
  }

  @Post('onvif/add')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  addViaOnvif(@Body() dto: OnvifAddCameraDto) {
    return this.cameras.createFromOnvif(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.cameras.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCameraDto) {
    return this.cameras.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCameraDto) {
    return this.cameras.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.cameras.remove(id);
  }
}