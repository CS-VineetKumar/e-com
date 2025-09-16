import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: Role;
}
