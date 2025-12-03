import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ProductObject } from '../../products/graphql/product.object';

@ObjectType()
export class CategoryObject {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [ProductObject], { nullable: true })
  products?: ProductObject[];
}

