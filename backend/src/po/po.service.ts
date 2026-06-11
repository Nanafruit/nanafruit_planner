import { Injectable } from '@nestjs/common';
import { CurrentUserPayload } from '../auth/current-user.decorator';
import { SharePointService } from './sharepoint.service';
import { PurchaseOrderRecord, SupabaseService } from './supabase.service';

@Injectable()
export class PoService {
  constructor(
    private readonly sharePoint: SharePointService,
    private readonly supabase: SupabaseService,
  ) {}

  async upload(
    file: Express.Multer.File,
    user: CurrentUserPayload,
  ): Promise<PurchaseOrderRecord> {
    const uploaded = await this.sharePoint.uploadFile(
      file.originalname,
      file.buffer,
    );

    try {
      return await this.supabase.insertPurchaseOrder({
        file_name: uploaded.name,
        file_size: file.size,
        sharepoint_item_id: uploaded.itemId,
        sharepoint_url: uploaded.webUrl,
        uploaded_by_email: user.email,
        uploaded_by_name: user.name ?? null,
      });
    } catch (error) {
      // บันทึก DB ไม่สำเร็จ — ลบไฟล์ออกจาก SharePoint เพื่อไม่ให้มีไฟล์กำพร้า
      await this.sharePoint.deleteFile(uploaded.itemId).catch(() => undefined);
      throw error;
    }
  }

  list(): Promise<PurchaseOrderRecord[]> {
    return this.supabase.listPurchaseOrders();
  }
}
