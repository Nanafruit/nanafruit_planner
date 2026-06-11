-- ตาราง metadata ของใบ PO ที่อัพโหลดเข้า SharePoint
-- รันใน Supabase Dashboard → SQL Editor
create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_size bigint not null,
  sharepoint_item_id text not null,
  sharepoint_url text not null,
  uploaded_by_email text not null,
  uploaded_by_name text,
  -- รองรับ pipeline สร้าง BOM ในอนาคต: uploaded -> processing -> bom_created
  status text not null default 'uploaded',
  created_at timestamptz not null default now()
);

-- เข้าถึงผ่าน backend (service role) เท่านั้น — เปิด RLS กันการเข้าถึงด้วย anon key
alter table purchase_orders enable row level security;
