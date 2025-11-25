import { ObjectType, Field } from '@nestjs/graphql';
import { Role } from '../../common/enums/role.enum';

@ObjectType()
export class UserObject {
  @Field(() => Number)
  id: number;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => String)
  role: Role;
}

@ObjectType()
export class AuthResponseObject {
  @Field()
  access_token: string;

  @Field(() => String, { nullable: true })
  refresh_token?: string;

  @Field(() => UserObject)
  user: UserObject;
}

