import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateAlertDto {
  @IsUUID()
  cameraId: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  score: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsString()
  snapshotRef?: string;

  @IsOptional()
  @IsString()
  message?: string;
}