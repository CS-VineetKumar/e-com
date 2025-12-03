import { InputType, Field } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

@InputType()
export class UpdateOrderStatusInput {
  @Field(() => String)
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

