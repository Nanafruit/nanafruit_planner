import { Injectable } from '@nestjs/common';
import { CurrentUserPayload } from '../auth/current-user.decorator';
import { OcrService, PoExtraction } from './ocr.service';
import { PoSubmission } from './po-submission.schema';
import { PowerAutomateService } from './power-automate.service';
import { SharePointService } from './sharepoint.service';
import { PurchaseOrderRecord, SupabaseService } from './supabase.service';

@Injectable()
export class PoService {
  constructor(
    private readonly sharePoint: SharePointService,
    private readonly supabase: SupabaseService,
    private readonly ocr: OcrService,
    private readonly powerAutomate: PowerAutomateService,
  ) {}

  extract(file: Express.Multer.File): Promise<PoExtraction> {
    return this.ocr.extract(file.buffer);
  }

  async upload(
    file: Express.Multer.File,
    data: PoSubmission,
    user: CurrentUserPayload,
  ): Promise<PurchaseOrderRecord> {
    const uploaded = await this.sharePoint.uploadFile(
      file.originalname,
      file.buffer,
    );

    let record: PurchaseOrderRecord;
    try {
      record = await this.supabase.insertPurchaseOrder({
        file_name: uploaded.name,
        file_size: file.size,
        sharepoint_item_id: uploaded.itemId,
        sharepoint_url: uploaded.webUrl,
        uploaded_by_email: user.email,
        uploaded_by_name: user.name ?? null,
        po_number: data.po_number,
        po_date: data.po_date,
        due_date: data.due_date,
        expiry_date: data.expiry_date,
        vendor_name: data.vendor_name,
        customer_name: data.customer_name,
        notes: data.notes,
      });
    } catch (error) {
      // บันทึก DB ไม่สำเร็จ — ลบไฟล์ออกจาก SharePoint เพื่อไม่ให้มีไฟล์กำพร้า
      await this.sharePoint.deleteFile(uploaded.itemId).catch(() => undefined);
      throw error;
    }

    try {
      await this.supabase.insertPoLineItems(
        data.line_items.map((item, index) => ({
          po_id: record.id,
          line_no: index + 1,
          product_code: item.product_code,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
        })),
      );
    } catch (error) {
      // บันทึก line items ไม่สำเร็จ — ลบทั้ง record และไฟล์ เพื่อไม่ให้ข้อมูลค้างไม่ครบ
      await this.supabase.deletePurchaseOrder(record.id).catch(() => undefined);
      await this.sharePoint.deleteFile(uploaded.itemId).catch(() => undefined);
      throw error;
    }

    await this.powerAutomate.notifyProductionTeam({
      poId: record.id,
      poNumber: record.po_number,
      vendorName: record.vendor_name,
      customerName: record.customer_name,
      lineItems: data.line_items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
      })),
    });

    return record;
  }

  list(): Promise<PurchaseOrderRecord[]> {
    return this.supabase.listPurchaseOrders();
  }
}
