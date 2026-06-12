import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from './permissions';

export interface CurrentUserPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: CurrentUserPayload }>();
    return request.user;
  },
);
