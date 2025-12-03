import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

@InputType()
export class CreateCategoryInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;
}

