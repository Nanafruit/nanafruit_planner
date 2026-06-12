import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { BomDraftInput, BomSubmitInput } from './bom-submission.schema';

export type BomStatus = 'draft' | 'submitted';

export type BomFormRecord = {
  id: string;
  po_id: string;
  po_line_item_id: string;
  status: BomStatus;
  created_by_email: string | null;
  updated_by_email: string | null;
  created_at: string;
  updated_at: string;
};

export type BomMaterialRecord = {
  id: string;
  bom_form_id: string;
  material_name: string;
  quantity: number;
  unit: string | null;
  sort_order: number;
};

export type BomPackagingRecord = {
  id: string;
  bom_form_id: string;
  packaging_type: string;
  quantity: number;
  sort_order: number;
};

export type PoHeader = {
  id: string;
  po_number: string | null;
  po_date: string | null;
  due_date: string | null;
  expiry_date: string | null;
  notes: string | null;
};

export type PoLineItem = {
  id: string;
  line_no: number;
  product_code: string | null;
  description: string;
  quantity: number;
  unit: string | null;
};

export type BomLineItemView = {
  line_item: PoLineItem;
  bom: {
    status: BomStatus;
    materials: { material_name: string; quantity: number; unit: string | null }[];
    packaging: { packaging_type: string; quantity: number }[];
  } | null;
};

export type BomForPoView = {
  po: PoHeader;
  lines: BomLineItemView[];
};

