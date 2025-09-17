import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  billingAddress?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
