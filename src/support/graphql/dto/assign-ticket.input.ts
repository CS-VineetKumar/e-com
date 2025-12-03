import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty } from 'class-validator';

@InputType()
export class AssignTicketInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  assignedToId: number;
}

