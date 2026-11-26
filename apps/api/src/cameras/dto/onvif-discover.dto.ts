import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class OnvifDiscoverDto {
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
}