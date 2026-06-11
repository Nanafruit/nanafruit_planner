import { z } from 'zod';

const nullableString = z.string().trim().min(1).nullable();

export const PoSubmissionSchema = z.object({
  po_number: nullableString,
  po_date: nullableString,
  due_date: nullableString,
  expiry_date: nullableString,
  vendor_name: nullableString,
  customer_name: nullableString,
  notes: nullableString,
  line_items: z.array(
    z.object({
      product_code: nullableString,
      description: z.string().trim().min(1),
      quantity: z.number(),
      unit: nullableString,
    }),
  ),
});

export type PoSubmission = z.infer<typeof PoSubmissionSchema>;
