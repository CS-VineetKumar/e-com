import { Role } from '../../common/enums/role.enum';

export class AuthResponseDto {
  access_token: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
}
