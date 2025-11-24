import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProductsService } from '../products.service';
import { ProductObject } from './product.object';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Resolver(() => ProductObject)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => [ProductObject], { name: 'products' })
  async findAll(): Promise<ProductObject[]> {
    const products = await this.productsService.findAll();
    return products.map(p => ({
      ...p,
      description: p.description ?? undefined,
      price: Number(p.price),
    }));
  }

  @Query(() => ProductObject, { name: 'product' })
  async findOne(@Args('id', { type: () => Int }) id: number): Promise<ProductObject> {
    const product = await this.productsService.findOne(id);
    return {
      ...product,
      description: product.description ?? undefined,
      price: Number(product.price),
    };
  }

  @Mutation(() => ProductObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createProduct(
    @Args('input') createProductInput: CreateProductInput,
  ): Promise<ProductObject> {
    const product = await this.productsService.create(createProductInput);
    return {
      ...product,
      description: product.description ?? undefined,
      price: Number(product.price),
    };
  }

  @Mutation(() => ProductObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateProduct(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') updateProductInput: UpdateProductInput,
  ): Promise<ProductObject> {
    const product = await this.productsService.update(id, updateProductInput);
    return {
      ...product,
      description: product.description ?? undefined,
      price: Number(product.price),
    };
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteProduct(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    await this.productsService.remove(id);
    return true;
  }
}

