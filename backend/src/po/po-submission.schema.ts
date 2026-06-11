import { z } from 'zod';

const nullableString = z.string().trim().min(1).nullable();
const nullableNumber = z.number().nullable();

export const PoSubmissionSchema = z.object({
  po_number: nullableString,
  po_date: nullableString,
  vendor_name: nullableString,
  customer_name: nullableString,
  currency: nullableString,
  subtotal: nullableNumber,
  vat_amount: nullableNumber,
  total_amount: nullableNumber,
  notes: nullableString,
  line_items: z.array(
    z.object({
      description: z.string().trim().min(1),
      quantity: z.number(),
      unit: nullableString,
      unit_price: z.number(),
      amount: z.number(),
    }),
  ),
});

export type PoSubmission = z.infer<typeof PoSubmissionSchema>;
