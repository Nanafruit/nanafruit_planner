import { BadRequestException, Injectable } from '@nestjs/common';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import {
  BomForPoView,
  BomSupabaseService,
} from './bom-supabase.service';
import type { BomDraftInput, BomSubmitInput } from './bom-submission.schema';

@Injectable()
export class BomService {
  constructor(private readonly bomSupabase: BomSupabaseService) {}

  getBomForPo(poId: string): Promise<BomForPoView> {
    return this.bomSupabase.getBomForPo(poId);
  }

  async saveDraft(
    poId: string,
    input: BomDraftInput,
    user: CurrentUserPayload,
  ): Promise<{ status: 'ok' }> {
    await this.bomSupabase.saveLines(poId, input.lines, 'draft', user.email);
    return { status: 'ok' };
  }

  async submit(
    poId: string,
    input: BomSubmitInput,
    user: CurrentUserPayload,
  ): Promise<{ status: 'ok' }> {
    const lineItemIds = await this.bomSupabase.getLineItemIds(poId);
    const submittedIds = new Set(input.lines.map((line) => line.po_line_item_id));

    const missing = lineItemIds.filter((id) => !submittedIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        'กรุณากรอกข้อมูล BOM ให้ครบทุกรายการสินค้าก่อนยืนยันส่ง',
      );
    }

    await this.bomSupabase.saveLines(poId, input.lines, 'submitted', user.email);
    return { status: 'ok' };
  }
}
