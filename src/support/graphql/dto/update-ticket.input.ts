import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client';

@InputType()
export class UpdateTicketInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @Field(() => String, { nullable: true })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @Field(() => String, { nullable: true })
  @IsEnum(TicketCategory)
  @IsOptional()
  category?: TicketCategory;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  assignedToId?: number;
}

