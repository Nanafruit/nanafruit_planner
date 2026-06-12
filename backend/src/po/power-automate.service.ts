import { Injectable, Logger } from '@nestjs/common';

export interface PoNotificationPayload {
  poId: string;
  poNumber: string | null;
  vendorName: string | null;
  lineItems: { description: string; quantity: number; unit: string | null }[];
}

@Injectable()
export class PowerAutomateService {
  private readonly logger = new Logger(PowerAutomateService.name);

  /**
   * แจ้งเตือนทีม Production ผ่าน Power Automate Instant Flow (HTTP trigger)
   * Flow จะ fan-out ไปยัง Teams + Email เอง — ฝั่งนี้ยิง webhook เดียว
   * เป็น fire-and-forget: ถ้า fail ไม่ block การบันทึก PO
   */
  async notifyProductionTeam(payload: PoNotificationPayload): Promise<void> {
    const webhookUrl = process.env.POWER_AUTOMATE_PO_NOTIFY_URL;
    if (!webhookUrl) {
      return;
    }

    const bomUrl = `${process.env.FRONTEND_URL}/po/${payload.poId}/bom`;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: payload.poId,
          po_number: payload.poNumber,
          vendor_name: payload.vendorName,
          line_items: payload.lineItems,
          bom_url: bomUrl,
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
