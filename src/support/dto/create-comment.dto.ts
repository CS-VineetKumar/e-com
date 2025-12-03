import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;
}

