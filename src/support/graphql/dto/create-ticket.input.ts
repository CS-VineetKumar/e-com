import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt } from 'class-validator';
import { TicketPriority, TicketCategory } from '@prisma/client';

@InputType()
export class CreateTicketInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description: string;

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
  orderId?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  productId?: number;
}

