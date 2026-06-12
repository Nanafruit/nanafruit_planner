import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { BomService } from './bom.service';
import { BomDraftSchema, BomSubmitSchema } from './bom-submission.schema';

@Controller('po/:poId/bom')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('bom:edit')
export class BomController {
  constructor(private readonly bomService: BomService) {}

  @Get()
  get(@Param('poId') poId: string) {
    return this.bomService.getBomForPo(poId);
  }

  @Put('draft')
  saveDraft(
    @Param('poId') poId: string,
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = BomDraftSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(`Invalid form data: ${result.error.message}`);
    }
    return this.bomService.saveDraft(poId, result.data, user);
  }

  @Post('submit')
  submit(
    @Param('poId') poId: string,
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = BomSubmitSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(`Invalid form data: ${result.error.message}`);
    }
    return this.bomService.submit(poId, result.data, user);
  }
}
