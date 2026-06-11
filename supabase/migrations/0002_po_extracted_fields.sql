-- เพิ่มฟิลด์ข้อมูลที่ได้จาก OCR + ตารางรายการสินค้า (line items) ของใบ PO
-- รันใน Supabase Dashboard → SQL Editor

alter table purchase_orders
  add column if not exists po_number text,
  add column if not exists po_date date,
  add column if not exists vendor_name text,
  add column if not exists customer_name text,
  add column if not exists currency text,
  add column if not exists subtotal numeric,
  add column if not exists vat_amount numeric,
  add column if not exists total_amount numeric,
  add column if not exists notes text;

create table if not exists po_line_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders (id) on delete cascade,
  line_no integer not null,
  description text not null,
  quantity numeric not null,
  unit text,
  unit_price numeric not null,
  amount numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists po_line_items_po_id_idx on po_line_items (po_id);

-- เข้าถึงผ่าน backend (service role) เท่านั้น — เปิด RLS กันการเข้าถึงด้วย anon key
alter table po_line_items enable row level security;
