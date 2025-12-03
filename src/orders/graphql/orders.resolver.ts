import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { OrdersService } from '../orders.service';
import { OrderObject } from './order.object';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderStatusInput } from './dto/update-order-status.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GraphQLCacheInterceptor } from '../../cache/graphql-cache.interceptor';

@Resolver(() => OrderObject)
@UseInterceptors(GraphQLCacheInterceptor)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => [OrderObject], { name: 'orders' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllOrders(): Promise<OrderObject[]> {
    const orders = await this.ordersService.getAllOrders();
    return orders.map(order => this.formatOrderForGraphQL(order));
  }

  @Query(() => [OrderObject], { name: 'myOrders' })
  @UseGuards(JwtAuthGuard)
  async getUserOrders(@Context() context: { req: { user: { userId: number } } }): Promise<OrderObject[]> {
    const userId = context.req.user.userId;
    const orders = await this.ordersService.getUserOrders(userId);
    return orders.map(order => this.formatOrderForGraphQL(order));
  }

  @Query(() => OrderObject, { name: 'order' })
  @UseGuards(JwtAuthGuard)
  async getOrderById(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: { req: { user: { userId: number; role: string } } },
  ): Promise<OrderObject> {
    const userId = context.req.user.userId;
    const userRole = context.req.user.role;

    // Use the service method which handles role-based access
    const order = await this.ordersService.getOrderById(userId, id);
    return this.formatOrderForGraphQL(order);
  }

  @Mutation(() => OrderObject)
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Args('input') createOrderInput: CreateOrderInput,
    @Context() context: { req: { user: { userId: number } } },
  ): Promise<OrderObject> {
    const userId = context.req.user.userId;
    const order = await this.ordersService.createOrder(userId, createOrderInput);
    return this.formatOrderForGraphQL(order);
  }

  @Mutation(() => OrderObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateOrderStatus(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') updateOrderStatusInput: UpdateOrderStatusInput,
  ): Promise<OrderObject> {
    const order = await this.ordersService.updateOrderStatus(id, updateOrderStatusInput);
    return this.formatOrderForGraphQL(order);
  }

  @Mutation(() => OrderObject)
  @UseGuards(JwtAuthGuard)
  async cancelOrder(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: { req: { user: { userId: number } } },
  ): Promise<OrderObject> {
    const userId = context.req.user.userId;
    const order = await this.ordersService.cancelOrder(userId, id);
    return this.formatOrderForGraphQL(order);
  }

  private formatOrderForGraphQL(order: any): OrderObject {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      total: Number(order.total),
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderItems: order.orderItems.map((item: any) => ({
        id: item.id,
        orderId: item.orderId || order.id,
        productId: item.product.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          price: Number(item.product.price),
          stock: item.product.stock,
          categoryId: item.product.categoryId,
        },
      })),
      user: order.user ? {
        id: order.user.id,
        email: order.user.email,
        firstName: order.user.firstName,
        lastName: order.user.lastName,
      } : undefined,
    };
  }
}

