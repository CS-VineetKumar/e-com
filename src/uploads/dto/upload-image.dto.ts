import { MediaContextType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UploadImageDto {
  @IsOptional()
  @IsEnum(MediaContextType)
  contextType?: MediaContextType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  contextId?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

