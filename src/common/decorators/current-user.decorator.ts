import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '../../../generated/prisma';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
