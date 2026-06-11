import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

export const PoLineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unit: z.string().nullable(),
  unit_price: z.number(),
  amount: z.number(),
});

export const PoExtractionSchema = z.object({
  po_number: z.string().nullable(),
  po_date: z.string().nullable(), // YYYY-MM-DD
  vendor_name: z.string().nullable(),
  customer_name: z.string().nullable(),
  currency: z.string().nullable(),
  subtotal: z.number().nullable(),
  vat_amount: z.number().nullable(),
  total_amount: z.number().nullable(),
  notes: z.string().nullable(),
  line_items: z.array(PoLineItemSchema),
});

export type PoExtraction = z.infer<typeof PoExtractionSchema>;

@Injectable()
export class OcrService {
  private readonly client = new Anthropic();

  async extract(file: Buffer): Promise<PoExtraction> {
    const response = await this.client.beta.messages.parse({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: file.toString('base64'),
              },
            },
            {
              type: 'text',
              text: 'Extract the purchase order details from this document. Use null for any field that is not present in the document. Return amounts as plain numbers without currency symbols or thousands separators.',
            },
          ],
        },
      ],
      output_format: betaZodOutputFormat(PoExtractionSchema),
    });

    if (!response.parsed_output) {
      throw new InternalServerErrorException(
        'OCR extraction did not return structured data',
      );
    }
    return response.parsed_output;
  }
}
