import type { PoExtraction } from "./actions";

/**
 * ข้อมูลทดสอบสำหรับ extractPo เมื่อ USE_MOCK_PO_EXTRACT=true
 * วันที่อยู่ในรูปแบบดิบ DD/MM/BBBB เหมือนที่ AI ส่งมาจริง
 * เพื่อให้ flow แปลงผ่าน toIsoDate() เหมือนของจริง
 */
export const mockPoExtraction: PoExtraction = {
  po_number: "BK256812/00033",
  po_date: "16/12/2568",
  due_date: "16/12/2568",
  expiry_date: "15/01/2569",
  vendor_name: "บริษัท นานาฟรุ้ต จำกัด (สำนักงานใหญ่)",
  customer_name: "บริษัท แชงกรี-ลา โฮเต็ล จำกัด (มหาชน)",
  notes: "ออเดอร์แชงกรีล่า ส่งสินค้า 23/12/68 ไปพร้อมสตอว์เบอร์ทั้งหมด",
  line_items: [
    {
      product_code: "FG00023",
      description: "PD NANA Dehydrated Mango 25 g.",
      quantity: 200,
      unit: "ซอง",
    },
    {
      product_code: "FG00017",
      description: "PD NANA Dehydrated Golden Longan 25 g.",
      quantity: 200,
      unit: "ซอง",
    },
    {
      product_code: "FG00006",
      description: "PD NANA Dehydrated Banana 25g.",
      quantity: 200,
      unit: "ซอง",
    },
    {
      product_code: "FG00044",
      description: "PD NANA Dehydrated Strawberry 25 g. (MS)",
      quantity: 200,
      unit: "ซอง",
    },
    {
      product_code: "FG00007",
      description: "PD NANA Dehydrated Banana 50g.",
      quantity: 50,
      unit: "ซอง",
    },
    {
      product_code: "FG00018",
      description: "PD NANA Dehydrated Golden Longan 50 g.",
      quantity: 50,
      unit: "ซอง",
    },
    {
      product_code: "FG00021",
      description: "PD NANA Dehydrated Mango 50 g.",
      quantity: 50,
      unit: "ซอง",
    },
    {
      product_code: "FG00045",
      description: "PD NANA Dehydrated Strawberry 50 g. (MS)",
      quantity: 50,
      unit: "ซอง",
    },
  ],
};
