import Link from "next/link";
import Navbar from "../../../components/navbar";
import { apiFetch } from "@/app/lib/api-client";
import BomForm from "./bom-form";

export interface PoHeader {
  id: string;
  po_number: string | null;
  po_date: string | null;
  due_date: string | null;
  expiry_date: string | null;
  notes: string | null;
}

export interface PoLineItem {
  id: string;
  line_no: number;
  product_code: string | null;
  description: string;
  quantity: number;
  unit: string | null;
}

export interface BomData {
  status: "draft" | "submitted";
  materials: { material_name: string; quantity: number; unit: string | null }[];
  packaging: { packaging_type: string; quantity: number }[];
}

export interface BomLineItemView {
  line_item: PoLineItem;
  bom: BomData | null;
}

export interface BomForPoView {
  po: PoHeader;
  lines: BomLineItemView[];
}

export default async function PoBomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = (await apiFetch(`/po/${id}/bom`)) as BomForPoView;

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Link
          href="/production/bom"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          ← กลับไปหน้าหลัก
        </Link>
        <div className="my-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">กรอกข้อมูล BOM</h1>
            <p className="mt-1 text-sm text-zinc-500">
              PO เลขที่ {data.po.po_number ?? "-"} — กรอกรายการวัตถุดิบและ
              Packaging ให้ครบทุกรายการสินค้า ก่อนกดยืนยันส่ง
            </p>
          </div>
        </div>
        <BomForm poId={id} data={data} />
      </main>
    </div>
  );
}
