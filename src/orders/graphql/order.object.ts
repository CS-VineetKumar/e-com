import { ObjectType, Field, Int, Float, registerEnumType } from '@nestjs/graphql';
import { OrderStatus } from '@prisma/client';

// Register OrderStatus enum for GraphQL
registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'The status of an order',
});

@ObjectType()
export class OrderItemObject {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  orderId: number;

  @Field(() => Int)
  productId: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  price: number;

  @Field(() => ProductObjectForOrder)
  product: ProductObjectForOrder;
}

@ObjectType()
export class ProductObjectForOrder {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  stock: number;

  @Field(() => Int)
  categoryId: number;
}

@ObjectType()
export class UserObjectForOrder {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;
}

@ObjectType()
export class OrderObject {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Float)
  total: number;

  @Field({ nullable: true })
  shippingAddress?: string;

  @Field({ nullable: true })
  billingAddress?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [OrderItemObject])
  orderItems: OrderItemObject[];

  @Field(() => UserObjectForOrder, { nullable: true })
  user?: UserObjectForOrder;
}

