import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';

@InputType()
export class CreateOrderInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  billingAddress?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

