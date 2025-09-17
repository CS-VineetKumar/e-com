import { OrderStatus, Product } from '@prisma/client';

export class OrderItemResponseDto {
  id: number;
  quantity: number;
  price: number;
  product: Product;
}

export class OrderResponseDto {
  id: number;
  userId: number;
  status: OrderStatus;
  total: number;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  orderItems: OrderItemResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
