import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { CurrentUserPayload } from './current-user.decorator';
import { PERMISSION_KEY } from './permissions.decorator';
import { Permission, roleHasPermission } from './permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<Permission | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permission) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: CurrentUserPayload }>();

    if (!roleHasPermission(user.role, permission)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
