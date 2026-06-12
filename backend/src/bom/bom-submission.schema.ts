import { z } from 'zod';

const materialSchema = z.object({
  material_name: z.string().trim().min(1),
  quantity: z.number(),
  unit: z.string().trim().min(1).nullable(),
});

const packagingSchema = z.object({
  packaging_type: z.string().trim().min(1),
  quantity: z.number(),
});

const bomLineSchema = z.object({
  po_line_item_id: z.string().uuid(),
  materials: z.array(materialSchema),
  packaging: z.array(packagingSchema),
});

// บันทึก draft — กรอกบางรายการหรือบางช่องยังไม่ครบก็ได้
export const BomDraftSchema = z.object({
  lines: z.array(bomLineSchema),
});

export type BomDraftInput = z.infer<typeof BomDraftSchema>;

// ยืนยันส่ง — แต่ละ line item ต้องมีวัตถุดิบและ packaging อย่างน้อย 1 รายการ
export const BomSubmitSchema = z.object({
  lines: z
    .array(
      bomLineSchema.extend({
        materials: z.array(materialSchema).min(1),
        packaging: z.array(packagingSchema).min(1),
      }),
    )
    .min(1),
});

export type BomSubmitInput = z.infer<typeof BomSubmitSchema>;
