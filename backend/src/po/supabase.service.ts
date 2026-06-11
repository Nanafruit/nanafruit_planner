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
  created_at: string;
};

export type NewPurchaseOrder = Omit<
  PurchaseOrderRecord,
  'id' | 'status' | 'created_at'
>;

type Database = {
  public: {
    Tables: {
      purchase_orders: {
        Row: PurchaseOrderRecord;
        Insert: NewPurchaseOrder;
        Update: Partial<NewPurchaseOrder>;
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
