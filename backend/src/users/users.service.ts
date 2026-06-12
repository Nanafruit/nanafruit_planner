import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '../auth/permissions';

export type UserRecord = {
  id: string;
  azure_oid: string | null;
  email: string;
  name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRecord;
        Insert: Partial<UserRecord> & { email: string };
        Update: Partial<UserRecord>;
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
export class UsersService {
  private readonly client: SupabaseClient<Database>;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    this.client = createClient<Database>(url, key);
  }

  // login ครั้งแรก: match ด้วย azure_oid ก่อน, ถ้าไม่เจอลอง match ด้วย email
  // (เผื่อ user ที่ถูก seed ไว้ล่วงหน้าโดยยังไม่มี oid) แล้วค่อยสร้างใหม่
  async findOrCreateByOid(
    oid: string,
    email: string,
    name: string,
  ): Promise<UserRecord> {
    const { data: byOid } = await this.client
      .from('users')
      .select('*')
      .eq('azure_oid', oid)
      .maybeSingle();
    if (byOid) {
      return byOid;
    }

    const { data: byEmail } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (byEmail) {
      const { data: updated, error } = await this.client
        .from('users')
        .update({ azure_oid: oid, name, updated_at: new Date().toISOString() })
        .eq('id', byEmail.id)
        .select()
        .single();
      if (error) {
        throw new InternalServerErrorException(
          `Failed to link user: ${error.message}`,
        );
      }
      return updated;
    }

    const { data: created, error } = await this.client
      .from('users')
      .insert({ azure_oid: oid, email, name, role: 'staff' })
      .select()
      .single();
    if (error) {
      throw new InternalServerErrorException(
        `Failed to create user: ${error.message}`,
      );
    }
    return created;
  }

  async findAll(): Promise<UserRecord[]> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to list users: ${error.message}`,
      );
    }
    return data ?? [];
  }

  async updateRole(id: string, role: UserRole): Promise<UserRecord> {
    const { data, error } = await this.client
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update role: ${error.message}`,
      );
    }
    return data;
  }
}
