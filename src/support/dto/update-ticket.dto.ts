import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsEnum(TicketCategory)
  @IsOptional()
  category?: TicketCategory;

  @IsInt()
  @IsOptional()
  assignedToId?: number;
}

