-- ตาราง users สำหรับเก็บ role ของแต่ละคน (RBAC)
-- รันใน Supabase Dashboard → SQL Editor

create type user_role as enum ('admin', 'staff');

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  -- Azure AD object id (payload.oid) — เป็น null ได้จนกว่าจะ login ครั้งแรก
  azure_oid text unique,
  email text unique not null,
  name text,
  role user_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- เข้าถึงผ่าน backend (service role) เท่านั้น — เปิด RLS กันการเข้าถึงด้วย anon key
alter table users enable row level security;

-- seed admin คนแรก เพื่อให้เข้าหน้าจัดการ user ได้ตั้งแต่ login ครั้งแรก
insert into users (email, role)
values ('develop@nanafruit.com', 'admin')
on conflict (email) do update set role = 'admin';
