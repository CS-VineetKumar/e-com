import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { CategoriesService } from '../categories.service';
import { CategoryObject } from './category.object';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GraphQLCacheInterceptor } from '../../cache/graphql-cache.interceptor';

@Resolver(() => CategoryObject)
@UseInterceptors(GraphQLCacheInterceptor)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Query(() => [CategoryObject], { name: 'categories' })
  async findAll(): Promise<CategoryObject[]> {
    return this.categoriesService.findAll();
  }

  @Query(() => CategoryObject, { name: 'category' })
  async findOne(@Args('id', { type: () => Int }) id: number): Promise<CategoryObject> {
    return this.categoriesService.findOne(id);
  }

  @Mutation(() => CategoryObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createCategory(
    @Args('input') createCategoryInput: CreateCategoryInput,
  ): Promise<CategoryObject> {
    return this.categoriesService.create(createCategoryInput);
  }

  @Mutation(() => CategoryObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateCategory(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') updateCategoryInput: UpdateCategoryInput,
  ): Promise<CategoryObject> {
    return this.categoriesService.update(id, updateCategoryInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteCategory(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    await this.categoriesService.remove(id);
    return true;
  }
}

