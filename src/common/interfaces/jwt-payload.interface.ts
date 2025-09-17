import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: number; // user id
  email: string;
  role: Role;
}