type Database = {
  public: {
    Tables: {
      purchase_orders: {
        Row: PoHeader & Record<string, unknown>;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      po_line_items: {
        Row: PoLineItem & { po_id: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      bom_forms: {
        Row: BomFormRecord;
        Insert: Omit<BomFormRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BomFormRecord, 'id' | 'created_at'>>;
        Relationships: [];
      };
      bom_materials: {
        Row: BomMaterialRecord;
        Insert: Omit<BomMaterialRecord, 'id'>;
        Update: never;
        Relationships: [];
      };
      bom_packaging: {
        Row: BomPackagingRecord;
        Insert: Omit<BomPackagingRecord, 'id'>;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

@Injectable()
export class BomSupabaseService {
  private readonly client: SupabaseClient<Database>;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    this.client = createClient<Database>(url, key);
  }

  async getBomForPo(poId: string): Promise<BomForPoView> {
    const { data: po, error: poError } = await this.client
      .from('purchase_orders')
      .select('id, po_number, po_date, due_date, expiry_date, notes')
      .eq('id', poId)
      .maybeSingle();

    if (poError) {
      throw new InternalServerErrorException(
        `Failed to load purchase order: ${poError.message}`,
      );
    }
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    const { data: lineItems, error: lineItemsError } = await this.client
      .from('po_line_items')
      .select('id, line_no, product_code, description, quantity, unit')
      .eq('po_id', poId)
      .order('line_no', { ascending: true });

    if (lineItemsError) {
      throw new InternalServerErrorException(
        `Failed to load line items: ${lineItemsError.message}`,
      );
    }

    const { data: bomForms, error: bomFormsError } = await this.client
      .from('bom_forms')
      .select('id, po_line_item_id, status')
      .eq('po_id', poId);

    if (bomFormsError) {
      throw new InternalServerErrorException(
        `Failed to load BOM forms: ${bomFormsError.message}`,
      );
    }

    const bomFormIds = (bomForms ?? []).map((form) => form.id);

    const [materialsResult, packagingResult] = await Promise.all([
      bomFormIds.length > 0
        ? this.client
            .from('bom_materials')
            .select('bom_form_id, material_name, quantity, unit, sort_order')
            .in('bom_form_id', bomFormIds)
            .order('sort_order', { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      bomFormIds.length > 0
        ? this.client
            .from('bom_packaging')
            .select('bom_form_id, packaging_type, quantity, sort_order')
            .in('bom_form_id', bomFormIds)
            .order('sort_order', { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (materialsResult.error) {
      throw new InternalServerErrorException(
        `Failed to load BOM materials: ${materialsResult.error.message}`,
      );
    }
    if (packagingResult.error) {
      throw new InternalServerErrorException(
        `Failed to load BOM packaging: ${packagingResult.error.message}`,
      );
    }

    const materialsByForm = new Map<string, NonNullable<BomLineItemView['bom']>['materials']>();
    for (const row of materialsResult.data ?? []) {
      const list = materialsByForm.get(row.bom_form_id) ?? [];
      list.push({ material_name: row.material_name, quantity: row.quantity, unit: row.unit });
      materialsByForm.set(row.bom_form_id, list);
    }

    const packagingByForm = new Map<string, NonNullable<BomLineItemView['bom']>['packaging']>();
    for (const row of packagingResult.data ?? []) {
      const list = packagingByForm.get(row.bom_form_id) ?? [];
      list.push({ packaging_type: row.packaging_type, quantity: row.quantity });
      packagingByForm.set(row.bom_form_id, list);
    }

    const bomByLineItem = new Map<string, { id: string; status: BomStatus }>();
    for (const form of bomForms ?? []) {
      bomByLineItem.set(form.po_line_item_id, { id: form.id, status: form.status });
    }

    const lines: BomLineItemView[] = (lineItems ?? []).map((item) => {
      const form = bomByLineItem.get(item.id);
      return {
        line_item: item,
        bom: form
          ? {
              status: form.status,
              materials: materialsByForm.get(form.id) ?? [],
              packaging: packagingByForm.get(form.id) ?? [],
            }
          : null,
      };
    });

    return { po, lines };
  }

  /** เขียนทับ materials/packaging ของแต่ละ line item (upsert bom_forms + replace rows) */
  async saveLines(
    poId: string,
    lines: BomDraftInput['lines'] | BomSubmitInput['lines'],
    status: BomStatus,
    userEmail: string,
  ): Promise<void> {
    const now = new Date().toISOString();

    for (const line of lines) {
      const { data: existing, error: existingError } = await this.client
        .from('bom_forms')
        .select('id, created_by_email')
        .eq('po_line_item_id', line.po_line_item_id)
        .maybeSingle();

      if (existingError) {
        throw new InternalServerErrorException(
          `Failed to load BOM form: ${existingError.message}`,
        );
      }

      let bomFormId: string;
      if (existing) {
        bomFormId = existing.id;
        const { error: updateError } = await this.client
          .from('bom_forms')
          .update({ status, updated_by_email: userEmail, updated_at: now })
          .eq('id', bomFormId);
        if (updateError) {
          throw new InternalServerErrorException(
            `Failed to update BOM form: ${updateError.message}`,
          );
        }
      } else {
        const { data: created, error: insertError } = await this.client
          .from('bom_forms')
          .insert({
            po_id: poId,
            po_line_item_id: line.po_line_item_id,
            status,
            created_by_email: userEmail,
            updated_by_email: userEmail,
          })
          .select('id')
          .single();
        if (insertError || !created) {
          throw new InternalServerErrorException(
            `Failed to create BOM form: ${insertError?.message}`,
          );
        }
        bomFormId = created.id;
      }

      await this.client.from('bom_materials').delete().eq('bom_form_id', bomFormId);
      await this.client.from('bom_packaging').delete().eq('bom_form_id', bomFormId);

      if (line.materials.length > 0) {
        const { error } = await this.client.from('bom_materials').insert(
          line.materials.map((material, index) => ({
            bom_form_id: bomFormId,
            material_name: material.material_name,
            quantity: material.quantity,
            unit: material.unit,
            sort_order: index,
          })),
        );
        if (error) {
          throw new InternalServerErrorException(
            `Failed to save BOM materials: ${error.message}`,
          );
        }
      }

      if (line.packaging.length > 0) {
        const { error } = await this.client.from('bom_packaging').insert(
          line.packaging.map((packaging, index) => ({
            bom_form_id: bomFormId,
            packaging_type: packaging.packaging_type,
            quantity: packaging.quantity,
            sort_order: index,
          })),
        );
        if (error) {
          throw new InternalServerErrorException(
            `Failed to save BOM packaging: ${error.message}`,
          );
        }
      }
    }
  }

  async getLineItemIds(poId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('po_line_items')
      .select('id')
      .eq('po_id', poId);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to load line items: ${error.message}`,
      );
    }
    return (data ?? []).map((row) => row.id);
  }
}
