export interface PoNotificationData {
  poNumber: string | null;
  vendorName: string | null;
  customerName: string | null;
  bomUrl: string;
  lineItems: { description: string; quantity: number; unit: string | null }[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatQuantity(item: { quantity: number; unit: string | null }): string {
  return item.unit ? `${item.quantity} ${item.unit}` : `${item.quantity}`;
}

/** Adaptive Card v1.5 — สรุป PO + รายการสินค้า + ปุ่มเปิดหน้า BOM */
export function buildAdaptiveCard(data: PoNotificationData): object {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: [
      {
        type: 'TextBlock',
        text: 'มี PO ใหม่ — กรุณากรอกข้อมูล BOM',
        weight: 'Bolder',
        size: 'Medium',
        wrap: true,
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'เลขที่ PO', value: data.poNumber ?? '-' },
          { title: 'ลูกค้า', value: data.customerName ?? '-' },
          { title: 'จำนวนรายการสินค้า', value: String(data.lineItems.length) },
        ],
      },
      {
        type: 'TextBlock',
        text: 'รายการสินค้า',
        weight: 'Bolder',
        wrap: true,
        spacing: 'Medium',
      },
      {
        type: 'Table',
        columns: [{ width: 3 }, { width: 1 }],
        rows: [
          {
            type: 'TableRow',
            cells: [
              { type: 'TableCell', items: [{ type: 'TextBlock', text: 'รายการ', weight: 'Bolder', wrap: true }] },
              { type: 'TableCell', items: [{ type: 'TextBlock', text: 'จำนวน', weight: 'Bolder', wrap: true }] },
            ],
          },
          ...data.lineItems.map((item) => ({
            type: 'TableRow',
            cells: [
              { type: 'TableCell', items: [{ type: 'TextBlock', text: item.description, wrap: true }] },
              { type: 'TableCell', items: [{ type: 'TextBlock', text: formatQuantity(item), wrap: true }] },
            ],
          })),
        ],
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'เปิดหน้ากรอก BOM',
        url: data.bomUrl,
      },
    ],
  };
}

export function buildEmailSubject(data: PoNotificationData): string {
  return `PO ใหม่${data.poNumber ? ` ${data.poNumber}` : ''} — กรุณากรอกข้อมูล BOM`;
}

/** Email HTML body — สรุป PO + ตารางรายการสินค้า + ลิงก์ไปหน้า BOM */
export function buildEmailHtml(data: PoNotificationData): string {
  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const rows = data.lineItems
    .map(
      (item) => `
        <tr style="border-bottom:0.5px solid #e4e4e7;">
          <td style="padding:9px 12px;font-size:13px;">${escapeHtml(item.description)}</td>
          <td style="padding:9px 12px;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;">${escapeHtml(formatQuantity(item))}</td>
        </tr>`,
    )
    .join('');

  return `
    <div style="font-family:sans-serif;color:#27272a;max-width:560px;">

      <!-- Header -->
      <div style="background:#1a1a2e;padding:20px 28px;border-radius:8px 8px 0 0;">
        <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:0.08em;text-transform:uppercase;">แจ้งเตือนระบบ</p>
        <p style="margin:0;font-size:18px;font-weight:500;color:#ffffff;">ใบสั่งซื้อใหม่เข้าระบบ</p>
      </div>

      <!-- Body -->
      <div style="border:1px solid #e4e4e7;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">

        <!-- Greeting -->
        <div style="padding:24px 28px;border-bottom:1px solid #e4e4e7;">
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#3f3f46;">
            เรียน ผู้รับผิดชอบ<br><br>
            มีใบสั่งซื้อ (Purchase Order) รายการใหม่เข้ามาในระบบ กรุณาตรวจสอบรายละเอียดด้านล่างและดำเนินการกรอกข้อมูล BOM ภายในระยะเวลาที่กำหนด
          </p>

          <!-- PO Info -->
          <div style="background:#f4f4f5;border-radius:6px;padding:16px 20px;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:500;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">ข้อมูล PO</p>
            <table style="border-collapse:collapse;width:100%;">
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#71717a;width:110px;">เลขที่ PO</td>
                <td style="padding:5px 0;font-size:13px;font-weight:500;">${escapeHtml(data.poNumber ?? '-')}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#71717a;">ลูกค้า</td>
                <td style="padding:5px 0;font-size:13px;font-weight:500;">${escapeHtml(data.customerName ?? '-')}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#71717a;">วันที่รับ</td>
                <td style="padding:5px 0;font-size:13px;font-weight:500;">${today}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Line Items -->
        <div style="padding:20px 28px;border-bottom:1px solid #e4e4e7;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:500;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">รายการสินค้า</p>
          <table style="border-collapse:collapse;width:100%;">
            <thead>
              <tr style="border-bottom:1px solid #e4e4e7;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:500;color:#71717a;">รายการ</th>
                <th style="padding:8px 12px;text-align:right;font-size:12px;font-weight:500;color:#71717a;width:100px;">จำนวน</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <!-- CTA -->
        <div style="padding:20px 28px 24px;">
          <p style="margin:0 0 16px;font-size:13px;color:#71717a;line-height:1.6;">
            กรุณาคลิกปุ่มด้านล่างเพื่อเข้าสู่ระบบและดำเนินการกรอกข้อมูล BOM
          </p>
          <a href="${data.bomUrl}" style="display:inline-block;padding:10px 20px;background:#1a1a2e;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:500;">
            เปิดหน้ากรอก BOM &rarr;
          </a>
        </div>

        <!-- Footer -->
        <div style="padding:14px 28px;background:#f4f4f5;border-top:1px solid #e4e4e7;">
          <p style="margin:0;font-size:11px;color:#a1a1aa;">อีเมลนี้ถูกส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
        </div>

      </div>
    </div>`;
}
