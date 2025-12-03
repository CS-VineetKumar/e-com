import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class CreateCommentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  comment: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;
}

