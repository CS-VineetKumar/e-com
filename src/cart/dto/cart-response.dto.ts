import { Product } from '@prisma/client';

export class CartItemResponseDto {
  id: number;
  quantity: number;
  product: Product;
  createdAt: Date;
  updatedAt: Date;
}

export class CartResponseDto {
  id: number;
  userId: number;
  cartItems: CartItemResponseDto[];
  totalItems: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}
