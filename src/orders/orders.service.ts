import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto, OrderItemResponseDto } from './dto/order-response.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
  ) {}

  async createOrder(userId: number, createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    // Get user's cart
    const cart = await this.cartService.getOrCreateCart(userId);

    if (cart.cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Check stock availability for all items
    for (const cartItem of cart.cartItems) {
      if (cartItem.product.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${cartItem.product.name}`,
        );
      }
    }

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          total: cart.totalPrice,
          shippingAddress: createOrderDto.shippingAddress,
          billingAddress: createOrderDto.billingAddress,
          notes: createOrderDto.notes,
        },
      });

      // Create order items and update product stock
      const orderItems: any[] = [];
      for (const cartItem of cart.cartItems) {
        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: cartItem.product.id,
            quantity: cartItem.quantity,
            price: cartItem.product.price,
          },
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        });

        // Update product stock
        await tx.product.update({
          where: { id: cartItem.product.id },
          data: {
            stock: {
              decrement: cartItem.quantity,
            },
          },
        });

        orderItems.push(orderItem);
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return { ...newOrder, orderItems };
    });

    return this.formatOrderResponse(order);
  }

  async getUserOrders(userId: number): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(order => this.formatOrderResponse(order));
  }

  async getOrderById(userId: number, orderId: number): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrderResponse(order);
  }

  async getAllOrders(): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(order => this.formatOrderResponse(order));
  }

  async updateOrderStatus(
    orderId: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    this.validateStatusTransition(order.status, updateOrderStatusDto.status);

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: updateOrderStatusDto.status },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return this.formatOrderResponse(updatedOrder);
  }

  async cancelOrder(userId: number, orderId: number): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    // Cancel order and restore stock in a transaction
    const cancelledOrder = await this.prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      // Restore product stock
      for (const orderItem of order.orderItems) {
        await tx.product.update({
          where: { id: orderItem.product.id },
          data: {
            stock: {
              increment: orderItem.quantity,
            },
          },
        });
      }

      return updatedOrder;
    });

    return this.formatOrderResponse(cancelledOrder);
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private formatOrderResponse(order: any): OrderResponseDto {
    const orderItems: OrderItemResponseDto[] = order.orderItems.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      product: item.product,
    }));

    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      total: Number(order.total),
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      notes: order.notes,
      orderItems,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
