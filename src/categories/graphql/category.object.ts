import { ObjectType, Field, Int } from '@nestjs/graphql';

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
}

