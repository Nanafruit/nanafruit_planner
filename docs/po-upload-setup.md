# PO Upload — ขั้นตอน setup ที่ต้องทำก่อนใช้งาน

ฟีเจอร์อัพโหลดใบ PO (หน้า `/po/upload`) ต้องการการตั้งค่า manual 2 ส่วนก่อนถึงจะทำงานได้

## 1. Azure Portal (App Registration)

### 1.1 Expose an API (จำเป็น — ไม่ทำ login จะพัง)

frontend ขอ scope `api://<client-id>/access_as_user` ตอน login (ดู `frontend/auth.ts`)
ดังนั้นต้องสร้าง scope นี้ก่อน:

1. Azure Portal → App registrations → เลือกแอป → **Expose an API**
2. ตั้ง **Application ID URI** เป็นค่า default: `api://<client-id>`
3. **Add a scope**:
   - Scope name: `access_as_user`
   - Who can consent: Admins and users
   - ตั้ง display name / description ตามสะดวก → Enable
4. ไปที่ **API permissions** → Add a permission → **My APIs** → เลือกแอปตัวเอง →
   เลือก `access_as_user` → Grant admin consent

### 1.2 Access token version ต้องเป็น v2

backend validate token ด้วย issuer `https://login.microsoftonline.com/<tenant>/v2.0`
(ดู `backend/src/auth/jwt.strategy.ts`) ดังนั้น token ที่ออกให้ API ต้องเป็น v2:

1. App registration → **Manifest**
2. ตรวจว่า `"requestedAccessTokenVersion": 2` (ถ้าเป็น `null` หรือ `1` ให้แก้เป็น `2`)

### 1.3 Application permission สำหรับอัพโหลดเข้า SharePoint

backend ใช้ client credentials (app-only) เรียก Microsoft Graph:

1. App registration → **API permissions** → Add a permission → Microsoft Graph →
   **Application permissions** → `Sites.ReadWrite.All`
   (หรือ `Sites.Selected` แล้ว grant สิทธิ์ราย site ถ้าต้องการจำกัดขอบเขต)
2. กด **Grant admin consent**

### หมายเหตุเรื่อง scope ตอน login

access token หนึ่งใบออกให้ได้ทีละ resource เดียว จึง**ห้าม**ใส่ scope ของ
Microsoft Graph (เช่น `User.Read`) ปนกับ scope ของ API ตัวเองใน request เดียวกัน
— จะเจอ error `AADSTS28002` ตอน login ข้อมูลโปรไฟล์ (ชื่อ/อีเมล) มาจาก ID token
อยู่แล้ว ไม่ต้องใช้ `User.Read`

## 2. Supabase

รัน SQL ใน Supabase Dashboard → SQL Editor:

ไฟล์: `supabase/migrations/0001_create_purchase_orders.sql`

ตารางที่ได้: `purchase_orders` (เปิด RLS ไว้ — เข้าถึงผ่าน backend ที่ใช้
service role key เท่านั้น)

## 3. Environment variables ที่ใช้

### `backend/.env` (มี key ครบแล้ว ตรวจค่าให้ถูก)

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` | validate JWT + ขอ app-only token เรียก Graph |
| `SHAREPOINT_DRIVE_ID` | drive ปลายทางที่เก็บไฟล์ (`SHAREPOINT_SITE_ID` ยังไม่ถูกใช้ในโค้ด) |
| `SHAREPOINT_FOLDER_PATH` | โฟลเดอร์ย่อยใน drive เช่น `PO` (เว้นว่าง = root) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | บันทึก/อ่านตาราง `purchase_orders` |

### `frontend/.env.local`

ใช้ค่า `AUTH_*` เดิม ไม่ต้องเพิ่มอะไร (`NEXT_PUBLIC_BACKEND_URL` ตั้งได้ถ้า
backend ไม่ได้อยู่ที่ `http://localhost:3001`)

## Flow การทำงาน

```
ผู้ใช้เลือกไฟล์ PDF ที่ /po/upload
  → Server Action (frontend/app/po/upload/actions.ts) ตรวจชนิด/ขนาดไฟล์
  → POST /po/upload ไป backend พร้อม Bearer token
  → backend ตรวจ JWT + magic bytes %PDF
  → อัพโหลดเข้า SharePoint (Graph upload session, ชื่อซ้ำจะ rename อัตโนมัติ)
  → insert metadata ลง Supabase (status = 'uploaded')
  → ถ้า insert พลาด จะลบไฟล์ออกจาก SharePoint ให้เอง (ไม่ทิ้งไฟล์กำพร้า)
```
