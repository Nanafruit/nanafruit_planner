import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

export const PoLineItemSchema = z.object({
  product_code: z.string().nullable(),
  description: z.string(),
  quantity: z.number(),
  unit: z.string().nullable(),
});

export const PoExtractionSchema = z.object({
  po_number: z.string().nullable(),
  po_date: z.string().nullable(), // YYYY-MM-DD — วันที่ออกเอกสาร PO
  due_date: z.string().nullable(), // YYYY-MM-DD — วันกำหนดส่งมอบ
  expiry_date: z.string().nullable(), // YYYY-MM-DD — วันหมดอายุของใบ PO
  vendor_name: z.string().nullable(),
  customer_name: z.string().nullable(),
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
              text: [
                'Extract the purchase order details from this document. Use null for any field that is not present in the document.',
                '',
                'Field notes:',
                '- po_date: the date the PO document itself was issued (may be labeled "PO date", "order date", "document date", "วันที่เอกสาร", "วันที่ออก PO", etc.)',
                '- due_date: the requested delivery / due date (e.g. "delivery date", "due date", "วันกำหนดส่ง", "วันที่ต้องการรับสินค้า")',
                '- expiry_date: the expiration / validity date of the PO (e.g. "valid until", "expiry date", "วันหมดอายุ")',
                '- line_items.product_code: the product/item/SKU code for each line item, if present',
                '',
                'Do not include any financial amounts (prices, totals, subtotals, taxes, currency) or tax identification numbers in the output.',
              ].join('\n'),
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
