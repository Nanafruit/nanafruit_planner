import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;
  email: string;
  name: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: CurrentUserPayload }>();
    return request.user;
  },
);
