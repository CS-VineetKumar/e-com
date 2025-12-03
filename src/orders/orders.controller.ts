import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import type { User } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  async createOrder(
    @CurrentUser() user: User,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(user.id, createOrderDto);
  }

  @Get()
  @Roles(Role.CUSTOMER)
  async getUserOrders(@CurrentUser() user: User): Promise<OrderResponseDto[]> {
    return this.ordersService.getUserOrders(user.id);
  }

  @Get('all')
  @Roles(Role.ADMIN)
  async getAllOrders(): Promise<OrderResponseDto[]> {
    return this.ordersService.getAllOrders();
  }

  @Get(':id')
  @Roles(Role.CUSTOMER)
  async getOrderById(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) orderId: number,
  ): Promise<OrderResponseDto> {
    return this.ordersService.getOrderById(user.id, orderId);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  async updateOrderStatus(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrderStatus(orderId, updateOrderStatusDto);
  }

  @Delete(':id/cancel')
  @Roles(Role.CUSTOMER)
  async cancelOrder(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) orderId: number,
  ): Promise<OrderResponseDto> {
    return this.ordersService.cancelOrder(user.id, orderId);
  }
}
