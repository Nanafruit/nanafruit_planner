"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/app/lib/api-client";

export type BomMaterialPayload = {
  material_name: string;
  quantity: number;
  unit: string | null;
};

export type BomPackagingPayload = {
  packaging_type: string;
  quantity: number;
};

export type BomLinePayload = {
  po_line_item_id: string;
  materials: BomMaterialPayload[];
  packaging: BomPackagingPayload[];
};

export type BomSaveState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function saveBomDraft(
  poId: string,
  lines: BomLinePayload[],
): Promise<BomSaveState> {
  try {
    await apiFetch(`/po/${poId}/bom/draft`, {
      method: "PUT",
      body: JSON.stringify({ lines }),
    });
    revalidatePath(`/po/${poId}/bom`);
    return { status: "success", message: "บันทึก Draft แล้ว" };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "บันทึก Draft ไม่สำเร็จ",
    };
  }
}

export async function submitBom(
  poId: string,
  lines: BomLinePayload[],
): Promise<BomSaveState> {
  try {
    await apiFetch(`/po/${poId}/bom/submit`, {
      method: "POST",
      body: JSON.stringify({ lines }),
    });
    revalidatePath(`/po/${poId}/bom`);
    return { status: "success", message: "ยืนยันส่งข้อมูล BOM สำเร็จ" };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "ส่งข้อมูล BOM ไม่สำเร็จ",
    };
  }
}
