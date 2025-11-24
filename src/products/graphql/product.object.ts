import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { CategoryObject } from '../../categories/graphql/category.object';

@ObjectType()
export class ProductObject {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  stock: number;

  @Field(() => Int)
  categoryId: number;

  @Field(() => CategoryObject, { nullable: true })
  category?: CategoryObject;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

