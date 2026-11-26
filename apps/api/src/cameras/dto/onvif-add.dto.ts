import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class OnvifAddCameraDto {
  @IsString()
  @MinLength(1)
  host: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsString()
  @MinLength(1)
  username: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsBoolean()
  useSecure?: boolean;

  @IsOptional()
  @IsString()
  path?: string;

  @IsString()
  @MinLength(1)
  name: string;

  /** ONVIF media profile token from discover; uses suggested main stream if omitted. */
  @IsOptional()
  @IsString()
  profileToken?: string;

  @IsOptional()
  @IsBoolean()
  aiEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  scoreThreshold?: number;

  @IsOptional()
  @IsString()
  site?: string;

  @IsOptional()
  @IsString()
  tags?: string;
}