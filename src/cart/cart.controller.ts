import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import type { User } from '@prisma/client';

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() user: User): Promise<CartResponseDto> {
    return this.cartService.getOrCreateCart(user.id);
  }

  @Post('add')
  async addToCart(
    @CurrentUser() user: User,
    @Body(ValidationPipe) addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addToCart(user.id, addToCartDto);
  }

  @Patch('items/:id')
  async updateCartItem(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) cartItemId: number,
    @Body(ValidationPipe) updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateCartItem(user.id, cartItemId, updateCartItemDto);
  }

  @Delete('items/:id')
  async removeFromCart(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) cartItemId: number,
  ): Promise<CartResponseDto> {
    return this.cartService.removeFromCart(user.id, cartItemId);
  }

  @Delete('clear')
  async clearCart(@CurrentUser() user: User): Promise<CartResponseDto> {
    return this.cartService.clearCart(user.id);
  }
}
