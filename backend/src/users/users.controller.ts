import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { UpdateRoleSchema } from './update-role.schema';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }

  @Get()
  @RequirePermission('users:manage')
  list() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  @RequirePermission('users:manage')
  updateRole(@Param('id') id: string, @Body() body: unknown) {
    const result = UpdateRoleSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(`Invalid body: ${result.error.message}`);
    }
    return this.usersService.updateRole(id, result.data.role);
  }
}
