import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type PurchaseOrderRecord = {
  id: string;
  file_name: string;
  file_size: number;
  sharepoint_item_id: string;
  sharepoint_url: string;
  uploaded_by_email: string;
  uploaded_by_name: string | null;
  status: string;
  po_number: string | null;
  po_date: string | null;
  vendor_name: string | null;
  customer_name: string | null;
  currency: string | null;
  subtotal: number | null;
  vat_amount: number | null;
  total_amount: number | null;
  notes: string | null;
  created_at: string;
};

export type NewPurchaseOrder = Omit<
  PurchaseOrderRecord,
  'id' | 'status' | 'created_at'
>;

export type PoLineItemRecord = {
  id: string;
  po_id: string;
  line_no: number;
  description: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  amount: number;
  created_at: string;
};

export type NewPoLineItem = Omit<PoLineItemRecord, 'id' | 'created_at'>;

type Database = {
  public: {
    Tables: {
      purchase_orders: {
        Row: PurchaseOrderRecord;
        Insert: NewPurchaseOrder;
        Update: Partial<NewPurchaseOrder>;
        Relationships: [];
      };
      po_line_items: {
        Row: PoLineItemRecord;
        Insert: NewPoLineItem;
        Update: Partial<NewPoLineItem>;
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
export class SupabaseService {
  private readonly client: SupabaseClient<Database>;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    this.client = createClient<Database>(url, key);
  }

  async insertPurchaseOrder(
    record: NewPurchaseOrder,
  ): Promise<PurchaseOrderRecord> {
    const { data, error } = await this.client
      .from('purchase_orders')
      .insert(record)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to save purchase order: ${error.message}`,
      );
    }
    return data;
  }

  async insertPoLineItems(items: NewPoLineItem[]): Promise<void> {
    if (items.length === 0) {
      return;
    }
    const { error } = await this.client.from('po_line_items').insert(items);
    if (error) {
      throw new InternalServerErrorException(
        `Failed to save purchase order line items: ${error.message}`,
      );
    }
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    await this.client.from('purchase_orders').delete().eq('id', id);
  }

  async listPurchaseOrders(): Promise<PurchaseOrderRecord[]> {
    const { data, error } = await this.client
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to list purchase orders: ${error.message}`,
      );
    }
    return data ?? [];
  }
}
