import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthResponseObject, UserObject } from './auth.object';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { User } from '@prisma/client';

@Resolver(() => AuthResponseObject)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponseObject)
  async register(@Args('input') registerInput: RegisterInput): Promise<AuthResponseObject> {
    return this.authService.register(registerInput);
  }

  @Mutation(() => AuthResponseObject)
  async login(@Args('input') loginInput: LoginInput): Promise<AuthResponseObject> {
    return this.authService.login(loginInput);
  }

  @Query(() => UserObject, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: { req: { user: User } }): Promise<UserObject> {
    const user = context.req.user;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}

