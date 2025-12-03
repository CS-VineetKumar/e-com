import { ObjectType, Field, Int, Float, registerEnumType } from '@nestjs/graphql';
import { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client';

// Register enums for GraphQL
registerEnumType(TicketStatus, {
  name: 'TicketStatus',
  description: 'The status of a support ticket',
});

registerEnumType(TicketPriority, {
  name: 'TicketPriority',
  description: 'The priority level of a ticket',
});

registerEnumType(TicketCategory, {
  name: 'TicketCategory',
  description: 'The category of the ticket',
});

@ObjectType()
export class UserObjectForTicket {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  role: string;
}

@ObjectType()
export class OrderObjectForTicket {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field()
  status: string;

  @Field(() => Float)
  total: number;
}

@ObjectType()
export class ProductObjectForTicket {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  price: number;
}

@ObjectType()
export class TicketCommentObject {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  ticketId: number;

  @Field(() => Int)
  userId: number;

  @Field()
  comment: string;

  @Field()
  isInternal: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => UserObjectForTicket)
  user: UserObjectForTicket;
}

@ObjectType()
export class TicketObject {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => TicketStatus)
  status: TicketStatus;

  @Field(() => TicketPriority)
  priority: TicketPriority;

  @Field(() => TicketCategory)
  category: TicketCategory;

  @Field(() => Int)
  createdById: number;

  @Field(() => Int, { nullable: true })
  assignedToId?: number;

  @Field(() => Int, { nullable: true })
  orderId?: number;

  @Field(() => Int, { nullable: true })
  productId?: number;

  @Field({ nullable: true })
  closedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => UserObjectForTicket)
  createdBy: UserObjectForTicket;

  @Field(() => UserObjectForTicket, { nullable: true })
  assignedTo?: UserObjectForTicket;

  @Field(() => OrderObjectForTicket, { nullable: true })
  order?: OrderObjectForTicket;

  @Field(() => ProductObjectForTicket, { nullable: true })
  product?: ProductObjectForTicket;

  @Field(() => [TicketCommentObject])
  comments: TicketCommentObject[];
}

