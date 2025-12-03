import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignTicketDto {
  @IsInt()
  @IsNotEmpty()
  assignedToId: number;
}

