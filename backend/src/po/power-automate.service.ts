import { Injectable, Logger } from '@nestjs/common';
import {
  buildAdaptiveCard,
  buildEmailHtml,
  buildEmailSubject,
} from './power-automate.templates';

export interface PoNotificationPayload {
  poId: string;
  poNumber: string | null;
  vendorName: string | null;
  customerName: string | null;
  lineItems: { description: string; quantity: number; unit: string | null }[];
}

@Injectable()
export class PowerAutomateService {
  private readonly logger = new Logger(PowerAutomateService.name);

  /**
   * แจ้งเตือนทีม Production ผ่าน Power Automate Instant Flow (HTTP trigger)
   * ส่ง Adaptive Card JSON + Email subject/HTML ที่ build ไว้แล้ว — Flow แค่
   * map field เข้า Teams/Outlook connector ตรงๆ ไม่ต้องประกอบ JSON/HTML เอง
   * เป็น fire-and-forget: ถ้า fail ไม่ block การบันทึก PO
   */
  async notifyProductionTeam(payload: PoNotificationPayload): Promise<void> {
    const webhookUrl = process.env.POWER_AUTOMATE_PO_NOTIFY_URL;
    if (!webhookUrl) {
      return;
    }

    const bomUrl = `${process.env.FRONTEND_URL}/po/${payload.poId}/bom`;
    const templateData = {
      poNumber: payload.poNumber,
      vendorName: payload.vendorName,
      customerName: payload.customerName,
      bomUrl,
      lineItems: payload.lineItems,
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: payload.poId,
          po_number: payload.poNumber,
          vendor_name: payload.vendorName,
          customer_name: payload.customerName,
          line_items: payload.lineItems,
          bom_url: bomUrl,
          adaptive_card: JSON.stringify(buildAdaptiveCard(templateData)),
          email_subject: buildEmailSubject(templateData),
          email_html: buildEmailHtml(templateData),
        }),
      });
      if (!response.ok) {
        this.logger.warn(
          `Power Automate notify failed: ${response.status} ${await response.text()}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Power Automate notify error: ${(error as Error).message}`,
      );
    }
  }
}
