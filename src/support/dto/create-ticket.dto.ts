import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt } from 'class-validator';
import { TicketPriority, TicketCategory } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsEnum(TicketCategory)
  @IsOptional()
  category?: TicketCategory;

  @IsInt()
  @IsOptional()
  orderId?: number;

  @IsInt()
  @IsOptional()
  productId?: number;
}

