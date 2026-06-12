-- เพิ่ม role 'production' + ตาราง BOM (รายการวัตถุดิบ/Packaging ต่อ line item ของ PO)
-- รันใน Supabase Dashboard → SQL Editor

alter type user_role add value if not exists 'production';

create table if not exists bom_forms (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders (id) on delete cascade,
  po_line_item_id uuid not null unique references po_line_items (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  created_by_email text,
  updated_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bom_forms_po_id_idx on bom_forms (po_id);

create table if not exists bom_materials (
  id uuid primary key default gen_random_uuid(),
  bom_form_id uuid not null references bom_forms (id) on delete cascade,
  material_name text not null,
  quantity numeric not null,
  unit text,
  sort_order integer not null default 0
);

create index if not exists bom_materials_bom_form_id_idx on bom_materials (bom_form_id);

create table if not exists bom_packaging (
  id uuid primary key default gen_random_uuid(),
  bom_form_id uuid not null references bom_forms (id) on delete cascade,
  packaging_type text not null,
  quantity numeric not null,
  sort_order integer not null default 0
);

create index if not exists bom_packaging_bom_form_id_idx on bom_packaging (bom_form_id);

-- เข้าถึงผ่าน backend (service role) เท่านั้น — เปิด RLS กันการเข้าถึงด้วย anon key
alter table bom_forms enable row level security;
alter table bom_materials enable row level security;
alter table bom_packaging enable row level security;
